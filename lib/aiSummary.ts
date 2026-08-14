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
  const summaryDate = new Date(quote.timestamp || Date.now()).toISOString().slice(0, 10);
  const seed = hashText(`${quote.ticker}:${summaryDate}:${direction}:${Math.round(pctNum)}`);

  const currSym = (code: string) => {
    const map: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", SEK: "kr ",
      JPY: "¥", HKD: "HK$", CAD: "CA$", AUD: "A$",
      INR: "₹", CNY: "¥",
    };
    return map[code] ?? `${code} `;
  };
  const sym = currSym(quote.currency);
  const priceNow = `${sym}${quote.price.toFixed(2)}`;
  const previousClose = `${sym}${quote.previousClose.toFixed(2)}`;

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

  const headlineCatalyst =
    news.length > 0 ? news[0].source :
    marketCtx.sectorPerf ? `${marketCtx.sectorPerf.sector.toLowerCase()} sector trading` :
    marketCtx.marketSentiment === "risk-on" ? "risk appetite" :
    marketCtx.marketSentiment === "risk-off" ? "a weaker market tape" : "mixed trading";

  const headline = choose(
    up
      ? [
          `${quote.name} rises ${absPct}% as ${headlineCatalyst} shapes the move`,
          `${quote.name} moves higher by ${absPct}% with investors watching ${headlineCatalyst}`,
          `${quote.name} gains ${absPct}%: news, volume, and market context`,
          `${quote.name} is up ${absPct}% today. Here's the likely setup`,
        ]
      : [
          `${quote.name} falls ${absPct}% as ${headlineCatalyst} weighs on sentiment`,
          `${quote.name} trades lower by ${absPct}% with investors watching ${headlineCatalyst}`,
          `${quote.name} loses ${absPct}%: news, volume, and market context`,
          `${quote.name} is down ${absPct}% today. Here's the likely setup`,
        ],
    seed
  );

  // ── Key reasons ──
  const keyReasons: string[] = [];

  // News bullets
  news.slice(0, 3).forEach((n) => {
    keyReasons.push(`${n.source}: ${n.headline}`);
  });

  // Volume insight
  if (volRatio > 1.3 || volRatio < 0.7) {
    const volMult = volRatio.toFixed(1);
    keyReasons.push(
      `Volume is ${volumeLabel} at ${(quote.volume / 1e6).toFixed(1)}M shares (${volMult}x average)`
    );
  }

  // Market context as compact line
  const topIndices = marketCtx.indices.slice(0, 5);
  const indexLine = topIndices
    .map((i) => `${i.name}: ${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(1)}%`)
    .join(", ");
  keyReasons.push(`Broad market: ${indexLine}`);

  // Sector
  if (marketCtx.sectorPerf) {
    const sp = marketCtx.sectorPerf;
    const sUp = sp.changePercent >= 0;
    keyReasons.push(
      `${sp.sector} sector ${sUp ? "+" : ""}${sp.changePercent.toFixed(1)}% today`
    );
  }

  // ── Summary paragraphs with stable variation ──
  const paragraphs: string[] = [];

  // Opening sentence — price action with context
  const magnitudePhrase =
    pctNum > 5  ? (up ? "is surging" : "is tumbling") :
    pctNum > 2  ? (up ? "is rallying" : "is selling off") :
    pctNum > 0.5 ? (up ? "is trading higher" : "is trading lower") :
                   (up ? "is holding steady with a slight gain" : "is drifting slightly lower");

  const priceSentence = choose(
    [
      `${quote.name} (${quote.ticker}) ${magnitudePhrase} at ${priceNow}, ${direction} ${absPct}% from the previous close of ${previousClose}.`,
      `The stock is at ${priceNow}, a ${absPct}% move ${direction} versus the prior close of ${previousClose}.`,
      `${quote.ticker} is showing a ${absPct}% ${direction === "up" ? "advance" : "decline"} today, putting the latest price near ${priceNow}.`,
    ],
    seed,
    1
  );

  let newsSentence: string;
  if (news.length >= 2) {
    const topHeadlines = news.slice(0, 2).map((n) => `"${n.headline}"`).join(" and ");
    newsSentence = choose(
      [
        `The news backdrop is active, led by ${topHeadlines}; the headline mix is leaning ${sentimentTilt}.`,
        `Recent coverage is part of the setup, especially ${topHeadlines}, leaving sentiment around ${quote.ticker} ${sentimentTilt}.`,
        `Two headlines stand out today: ${topHeadlines}. Taken together, the news tone looks ${sentimentTilt}.`,
      ],
      seed,
      2
    );
  } else if (news.length === 1) {
    newsSentence = choose(
      [
        `The main stock-specific headline is "${news[0].headline}" from ${news[0].source}, with a ${news[0].sentiment} read.`,
        `${news[0].source} is the notable source in today's feed, reporting "${news[0].headline}" with a ${news[0].sentiment} tone.`,
        `There is one clear company-specific headline in the feed: "${news[0].headline}". Its tone screens as ${news[0].sentiment}.`,
      ],
      seed,
      3
    );
  } else {
    newsSentence = choose(
      [
        `There is no obvious company-specific headline in the latest feed, so broader market flows, sector rotation, or technical trading may be doing more of the work.`,
        `With little fresh stock-specific news showing up, the move looks more tied to market context and trading dynamics than a single catalyst.`,
        `The latest feed does not show a major direct catalyst, which makes volume, sector action, and index direction more important here.`,
      ],
      seed,
      4
    );
  }

  let volumeSentence: string | null = null;
  if (volRatio > 1.3) {
    volumeSentence = choose(
      [
        `Volume is ${volumeLabel} at ${(quote.volume / 1e6).toFixed(1)}M shares, about ${volRatio.toFixed(1)}x average, which gives the move more weight.`,
        `The tape is busier than usual: ${(quote.volume / 1e6).toFixed(1)}M shares have traded, roughly ${volRatio.toFixed(1)}x normal volume.`,
        `Participation is elevated, with volume running ${volRatio.toFixed(1)}x average, so this is not just a quiet price drift.`,
      ],
      seed,
      5
    );
  } else if (volRatio < 0.7) {
    volumeSentence = choose(
      [
        `Volume is ${volumeLabel} at ${(quote.volume / 1e6).toFixed(1)}M shares, so the move may have thinner participation behind it.`,
        `Trading activity is light compared with normal levels, which makes the price signal a little less forceful.`,
        `Only ${(quote.volume / 1e6).toFixed(1)}M shares have traded, below the usual pace for ${quote.ticker}.`,
      ],
      seed,
      6
    );
  }

  // Market environment
  const marketMood =
    marketCtx.marketSentiment === "risk-off" ? "under pressure" :
    marketCtx.marketSentiment === "risk-on"  ? "in risk-on mode" : "mixed";
  const marketSentence = choose(
    [
      `The broader market is ${marketMood}, with ${indexLine}.`,
      `Market context matters here: ${indexLine}, leaving the overall tape ${marketMood}.`,
      `Across major indices, ${indexLine}; that puts the market backdrop in a ${marketMood} state.`,
    ],
    seed,
    7
  );

  let sectorSentence: string | null = null;
  if (marketCtx.sectorPerf) {
    const sp = marketCtx.sectorPerf;
    const sDir = sp.changePercent >= 0 ? "up" : "down";
    const sectorRelationship = Math.sign(sp.changePercent) === Math.sign(quote.changePercent) ? "confirming" : "pushing against";
    sectorSentence = choose(
      [
        `The ${sp.sector} sector is ${sDir} ${Math.abs(sp.changePercent).toFixed(1)}%, ${sectorRelationship} the stock's direction.`,
        `Sector performance is ${sDir} ${Math.abs(sp.changePercent).toFixed(1)}% for ${sp.sector}, which ${sectorRelationship === "confirming" ? "supports" : "contrasts with"} today's move in ${quote.ticker}.`,
        `${quote.ticker}'s sector backdrop is ${sDir}, with ${sp.sector} changing ${Math.abs(sp.changePercent).toFixed(1)}% today.`,
      ],
      seed,
      8
    );
  }

  let rangeSentence: string | null = null;
  if (rangeLabel) {
    rangeSentence = choose(
      [
        `On the 52-week range, the stock is ${rangeLabel}, between ${sym}${quote.low52w.toFixed(2)} and ${sym}${quote.high52w.toFixed(2)}.`,
        `Its range position also matters: ${quote.ticker} is ${rangeLabel} after trading between ${sym}${quote.low52w.toFixed(2)} and ${sym}${quote.high52w.toFixed(2)} over the past year.`,
        `That places the latest price ${rangeLabel} within the stock's one-year range.`,
      ],
      seed,
      9
    );
  }

  const contextSentences = [volumeSentence, marketSentence, sectorSentence, rangeSentence].filter(Boolean) as string[];
  const orderedContext = rotate(contextSentences, seed % Math.max(contextSentences.length, 1));

  if (seed % 3 === 0) {
    paragraphs.push(`${priceSentence} ${newsSentence}`);
    paragraphs.push(orderedContext.join(" "));
  } else if (seed % 3 === 1) {
    paragraphs.push(`${newsSentence} ${priceSentence}`);
    paragraphs.push(orderedContext.join(" "));
  } else {
    paragraphs.push(`${priceSentence} ${orderedContext.slice(0, 2).join(" ")}`.trim());
    paragraphs.push([newsSentence, ...orderedContext.slice(2)].join(" "));
  }

  paragraphs.push(choose([
    "This is market context, not financial advice.",
    "Use this as a starting point for research, not as a trading recommendation.",
    "The setup can change quickly as new filings, headlines, and market data arrive.",
  ], seed, 10));

  const summary = paragraphs.filter(Boolean).join("\n\n");

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

function choose<T>(items: T[], seed: number, offset = 0): T {
  return items[Math.abs(seed + offset) % items.length];
}

function rotate<T>(items: T[], count: number): T[] {
  if (items.length === 0) return items;
  const offset = count % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return hash;
}
