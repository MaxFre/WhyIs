/**
 * Fetches major US index quotes and sector context via Finnhub.
 */

import { IndexQuote, MarketContext, SectorPerformance } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

const BASE = "https://finnhub.io/api/v1";
const KEY = process.env.FINNHUB_API_KEY ?? "";

const INDICES = [
  { name: "S&P 500",  symbol: "^GSPC" },
  { name: "Nasdaq",   symbol: "^IXIC" },
  { name: "Dow Jones", symbol: "^DJI"  },
];

// Sector ETF proxies
const SECTOR_ETFS: Record<string, string> = {
  "Technology":          "XLK",
  "Health Care":         "XLV",
  "Financials":          "XLF",
  "Consumer Discretionary": "XLY",
  "Consumer Staples":    "XLP",
  "Industrials":         "XLI",
  "Energy":              "XLE",
  "Utilities":           "XLU",
  "Real Estate":         "XLRE",
  "Materials":           "XLB",
  "Communication Services": "XLC",
};

async function fetchQuoteChange(symbol: string): Promise<number> {
  try {
    const res = await fetch(
      `${BASE}/quote?symbol=${symbol}&token=${KEY}`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.dp ?? 0;
  } catch {
    return 0;
  }
}

export async function getMarketContext(sector?: string): Promise<MarketContext> {
  const cacheKey = `mktctx:${sector ?? "none"}`;
  const cached = cacheGet<MarketContext>(cacheKey);
  if (cached) return cached;

  // Fetch indices + optional sector ETF in parallel
  const sectorEtf = sector ? (SECTOR_ETFS[sector] ?? null) : null;
  const symbols = [...INDICES.map((i) => i.symbol), ...(sectorEtf ? [sectorEtf] : [])];

  const changes = await Promise.all(symbols.map(fetchQuoteChange));

  const indices: IndexQuote[] = INDICES.map((idx, i) => ({
    name: idx.name,
    symbol: idx.symbol,
    changePercent: changes[i],
  }));

  let sectorPerf: SectorPerformance | null = null;
  if (sector && sectorEtf) {
    sectorPerf = {
      sector,
      changePercent: changes[INDICES.length],
    };
  }

  // Infer broad sentiment: if 2+ indices are negative → risk-off
  const negCount = indices.filter((i) => i.changePercent < -0.2).length;
  const posCount = indices.filter((i) => i.changePercent > 0.2).length;
  const marketSentiment =
    negCount >= 2 ? "risk-off" : posCount >= 2 ? "risk-on" : "neutral";

  const result: MarketContext = { indices, sectorPerf, marketSentiment };
  cacheSet(cacheKey, result, TTL.MARKET_CONTEXT);
  return result;
}
