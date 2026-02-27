/**
 * News via Yahoo Finance search — no API key required.
 */

import { NewsArticle } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";
import { scoreSentiment } from "./sentiment";

const YF = "https://query2.finance.yahoo.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; WhyIs/1.0)",
  "Accept": "application/json",
};

interface YFNewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  thumbnail?: {
    resolutions?: Array<{ url: string; width: number; height: number }>;
  };
}

export async function getTickerNews(
  ticker: string,
  maxArticles = 8
): Promise<NewsArticle[]> {
  ticker = ticker.toUpperCase();
  const cacheKey = `news:${ticker}`;
  const cached = cacheGet<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  const isSE = ticker.endsWith(".ST");

  try {
    const res = await fetch(
      `${YF}/v1/finance/search?q=${ticker}&newsCount=${maxArticles}&language=${isSE ? "sv-SE" : "en-US"}`,
      { headers: HEADERS, next: { revalidate: 600 } }
    );
    if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);

    const data = await res.json();
    const raw: YFNewsItem[] = data.news ?? [];

    const articles = raw.slice(0, maxArticles).map((item): NewsArticle => {
      const { sentiment, score } = scoreSentiment(item.title);
      const thumbs = item.thumbnail?.resolutions ?? [];
      const image = thumbs.sort((a, b) => b.width - a.width)[0]?.url;
      return {
        id: item.uuid,
        headline: item.title,
        summary: "",
        url: item.link,
        source: item.publisher,
        publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
        sentiment,
        sentimentScore: score,
        image,
      };
    });

    cacheSet(cacheKey, articles, TTL.NEWS);
    return articles;
  } catch (err) {
    console.warn(`[newsApi] Failed to fetch news for ${ticker}:`, err);
    return [];
  }
}
