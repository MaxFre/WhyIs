/**
 * Stock data via Finnhub (primary).
 * Set FINNHUB_API_KEY in .env.local
 *
 * Finnhub free tier: 60 calls/min
 */

import { Candle, StockQuote } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

const BASE = "https://finnhub.io/api/v1";
const KEY = process.env.FINNHUB_API_KEY ?? "";

// ─── Company profile + quote ──────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Finnhub error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // high
  l: number;   // low
  o: number;   // open
  pc: number;  // previous close
  t: number;   // timestamp
  v?: number;
}

interface FinnhubProfile {
  name: string;
  ticker: string;
  exchange: string;
  currency: string;
  marketCapitalization: number;
  finnhubIndustry: string;
  logo?: string;
}

interface FinnhubMetric {
  metric: {
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "10DayAverageTradingVolume"?: number;
  };
}

export async function getStockQuote(ticker: string): Promise<StockQuote> {
  ticker = ticker.toUpperCase();
  const cacheKey = `quote:${ticker}`;
  const cached = cacheGet<StockQuote>(cacheKey);
  if (cached) return cached;

  const [quote, profile, metrics] = await Promise.all([
    fetchJson<FinnhubQuote>(`${BASE}/quote?symbol=${ticker}&token=${KEY}`),
    fetchJson<FinnhubProfile>(`${BASE}/stock/profile2?symbol=${ticker}&token=${KEY}`),
    fetchJson<FinnhubMetric>(`${BASE}/stock/metric?symbol=${ticker}&metric=all&token=${KEY}`),
  ]);

  if (!quote.c) {
    throw new Error(`No quote data found for ticker "${ticker}"`);
  }

  const result: StockQuote = {
    ticker,
    name: profile.name ?? ticker,
    price: quote.c,
    previousClose: quote.pc,
    change: quote.d,
    changePercent: quote.dp,
    volume: 0, // Finnhub quote endpoint doesn't return volume; use candles
    avgVolume: (metrics.metric["10DayAverageTradingVolume"] ?? 0) * 1_000_000,
    marketCap: profile.marketCapitalization * 1_000_000,
    high52w: metrics.metric["52WeekHigh"] ?? 0,
    low52w: metrics.metric["52WeekLow"] ?? 0,
    sector: profile.finnhubIndustry ?? "Unknown",
    exchange: profile.exchange ?? "NASDAQ",
    currency: profile.currency ?? "USD",
    timestamp: quote.t * 1000,
  };

  cacheSet(cacheKey, result, TTL.QUOTE);
  return result;
}

// ─── Intraday candles ─────────────────────────────────────────────────────────

interface FinnhubCandles {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: string;
}

export async function getIntradayCandles(ticker: string): Promise<Candle[]> {
  ticker = ticker.toUpperCase();
  const cacheKey = `candles:${ticker}`;
  const cached = cacheGet<Candle[]>(cacheKey);
  if (cached) return cached;

  const now = Math.floor(Date.now() / 1000);
  const from = now - 86400; // last 24 h

  const data = await fetchJson<FinnhubCandles>(
    `${BASE}/stock/candle?symbol=${ticker}&resolution=5&from=${from}&to=${now}&token=${KEY}`
  );

  if (data.s !== "ok" || !data.t?.length) return [];

  const candles: Candle[] = data.t.map((t, i) => ({
    time: t,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));

  cacheSet(cacheKey, candles, TTL.CANDLES);
  return candles;
}
