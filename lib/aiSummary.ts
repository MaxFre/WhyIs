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

  const direction = quote.changePercent >= 0 ? "up" : "down";
  const absPct = Math.abs(quote.changePercent).toFixed(2);
  const magnitudeWord =
    parseFloat(absPct) > 5  ? "sharply" :
    parseFloat(absPct) > 2  ? "notably" :
    parseFloat(absPct) > 0.5 ? "slightly" : "marginally";

  // Headline
  const headline =
    news.length > 0
      ? `${quote.name} ${direction} ${absPct}% — ${news[0].source} reports`
      : `${quote.name} moves ${direction} ${absPct}% today`;

  // Key reasons
  const keyReasons: string[] = [];
  news.slice(0, 2).forEach((n) => keyReasons.push(n.headline));
  const indexLine = marketCtx.indices
    .map((i) => `${i.name}: ${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(1)}%`)
    .join(", ");
  keyReasons.push(`Broad market: ${indexLine}`);
  if (marketCtx.sectorPerf) {
    keyReasons.push(
      `Sector (${marketCtx.sectorPerf.sector}): ${marketCtx.sectorPerf.changePercent.toFixed(1)}%`
    );
  }

  // Summary paragraph
  let summary =
    `${quote.name} (${quote.ticker}) is trading ${magnitudeWord} ${direction}, ` +
    `at $${quote.price.toFixed(2)} — ${direction} ${absPct}% from yesterday\'s close of $${quote.previousClose.toFixed(2)}. `;

  if (news.length > 0) {
    const topHeadlines = news.slice(0, 2).map((n) => `"${n.headline}"`).join(" and ");
    summary += `Recent news includes ${topHeadlines}. `;
  } else {
    summary += `No specific news catalyst has been identified for today\'s move. `;
  }

  const marketMood =
    marketCtx.marketSentiment === "risk-off" ? "under pressure" :
    marketCtx.marketSentiment === "risk-on"  ? "trending higher" : "mixed";
  summary += `The broader market is ${marketMood} (${indexLine}). `;

  if (marketCtx.sectorPerf) {
    const sDir = marketCtx.sectorPerf.changePercent >= 0 ? "up" : "down";
    summary += `The ${marketCtx.sectorPerf.sector} sector is ${sDir} ${Math.abs(marketCtx.sectorPerf.changePercent).toFixed(1)}% today. `;
  }

  summary += `Past performance does not guarantee future results.`;

  const result: AISummaryResult = {
    headline,
    summary,
    keyReasons: keyReasons.slice(0, 4),
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  cacheSet(cacheKey, result, TTL.AI_SUMMARY);
  return result;
}
