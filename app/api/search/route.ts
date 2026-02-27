/**
 * GET /api/search?q=chevron
 * Proxies Yahoo Finance quote search — returns ticker + company name matches.
 * Enables name-based and fuzzy/misspelling-tolerant lookup.
 */

import { NextRequest, NextResponse } from "next/server";

const YF_SEARCH =
  "https://query2.finance.yahoo.com/v1/finance/search" +
  "?quotesCount=7&newsCount=0&enableFuzzyQuery=true&quotesQueryId=tss_match_phrase_query";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; WhyIs/1.0)",
  Accept: "application/json",
};

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1)
    return NextResponse.json({ results: [] });

  try {
    const res = await fetch(`${YF_SEARCH}&q=${encodeURIComponent(q)}`, {
      headers: HEADERS,
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    const quotes: any[] = data.quotes ?? [];

    const results: SearchResult[] = quotes
      .filter((q) => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .slice(0, 6)
      .map((q) => ({
        ticker: q.symbol ?? "",
        name: q.longname ?? q.shortname ?? q.symbol ?? "",
        exchange: q.exchDisp ?? q.exchange ?? "",
        type: q.quoteType ?? "",
      }))
      .filter((r) => r.ticker);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
