/**
 * News aggregation via Finnhub company-news endpoint.
 * Falls back to an empty array with a console warning.
 *
 * FINNHUB_API_KEY required.
 */

import { NewsArticle } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";
import { scoreSentiment } from "./sentiment";
import { format, subDays } from "date-fns";

const BASE = "https://finnhub.io/api/v1";
const KEY = process.env.FINNHUB_API_KEY ?? "";

interface FinnhubNews {
  id: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number; // unix seconds
  image?: string;
  category: string;
}

export async function getTickerNews(
  ticker: string,
  maxArticles = 8
): Promise<NewsArticle[]> {
  ticker = ticker.toUpperCase();
  const cacheKey = `news:${ticker}`;
  const cached = cacheGet<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  const today = format(new Date(), "yyyy-MM-dd");
  const from = format(subDays(new Date(), 7), "yyyy-MM-dd"); // last 7 days

  try {
    const res = await fetch(
      `${BASE}/company-news?symbol=${ticker}&from=${from}&to=${today}&token=${KEY}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);

    const raw: FinnhubNews[] = await res.json();
    const articles = raw.slice(0, maxArticles).map((item): NewsArticle => {
      const { sentiment, score } = scoreSentiment(
        `${item.headline} ${item.summary}`
      );
      return {
        id: String(item.id),
        headline: item.headline,
        summary: item.summary?.slice(0, 300) ?? "",
        url: item.url,
        source: item.source,
        publishedAt: new Date(item.datetime * 1000).toISOString(),
        sentiment,
        sentimentScore: score,
        image: item.image,
      };
    });

    cacheSet(cacheKey, articles, TTL.NEWS);
    return articles;
  } catch (err) {
    console.warn(`[newsApi] Failed to fetch news for ${ticker}:`, err);
    return [];
  }
}
