/**
 * Fetches major US index quotes and sector context via Yahoo Finance.
 * No API key required.
 */

import { IndexQuote, MarketContext, SectorPerformance } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

const YF = "https://query2.finance.yahoo.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com",
  "Origin": "https://finance.yahoo.com",
};

// %5E = ^ (URL-encoded)
const INDICES = [
  { name: "S&P 500",   symbol: "%5EGSPC", displaySymbol: "^GSPC" },
  { name: "Nasdaq",    symbol: "%5EIXIC", displaySymbol: "^IXIC" },
  { name: "Dow Jones", symbol: "%5EDJI",  displaySymbol: "^DJI"  },
];

const SECTOR_ETFS: Record<string, string> = {
  "Technology":             "XLK",
  "Health Care":            "XLV",
  "Financials":             "XLF",
  "Consumer Discretionary": "XLY",
  "Consumer Staples":       "XLP",
  "Industrials":            "XLI",
  "Energy":                 "XLE",
  "Utilities":              "XLU",
  "Real Estate":            "XLRE",
  "Materials":              "XLB",
  "Communication Services": "XLC",
};

async function fetchChangePercent(symbol: string): Promise<number> {
  try {
    const res = await fetch(
      `${YF}/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: HEADERS, next: { revalidate: 120 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta ?? {};
    const price: number = meta.regularMarketPrice ?? 0;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
    if (!prev) return 0;
    return ((price - prev) / prev) * 100;
  } catch {
    return 0;
  }
}

export async function getMarketContext(sector?: string): Promise<MarketContext> {
  const cacheKey = `mktctx:${sector ?? "none"}`;
  const cached = cacheGet<MarketContext>(cacheKey);
  if (cached) return cached;

  const sectorEtf = sector ? (SECTOR_ETFS[sector] ?? null) : null;
  const symbols = [...INDICES.map((i) => i.symbol), ...(sectorEtf ? [sectorEtf] : [])];

  const changes = await Promise.all(symbols.map(fetchChangePercent));

  const indices: IndexQuote[] = INDICES.map((idx, i) => ({
    name: idx.name,
    symbol: idx.displaySymbol,
    changePercent: changes[i],
  }));

  let sectorPerf: SectorPerformance | null = null;
  if (sector && sectorEtf) {
    sectorPerf = { sector, changePercent: changes[INDICES.length] };
  }

  const negCount = indices.filter((i) => i.changePercent < -0.2).length;
  const posCount = indices.filter((i) => i.changePercent > 0.2).length;
  const marketSentiment =
    negCount >= 2 ? "risk-off" : posCount >= 2 ? "risk-on" : "neutral";

  const result: MarketContext = { indices, sectorPerf, marketSentiment };
  cacheSet(cacheKey, result, TTL.MARKET_CONTEXT);
  return result;
}
