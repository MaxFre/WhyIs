/**
 * GET /api/search?q=chevron
 * Searches Yahoo Finance + Avanza (Swedish stocks) in parallel.
 * Enables name-based, fuzzy, and Swedish company name lookup.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchAvanza } from "@/lib/avanzaApi";

const YF_SEARCH =
  "https://query2.finance.yahoo.com/v1/finance/search" +
  "?quotesCount=7&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://finance.yahoo.com",
  Origin: "https://finance.yahoo.com",
};

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  flag?: string;
}

/** Map a Yahoo Finance ticker suffix or exchange string to a country flag */
function getFlag(ticker: string, exchange: string): string | undefined {
  const t = ticker.toUpperCase();
  const ex = exchange.toUpperCase();
  if (t.endsWith(".ST"))                              return "🇸🇪";
  if (t.endsWith(".T"))                               return "🇯🇵";
  if (t.endsWith(".L"))                               return "🇬🇧";
  if (t.endsWith(".HK"))                              return "🇨🇳";
  if (t.endsWith(".SS") || t.endsWith(".SZ"))         return "🇨🇳";
  if (t.endsWith(".NS") || t.endsWith(".BO"))         return "🇮🇳";
  if (t.endsWith(".PA"))                              return "🇫🇷";
  if (t.endsWith(".DE") || t.endsWith(".F"))          return "🇩🇪";
  if (t.endsWith(".AX"))                              return "🇦🇺";
  if (t.endsWith(".TO") || t.endsWith(".V"))          return "🇨🇦";
  if (ex.includes("JPX") || ex.includes("TKS") || ex.includes("OSA")) return "🇯🇵";
  if (ex.includes("LSE") || ex.includes("LON"))       return "🇬🇧";
  if (ex.includes("HKG") || ex.includes("HKEX"))      return "🇨🇳";
  if (ex.includes("NSE") || ex.includes("BSE") || ex.includes("NSI")) return "🇮🇳";
  if (ex.includes("STO") || ex.includes("OMX"))       return "🇸🇪";
  return undefined;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1)
    return NextResponse.json({ results: [] });

  // Run Yahoo Finance and Avanza searches in parallel
  const [yfRes, avanzaHits] = await Promise.all([
    fetch(`${YF_SEARCH}&q=${encodeURIComponent(q)}`, {
      headers: HEADERS,
      next: { revalidate: 60 },
    }).then((r) => r.ok ? r.json() : { quotes: [] }).catch(() => ({ quotes: [] })),
    searchAvanza(q).catch(() => []),
  ]);

  // Yahoo results
  const yfQuotes: any[] = yfRes.quotes ?? [];
  const yfResults: SearchResult[] = yfQuotes
    .filter((item) => item.quoteType === "EQUITY" || item.quoteType === "ETF")
    .slice(0, 6)
    .map((item) => {
      const ticker: string = item.symbol ?? "";
      const exchange: string = item.exchDisp ?? item.exchange ?? "";
      return {
        ticker,
        name: item.longname ?? item.shortname ?? ticker,
        exchange,
        type: item.quoteType ?? "",
        flag: getFlag(ticker, exchange),
      };
    })
    .filter((r) => r.ticker);

  // Avanza results (Swedish stocks)
  const avResults: SearchResult[] = avanzaHits
    .map((h) => ({
      ticker: h.yahooTicker,
      name: h.name,
      exchange: h.marketList,
      type: "EQUITY",
      flag: getFlag(h.yahooTicker, h.marketList) ?? "🇸🇪",
    }))
    // Deduplicate against Yahoo results
    .filter((a) => !yfResults.some((y) => y.ticker === a.ticker))
    .slice(0, 4);

  // Merge: Yahoo first, then Swedish ones not already present
  const results = [...yfResults, ...avResults].slice(0, 8);

  return NextResponse.json({ results });
}
