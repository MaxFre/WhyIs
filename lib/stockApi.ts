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
  "User-Agent": "Mozilla/5.0 (compatible; WhyIs/1.0)",
  "Accept": "application/json",
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

  // /v7/finance/quote is the definitive source — same data Yahoo's own site uses
  // quoteSummary is optional enrichment (often 403s from server IPs)
  const [quoteRes, summary] = await Promise.all([
    yfFetchSafe<AnyJson>(
      `${YF}/v7/finance/quote?symbols=${ticker}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketVolume,averageDailyVolume10Day,marketCap,fiftyTwoWeekHigh,fiftyTwoWeekLow,longName,shortName,fullExchangeName,currency,financialCurrency,sector`
    ),
    yfFetchSafe<AnyJson>(
      `${YF}/v10/finance/quoteSummary/${ticker}?modules=assetProfile`
    ),
  ]);

  const q: AnyJson =
    quoteRes?.quoteResponse?.result?.[0] ?? {};

  if (!q.regularMarketPrice) {
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

  const result: StockQuote = {
    ticker,
    name: q.longName ?? q.shortName ?? ticker,
    price: q.regularMarketPrice,
    previousClose: q.regularMarketPreviousClose ?? q.regularMarketPrice,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
    avgVolume: q.averageDailyVolume10Day ?? 0,
    marketCap: q.marketCap ?? 0,
    high52w: q.fiftyTwoWeekHigh ?? 0,
    low52w: q.fiftyTwoWeekLow ?? 0,
    sector: asset.sector ?? q.sector ?? "Unknown",
    exchange: q.fullExchangeName ?? "NASDAQ",
    currency: q.financialCurrency ?? q.currency ?? "USD",
    timestamp: (q.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
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
