/**
 * Stock data via Yahoo Finance (primary) + Avanza (fallback for Swedish .ST tickers).
 */

import { Candle, StockQuote } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";
import {
  isSwedishTicker,
  resolveOrderbookId,
  getAvanzaQuote,
  getAvanzaCandles,
} from "./avanzaApi";

const YF = "https://query2.finance.yahoo.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com",
  "Origin": "https://finance.yahoo.com",
};

async function yfFetch<T>(url: string, revalidate = 60): Promise<T> {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate } });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

type AnyJson = Record<string, any>;

async function yfFetchSafe<T>(url: string, revalidate = 60): Promise<T | null> {
  try {
    return await yfFetch<T>(url, revalidate);
  } catch {
    return null;
  }
}

export async function getStockQuote(ticker: string): Promise<StockQuote> {
  ticker = ticker.toUpperCase();
  const cacheKey = `quote:${ticker}`;
  const cached = cacheGet<StockQuote>(cacheKey);
  if (cached) return cached;

  // Try v7/quote first (most accurate), fall back to v8/chart (more permissive from server IPs)
  // Both are used yfFetchSafe so a 403 returns null instead of throwing
  const [quoteRes, chartRes, summary] = await Promise.all([
    yfFetchSafe<AnyJson>(
      `${YF}/v7/finance/quote?symbols=${ticker}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketVolume,averageDailyVolume10Day,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow,longName,shortName,fullExchangeName,currency,financialCurrency,sector`
    ),
    yfFetchSafe<AnyJson>(
      // range=1d so chartPreviousClose = yesterday (accurate change calc)
      `${YF}/v8/finance/chart/${ticker}?interval=1d&range=1d&includePrePost=false`
    ),
    yfFetchSafe<AnyJson>(
      `${YF}/v10/finance/quoteSummary/${ticker}?modules=assetProfile`
    ),
  ]);

  // v7/quote result
  const q: AnyJson = quoteRes?.quoteResponse?.result?.[0] ?? {};

  // v8/chart meta as fallback
  const meta: AnyJson = chartRes?.chart?.result?.[0]?.meta ?? {};

  // Merge: prefer v7 fields, fall back to chart meta
  const price: number = q.regularMarketPrice ?? meta.regularMarketPrice ?? 0;

  if (!price) {
    // Fall back to Avanza for Swedish tickers
    if (isSwedishTicker(ticker)) {
      const orderbookId = await resolveOrderbookId(ticker);
      if (orderbookId) {
        const avQuote = await getAvanzaQuote(orderbookId, ticker);
        if (avQuote) {
          cacheSet(cacheKey, avQuote, TTL.QUOTE);
          return avQuote;
        }
      }
    }
    throw new Error(`No quote data found for ticker "${ticker}"`);
  }

  const asset: AnyJson =
    summary?.quoteSummary?.result?.[0]?.assetProfile ?? {};

  // For change/changePercent: v7 is accurate; chart fallback uses range=1d so
  // chartPreviousClose = yesterday's close (correct, unlike range=5d which was 5 days ago)
  const prev: number =
    q.regularMarketPreviousClose ??
    meta.regularMarketPreviousClose ??
    meta.chartPreviousClose ??
    price;
  const change: number =
    q.regularMarketChange ??
    (meta.regularMarketChange != null ? meta.regularMarketChange : price - prev);
  const changePct: number =
    q.regularMarketChangePercent ??
    (meta.regularMarketChangePercent != null
      ? meta.regularMarketChangePercent
      : prev
      ? ((price - prev) / prev) * 100
      : 0);

  const result: StockQuote = {
    ticker,
    name: q.longName ?? q.shortName ?? meta.longName ?? meta.shortName ?? ticker,
    price,
    previousClose: prev,
    change,
    changePercent: changePct,
    volume: q.regularMarketVolume ?? meta.regularMarketVolume ?? 0,
    avgVolume: q.averageDailyVolume10Day ?? 0,
    marketCap: q.marketCap ?? 0,
    high52w: q.fiftyTwoWeekHigh ?? 0,
    low52w: q.fiftyTwoWeekLow ?? 0,
    sector: asset.sector ?? q.sector ?? "Unknown",
    exchange: q.fullExchangeName ?? meta.exchangeName ?? "NASDAQ",
    currency: q.financialCurrency ?? q.currency ?? meta.currency ?? "USD",
    timestamp: (q.regularMarketTime ?? meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
  };

  // Enrich Swedish tickers via Avanza if company name is missing
  if (isSwedishTicker(ticker) && result.name === ticker) {
    const orderbookId = await resolveOrderbookId(ticker);
    if (orderbookId) {
      const avQuote = await getAvanzaQuote(orderbookId, ticker);
      if (avQuote?.name && avQuote.name !== ticker) {
        result.name = avQuote.name;
        result.exchange = avQuote.exchange;
        if (result.sector === "Unknown") result.sector = avQuote.sector;
      }
    }
  }

  cacheSet(cacheKey, result, TTL.QUOTE);
  return result;
}

export async function getIntradayCandles(ticker: string): Promise<Candle[]> {
  ticker = ticker.toUpperCase();
  const cacheKey = `candles:${ticker}`;
  const cached = cacheGet<Candle[]>(cacheKey);
  if (cached) return cached;

  // Try Yahoo Finance first
  const data = await yfFetchSafe<AnyJson>(
    `${YF}/v8/finance/chart/${ticker}?interval=5m&range=1d`,
    300
  );

  const yfResult = data?.chart?.result?.[0];
  if (yfResult?.timestamp) {
    const q: AnyJson = yfResult.indicators?.quote?.[0] ?? {};
    const candles: Candle[] = (yfResult.timestamp as number[])
      .map((t: number, i: number) => ({
        time: t,
        open: q.open?.[i] ?? 0,
        high: q.high?.[i] ?? 0,
        low: q.low?.[i] ?? 0,
        close: q.close?.[i] ?? 0,
        volume: q.volume?.[i] ?? 0,
      }))
      .filter((c) => c.close > 0);

    if (candles.length > 0) {
      cacheSet(cacheKey, candles, TTL.CANDLES);
      return candles;
    }
  }

  // Avanza fallback for Swedish tickers
  if (isSwedishTicker(ticker)) {
    const orderbookId = await resolveOrderbookId(ticker);
    if (orderbookId) {
      const candles = await getAvanzaCandles(orderbookId);
      if (candles.length > 0) {
        cacheSet(cacheKey, candles, TTL.CANDLES);
        return candles;
      }
    }
  }

  return [];
}
