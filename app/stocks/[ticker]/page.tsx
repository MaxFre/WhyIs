import { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { getStockQuote, getIntradayCandles } from "@/lib/stockApi";
import { getTickerNews } from "@/lib/newsApi";
import { getMarketContext } from "@/lib/marketContext";
import { generateAISummary } from "@/lib/aiSummary";

import PriceHeader from "@/components/PriceHeader";
import AISummaryCard from "@/components/AISummaryCard";
import StockChart from "@/components/StockChart";
import NewsList from "@/components/NewsList";
import MarketContextCard from "@/components/MarketContextCard";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AdSlot from "@/components/AdSlot";
import RefreshButton from "@/components/RefreshButton";
import TickerSearch from "@/components/TickerSearch";

// ISR: revalidate every 15 minutes
export const revalidate = 900;

interface Props {
  params: { ticker: string };
}

// ─── Dynamic Metadata for SEO ─────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ticker = params.ticker.toUpperCase();
  const today = format(new Date(), "MMMM d, yyyy");

  try {
    const quote = await getStockQuote(ticker);
    const direction = quote.changePercent >= 0 ? "Up" : "Down";
    const absPct = Math.abs(quote.changePercent).toFixed(2);

    return {
      title: `Why Is ${quote.name} Stock ${direction} Today? (${today})`,
      description:
        `${quote.name} (${ticker}) is ${direction.toLowerCase()} ${absPct}% today. ` +
        `Get a real-time AI explanation: latest news, market context, and what's driving the move.`,
      openGraph: {
        title: `Why Is ${quote.name} ${direction} ${absPct}% Today?`,
        description: `AI-powered explanation of ${ticker}'s price movement on ${today}.`,
        type: "article",
        publishedTime: new Date().toISOString(),
      },
      alternates: {
        canonical: `/stocks/${ticker}`,
      },
    };
  } catch {
    return {
      title: `${ticker} Stock Analysis — WhyIs`,
      description: `Real-time analysis and explanation of ${ticker} price movements.`,
    };
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default async function StockPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase();

  // Validate ticker format (1-5 uppercase letters)
  if (!/^[A-Z]{1,5}$/.test(ticker)) {
    notFound();
  }

  let quote, candles, news, marketContext, aiSummary;

  try {
    quote = await getStockQuote(ticker);
    [candles, news, marketContext] = await Promise.all([
      getIntradayCandles(ticker),
      getTickerNews(ticker),
      getMarketContext(quote.sector),
    ]);
    aiSummary = await generateAISummary(quote, news, marketContext);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("No quote data") || msg.includes("404")) {
      notFound();
    }
    throw err;
  }

  const today = format(new Date(), "MMMM d, yyyy");
  const direction = quote.changePercent >= 0 ? "up" : "down";
  const absPct = Math.abs(quote.changePercent).toFixed(2);

  // Structured data (JSON-LD) for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Why Is ${quote.name} Stock ${direction} Today?`,
    description: aiSummary.summary,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: { "@type": "Organization", name: "WhyIs Finance" },
    publisher: {
      "@type": "Organization",
      name: "WhyIs Finance",
      logo: { "@type": "ImageObject", url: "/logo.png" },
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{ticker}</span>
        </nav>

        {/* Page headline */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Why is{" "}
              <span className={quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}>
                {quote.name}
              </span>{" "}
              stock{" "}
              <span className={quote.changePercent >= 0 ? "text-green-400" : "text-red-400"}>
                {direction}
              </span>{" "}
              today?
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">{today}</p>
          </div>
          <RefreshButton ticker={ticker} />
        </div>

        {/* Top ad banner */}
        <AdSlot format="leaderboard" className="mb-6" />

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <PriceHeader quote={quote} />
            <StockChart candles={candles} changePercent={quote.changePercent} />
            <AISummaryCard summary={aiSummary} ticker={ticker} />
            <NewsList articles={news} />
            <DisclaimerBanner />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <MarketContextCard context={marketContext} />

            {/* Sidebar search */}
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Search another stock
              </p>
              <TickerSearch />
            </div>

            {/* Sidebar ad */}
            <AdSlot format="rectangle" />

            {/* Broker affiliate placeholder */}
            <div className="card border-dashed border-brand-700 text-center text-sm text-gray-500 py-6">
              <p className="font-semibold text-gray-400 mb-1">Trade {ticker}</p>
              <p className="text-xs">
                Open an account with one of our broker partners.
              </p>
              <a
                href="#"
                className="mt-3 inline-block px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors"
              >
                View brokers →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
