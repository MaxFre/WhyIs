/**
 * AI-powered summary generation via OpenAI GPT-4o-mini.
 * OPENAI_API_KEY required.
 *
 * Summaries are cached for 15 min and only regenerated when
 * the stock moves more than REGEN_THRESHOLD percent.
 */

import OpenAI from "openai";
import { AISummaryResult, MarketContext, NewsArticle, StockQuote } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

const REGEN_THRESHOLD = 0.5; // regenerate if price moves ≥ 0.5% since last summary

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

function buildPrompt(
  quote: StockQuote,
  news: NewsArticle[],
  marketCtx: MarketContext
): string {
  const direction = quote.changePercent >= 0 ? "up" : "down";
  const absPct = Math.abs(quote.changePercent).toFixed(2);
  const headlines = news
    .slice(0, 5)
    .map((n, i) => `${i + 1}. [${n.sentiment}] ${n.headline}`)
    .join("\n");

  const indexSummary = marketCtx.indices
    .map((i) => `${i.name}: ${i.changePercent >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%`)
    .join(", ");

  const sectorLine = marketCtx.sectorPerf
    ? `Sector (${marketCtx.sectorPerf.sector}): ${marketCtx.sectorPerf.changePercent.toFixed(2)}%`
    : "Sector data unavailable";

  return `You are a concise financial analyst writing for retail investors.

Stock: ${quote.name} (${quote.ticker})
Price: $${quote.price.toFixed(2)} (${direction} ${absPct}% today)
Market sentiment: ${marketCtx.marketSentiment}
Indices: ${indexSummary}
${sectorLine}

Recent news headlines:
${headlines || "No recent news available."}

Write a response with EXACTLY this JSON structure:
{
  "headline": "<10-word punchy headline explaining today's move>",
  "summary": "<100-150 word plain-English explanation of why the stock is ${direction} today. Cover: price move magnitude, relevant news, market context, and sector. Do NOT give investment advice.>",
  "keyReasons": ["<reason 1>", "<reason 2>", "<reason 3>"]
}

Rules:
- Be factual and neutral
- Use simple language
- If no clear reason, say "no single catalyst identified"
- Never recommend buying or selling
- End summary with: "Past performance does not guarantee future results."`;
}

export async function generateAISummary(
  quote: StockQuote,
  news: NewsArticle[],
  marketCtx: MarketContext
): Promise<AISummaryResult> {
  const cacheKey = `ai:${quote.ticker}`;
  const cached = cacheGet<AISummaryResult & { _pricePct: number }>(cacheKey);

  // Return cache unless price has moved significantly since last generation
  if (cached) {
    const drift = Math.abs(quote.changePercent - cached._pricePct);
    if (drift < REGEN_THRESHOLD) {
      return { ...cached, cached: true };
    }
  }

  const prompt = buildPrompt(quote, news, marketCtx);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? "{}");

    const result: AISummaryResult & { _pricePct: number } = {
      headline: raw.headline ?? `Why Is ${quote.name} ${quote.changePercent >= 0 ? "Up" : "Down"} Today?`,
      summary: raw.summary ?? "Summary unavailable.",
      keyReasons: Array.isArray(raw.keyReasons) ? raw.keyReasons.slice(0, 5) : [],
      generatedAt: new Date().toISOString(),
      cached: false,
      _pricePct: quote.changePercent,
    };

    cacheSet(cacheKey, result, TTL.AI_SUMMARY);
    return result;
  } catch (err) {
    console.error("[aiSummary] OpenAI error:", err);
    // Graceful fallback
    return {
      headline: `${quote.name} moves ${Math.abs(quote.changePercent).toFixed(2)}% today`,
      summary:
        `${quote.name} (${quote.ticker}) is trading at $${quote.price.toFixed(2)}, ` +
        `${quote.changePercent >= 0 ? "up" : "down"} ${Math.abs(quote.changePercent).toFixed(2)}% ` +
        `from yesterday's close of $${quote.previousClose.toFixed(2)}. ` +
        (news.length > 0
          ? `Recent news includes: "${news[0].headline}". `
          : "No specific news catalyst has been identified. ") +
        "Market conditions and broader macro factors may be contributing to the move. " +
        "Past performance does not guarantee future results.",
      keyReasons: news.slice(0, 3).map((n) => n.headline),
      generatedAt: new Date().toISOString(),
      cached: false,
    };
  }
}
