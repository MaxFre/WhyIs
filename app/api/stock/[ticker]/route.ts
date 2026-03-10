/**
 * GET /api/stock/[ticker]
 * Returns the full page payload: quote + candles + news + market context + AI summary.
 * Used by the client for CSR refresh without a full page reload.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStockQuote, getIntradayCandles } from "@/lib/stockApi";
import { getTickerNews } from "@/lib/newsApi";
import { getMarketContext } from "@/lib/marketContext";
import { generateAISummary } from "@/lib/aiSummary";
import { StockPageData } from "@/types";

export const runtime = "nodejs";
export const revalidate = 60; // ISR 1 min

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();

  const validUS = /^[A-Z0-9]{1,5}$/.test(ticker);
  const validIntl = /^[A-Z0-9][A-Z0-9\-\.]{0,9}\.(ST|T|L|HK|NS|BO|SS|SZ|PA|DE|AX|TO|V|CO|OL|HE|AS|MI|MC|LS|BR|VX)$/.test(ticker);
  if (!validUS && !validIntl) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  try {
    // Fetch quote first — fail fast if ticker invalid
    const quote = await getStockQuote(ticker);

    // All remaining fetches in parallel
    const [candles, news, marketContext] = await Promise.all([
      getIntradayCandles(ticker),
      getTickerNews(ticker),
      getMarketContext(quote.sector),
    ]);

    const aiSummary = await generateAISummary(quote, news, marketContext);

    const payload: StockPageData = {
      quote,
      candles,
      news,
      marketContext,
      aiSummary,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("No quote data") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
