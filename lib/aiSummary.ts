/**
 * Rule-based market summary — no API key required.
 * Generates a plain-English explanation from quote, news, and market context.
 */

import { AISummaryResult, MarketContext, NewsArticle, StockQuote } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

export async function generateAISummary(
  quote: StockQuote,
  news: NewsArticle[],
  marketCtx: MarketContext
): Promise<AISummaryResult> {
  const cacheKey = `summary:${quote.ticker}`;
  const cached = cacheGet<AISummaryResult>(cacheKey);
  if (cached) return { ...cached, cached: true };

  const up = quote.changePercent >= 0;
  const direction = up ? "up" : "down";
  const absPct = Math.abs(quote.changePercent).toFixed(2);
  const pctNum = parseFloat(absPct);

  const currSym = (code: string) => {
    const map: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", SEK: "kr ",
      JPY: "¥", HKD: "HK$", CAD: "CA$", AUD: "A$",
      INR: "₹", CNY: "¥",
    };
    return map[code] ?? `${code} `;
  };
  const sym = currSym(quote.currency);

  // ── Volume analysis ──
  const volRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const volumeLabel =
    volRatio > 2   ? "unusually heavy" :
    volRatio > 1.3 ? "above-average" :
    volRatio < 0.5 ? "very light" :
    volRatio < 0.7 ? "below-average" : "normal";

  // ── 52-week range context ──
  const range52 = quote.high52w - quote.low52w;
  const posIn52w = range52 > 0 ? ((quote.price - quote.low52w) / range52) * 100 : 50;
  const rangeLabel =
    posIn52w > 90 ? "near its 52-week high" :
    posIn52w > 70 ? "in the upper portion of its 52-week range" :
    posIn52w < 10 ? "near its 52-week low" :
    posIn52w < 30 ? "in the lower portion of its 52-week range" : null;

  // ── Market cap label ──
  const mcap = quote.marketCap;
  const capLabel =
    mcap > 200e9  ? "mega-cap" :
    mcap > 10e9   ? "large-cap" :
    mcap > 2e9    ? "mid-cap" :
    mcap > 300e6  ? "small-cap" : "micro-cap";

  // ── News sentiment tilt ──
  const posNews = news.filter((n) => n.sentiment === "positive").length;
  const negNews = news.filter((n) => n.sentiment === "negative").length;
  const sentimentTilt =
    posNews > negNews ? "positive" :
    negNews > posNews ? "negative" : "mixed";

  // ── Headline — more varied ──
  let headline: string;
  if (pctNum > 5) {
    headline = up
      ? `${quote.name} surges ${absPct}% — here's what's driving the rally`
      : `${quote.name} plunges ${absPct}% — what's behind the selloff`;
  } else if (pctNum > 2) {
    headline = up
      ? `${quote.name} climbs ${absPct}% on ${news.length > 0 ? "fresh catalysts" : "broad strength"}`
      : `${quote.name} slides ${absPct}% amid ${sentimentTilt === "negative" ? "negative headlines" : "market weakness"}`;
  } else if (news.length > 0) {
    headline = `${quote.name} ${up ? "edges higher" : "dips"} ${absPct}% — ${news[0].source} reports`;
  } else {
    headline = `${quote.name} ${up ? "ticks up" : "eases"} ${absPct}% in ${volumeLabel} trading`;
  }

  // ── Key reasons ──
  const keyReasons: string[] = [];

  // News bullets with sentiment badges
  news.slice(0, 3).forEach((n) => {
    const badge = n.sentiment === "positive" ? "📈 " : n.sentiment === "negative" ? "📉 " : "";
    keyReasons.push(`${badge}${n.headline}`);
  });

  // Volume insight
  if (volRatio > 1.3 || volRatio < 0.7) {
    const volMult = volRatio.toFixed(1);
    keyReasons.push(
      `📊 Volume is ${volumeLabel} at ${(quote.volume / 1e6).toFixed(1)}M shares (${volMult}× average)`
    );
  }

  // Market context as compact line
  const topIndices = marketCtx.indices.slice(0, 5);
  const indexLine = topIndices
    .map((i) => `${i.name}: ${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(1)}%`)
    .join(", ");
  keyReasons.push(`🌐 Broad market: ${indexLine}`);

  // Sector
  if (marketCtx.sectorPerf) {
    const sp = marketCtx.sectorPerf;
    const sUp = sp.changePercent >= 0;
    keyReasons.push(
      `${sUp ? "🟢" : "🔴"} ${sp.sector} sector ${sUp ? "+" : ""}${sp.changePercent.toFixed(1)}% today`
    );
  }

  // ── Summary paragraph — richer, more structured ──
  const parts: string[] = [];

  // Opening sentence — price action with context
  const magnitudePhrase =
    pctNum > 5  ? (up ? "is surging" : "is tumbling") :
    pctNum > 2  ? (up ? "is rallying" : "is selling off") :
    pctNum > 0.5 ? (up ? "is trading higher" : "is trading lower") :
                   (up ? "is holding steady with a slight gain" : "is drifting slightly lower");

  parts.push(
    `${quote.name} (${quote.ticker}) ${magnitudePhrase}, at ${sym}${quote.price.toFixed(2)} — ` +
    `${direction} ${absPct}% from yesterday's close of ${sym}${quote.previousClose.toFixed(2)}.`
  );

  // News catalyst paragraph
  if (news.length >= 2) {
    const topHeadlines = news.slice(0, 2).map((n) => `"${n.headline}"`).join(" and ");
    parts.push(
      `Today's move appears driven by recent headlines, including ${topHeadlines}. ` +
      `News sentiment around ${quote.ticker} is leaning ${sentimentTilt}.`
    );
  } else if (news.length === 1) {
    parts.push(
      `The key headline today is "${news[0].headline}" (${news[0].source}), ` +
      `which carries a ${news[0].sentiment} tone.`
    );
  } else {
    parts.push(
      `No major news catalyst has been identified — the move may be driven by broader market flows, ` +
      `sector rotation, or technical factors.`
    );
  }

  // Volume color
  if (volRatio > 1.3) {
    parts.push(
      `Trading volume is ${volumeLabel} at ${(quote.volume / 1e6).toFixed(1)}M shares, ` +
      `${volRatio.toFixed(1)}× the average — suggesting strong conviction behind today's move.`
    );
  } else if (volRatio < 0.7) {
    parts.push(
      `Volume is ${volumeLabel} at ${(quote.volume / 1e6).toFixed(1)}M shares, ` +
      `which may indicate limited participation.`
    );
  }

  // Market environment
  const marketMood =
    marketCtx.marketSentiment === "risk-off" ? "under pressure" :
    marketCtx.marketSentiment === "risk-on"  ? "in risk-on mode" : "mixed";
  parts.push(`The broader market is ${marketMood} (${indexLine}).`);

  // Sector
  if (marketCtx.sectorPerf) {
    const sp = marketCtx.sectorPerf;
    const sDir = sp.changePercent >= 0 ? "up" : "down";
    parts.push(
      `The ${sp.sector} sector is ${sDir} ${Math.abs(sp.changePercent).toFixed(1)}% today, ` +
      `${Math.sign(sp.changePercent) === Math.sign(quote.changePercent) ? "moving in line with" : "diverging from"} ${quote.ticker}.`
    );
  }

  // 52-week range color
  if (rangeLabel) {
    parts.push(
      `The stock is currently ${rangeLabel} (${sym}${quote.low52w.toFixed(2)} – ${sym}${quote.high52w.toFixed(2)}).`
    );
  }

  parts.push("Past performance does not guarantee future results.");

  const summary = parts.join(" ");

  const result: AISummaryResult = {
    headline,
    summary,
    keyReasons: keyReasons.slice(0, 6),
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  cacheSet(cacheKey, result, TTL.AI_SUMMARY);
  return result;
}
