/**
 * Avanza unofficial mobile API — Swedish stocks.
 * No API key required.
 *
 * Avanza tickers (e.g. "ERIC B") are mapped to Yahoo Finance .ST format
 * ("ERIC-B.ST") for compatibility with the rest of the data pipeline.
 */

import { Candle, StockQuote } from "@/types";
import { cacheGet, cacheSet } from "./cache";

const AV = "https://www.avanza.se/_mobile/market";
const CHART_BASE = "https://www.avanza.se/ab/component/highstockchart/getchart";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
};

type AnyJson = Record<string, any>;

// ── Helpers ────────────────────────────────────────────────────────────────────

/** "ERIC B" → "ERIC-B.ST"    "ABB" → "ABB.ST"    "VOLV B" → "VOLV-B.ST" */
export function avanzaSymbolToYahoo(symbol: string): string {
  return symbol.trim().replace(/\s+/g, "-") + ".ST";
}

/** Returns true for tickers like "ERIC-B.ST", "ABB.ST", "VOLV-B.ST" */
export function isSwedishTicker(ticker: string): boolean {
  return ticker.toUpperCase().endsWith(".ST");
}

async function avFetch<T>(url: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Search ─────────────────────────────────────────────────────────────────────

export interface AvanzaSearchHit {
  orderbookId: string;
  name: string;
  yahooTicker: string;   // e.g. "ERIC-B.ST"
  currency: string;      // "SEK"
  marketList: string;    // "Large Cap Stockholm"
}

export async function searchAvanza(query: string): Promise<AvanzaSearchHit[]> {
  const cacheKey = `avanza:search:${query.toLowerCase()}`;
  const cached = cacheGet<AvanzaSearchHit[]>(cacheKey);
  if (cached) return cached;

  const data = await avFetch<AnyJson>(
    `${AV}/search/all?query=${encodeURIComponent(query)}&limit=6`
  );
  if (!data?.hits) return [];

  const results: AvanzaSearchHit[] = (data.hits as AnyJson[])
    .filter((h) => h.link?.type === "STOCK" || h.link?.type === "CERTIFICATE")
    .map((h) => {
      const rawSymbol: string =
        h.metadata?.tickerSymbol ?? h.link?.linkDisplay ?? "";
      return {
        orderbookId: String(h.link?.orderbookId ?? ""),
        name: h.metadata?.name ?? h.link?.linkDisplay ?? "",
        yahooTicker: avanzaSymbolToYahoo(rawSymbol),
        currency: h.metadata?.currency ?? "SEK",
        marketList: h.metadata?.marketList ?? "Stockholm",
      };
    })
    .filter((r) => r.orderbookId && r.name);

  cacheSet(cacheKey, results, 60);
  return results;
}

/** Resolve an orderbookId for a given .ST ticker via Avanza search */
export async function resolveOrderbookId(ticker: string): Promise<string | null> {
  // Strip .ST suffix and convert dashes back to spaces for search
  const base = ticker.replace(/\.ST$/i, "").replace(/-/g, " ");
  const hits = await searchAvanza(base);

  // Find the closest match: prefer exact symbol match
  const yahooUpper = ticker.toUpperCase();
  const exact = hits.find(
    (h) => h.yahooTicker.toUpperCase() === yahooUpper
  );
  if (exact) return exact.orderbookId;

  // Otherwise return first result
  return hits[0]?.orderbookId ?? null;
}

// ── Quote ──────────────────────────────────────────────────────────────────────

export async function getAvanzaQuote(
  orderbookId: string,
  ticker: string
): Promise<StockQuote | null> {
  const data = await avFetch<AnyJson>(`${AV}/stock/${orderbookId}`, 60);
  if (!data?.lastPrice) return null;

  const price: number = data.lastPrice;
  const prev: number = data.previousClosingPrice ?? price;

  return {
    ticker,
    name: data.name ?? ticker,
    price,
    previousClose: prev,
    change: data.change ?? price - prev,
    changePercent:
      data.changePercent ?? (prev ? ((price - prev) / prev) * 100 : 0),
    volume: data.totalVolumeTraded ?? 0,
    avgVolume: 0,
    marketCap: 0,
    high52w: data.highestPrice ?? 0,
    low52w: data.lowestPrice ?? 0,
    sector: data.sector ?? "Unknown",
    exchange: "Stockholm",
    currency: data.currency ?? "SEK",
    timestamp: Date.now(),
  };
}

// ── Candles ────────────────────────────────────────────────────────────────────

export async function getAvanzaCandles(orderbookId: string): Promise<Candle[]> {
  const data = await avFetch<AnyJson>(
    `${CHART_BASE}/orderbook?orderbookId=${orderbookId}` +
      `&chartType=OHLC&resolution=FIVE_MINUTES&timePeriod=TODAY`,
    300
  );
  if (!Array.isArray(data?.ohlcData) || !data.ohlcData.length) return [];

  const volMap = new Map<number, number>();
  if (Array.isArray(data.volumeData)) {
    for (const entry of data.volumeData as [number, number][]) {
      volMap.set(entry[0], entry[1]);
    }
  }

  return (data.ohlcData as [number, number, number, number, number][])
    .map(([ts, open, high, low, close]) => ({
      time: Math.floor(ts / 1000), // Avanza gives ms — convert to seconds
      open,
      high,
      low,
      close,
      volume: volMap.get(ts) ?? 0,
    }))
    .filter((c) => c.close > 0);
}
