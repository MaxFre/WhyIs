/**
 * Lightweight rule-based sentiment scorer.
 * No external API needed — fast and free.
 * For production, swap with a proper NLP or the Finnhub sentiment endpoint.
 */

import { Sentiment } from "@/types";

const POSITIVE = [
  "beat", "beats", "surge", "surges", "rally", "rallies", "gain", "gains",
  "rise", "rises", "up", "upgrade", "upgrades", "buy", "outperform",
  "record", "profit", "revenue growth", "strong", "positive", "optimistic",
  "bullish", "recovery", "recover", "higher", "boost", "boosted",
];

const NEGATIVE = [
  "miss", "misses", "fall", "falls", "drop", "drops", "decline", "declines",
  "down", "downgrade", "downgrades", "sell", "underperform", "weak",
  "loss", "losses", "concern", "risk", "warning", "cut", "cuts",
  "lowered", "disappointing", "below", "bearish", "crash", "fear", "fears",
  "lawsuit", "investigation", "recall", "debt", "layoff", "layoffs",
];

export function scoreSentiment(text: string): { sentiment: Sentiment; score: number } {
  const lower = text.toLowerCase();
  let score = 0;

  for (const word of POSITIVE) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of NEGATIVE) {
    if (lower.includes(word)) score -= 1;
  }

  // Normalize to -1 … 1
  const maxPossible = Math.max(POSITIVE.length, NEGATIVE.length);
  const normalized = Math.max(-1, Math.min(1, score / maxPossible));

  const sentiment: Sentiment =
    normalized > 0.05 ? "positive" : normalized < -0.05 ? "negative" : "neutral";

  return { sentiment, score: normalized };
}
