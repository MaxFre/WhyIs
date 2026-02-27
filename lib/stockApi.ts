/**
 * Stock data via Yahoo Finance (no API key required).
 */

import { Candle, StockQuote } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

const YF = "https://query2.finance.yahoo.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; WhyIs/1.0)",
  "Accept": "application/json",
};

async function yfFetch<T>(url: string, revalidate = 60): Promise<T> {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate } });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

type AnyJson = Record<string, any>;

export async function getStockQuote(ticker: string): Promise<StockQuote> {
  ticker = ticker.toUpperCase();
  const cacheKey = `quote:${ticker}`;
  const cached = cacheGet<StockQuote>(cacheKey);
  if (cached) return cached;

  const [chart, summary] = await Promise.all([
    yfFetch<AnyJson>(`${YF}/v8/finance/chart/${ticker}?interval=1d&range=5d`),
    yfFetch<AnyJson>(`${YF}/v10/finance/quoteSummary/${ticker}?modules=assetProfile,summaryDetail`),
  ]);

  const meta: AnyJson = chart.chart?.result?.[0]?.meta ?? {};
  if (!meta.regularMarketPrice) {
    throw new Error(`No quote data found for ticker "${ticker}"`);
  }

  const profile: AnyJson = summary.quoteSummary?.result?.[0] ?? {};
  const asset: AnyJson = profile.assetProfile ?? {};
  const detail: AnyJson = profile.summaryDetail ?? {};

  const price: number = meta.regularMarketPrice;
  const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price;

  const result: StockQuote = {
    ticker,
    name: meta.longName ?? meta.shortName ?? ticker,
    price,
    previousClose: prev,
    change: price - prev,
    changePercent: prev ? ((price - prev) / prev) * 100 : 0,
    volume: meta.regularMarketVolume ?? 0,
    avgVolume: detail.averageVolume?.raw ?? 0,
    marketCap: detail.marketCap?.raw ?? 0,
    high52w: detail.fiftyTwoWeekHigh?.raw ?? 0,
    low52w: detail.fiftyTwoWeekLow?.raw ?? 0,
    sector: asset.sector ?? "Unknown",
    exchange: meta.exchangeName ?? "NASDAQ",
    currency: meta.currency ?? "USD",
    timestamp: (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
  };

  cacheSet(cacheKey, result, TTL.QUOTE);
  return result;
}

export async function getIntradayCandles(ticker: string): Promise<Candle[]> {
  ticker = ticker.toUpperCase();
  const cacheKey = `candles:${ticker}`;
  const cached = cacheGet<Candle[]>(cacheKey);
  if (cached) return cached;

  const data = await yfFetch<AnyJson>(
    `${YF}/v8/finance/chart/${ticker}?interval=5m&range=1d`,
    300
  );

  const result = data.chart?.result?.[0];
  if (!result?.timestamp) return [];

  const q: AnyJson = result.indicators?.quote?.[0] ?? {};
  const candles: Candle[] = (result.timestamp as number[])
    .map((t: number, i: number) => ({
      time: t,
      open: q.open?.[i] ?? 0,
      high: q.high?.[i] ?? 0,
      low: q.low?.[i] ?? 0,
      close: q.close?.[i] ?? 0,
      volume: q.volume?.[i] ?? 0,
    }))
    .filter((c) => c.close > 0);

  cacheSet(cacheKey, candles, TTL.CANDLES);
  return candles;
}
