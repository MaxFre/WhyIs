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

  // Validate ticker: US (1-5 alphanumeric), or international with known exchange suffix
  const validUS = /^[A-Z0-9]{1,5}$/.test(ticker);
  const validIntl = /^[A-Z0-9][A-Z0-9\-\.]{0,9}\.(ST|T|L|HK|NS|BO|SS|SZ|PA|DE|AX|TO|V|CO|OL|HE|AS|MI|MC|LS|BR|VX)$/.test(ticker);
  if (!validUS && !validIntl) {
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

  const base = "https://www.whyisstock.com";

  // Structured data (JSON-LD) for SEO — Article + BreadcrumbList
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${base}/stocks/${ticker}`,
      },
      headline: `Why Is ${quote.name} Stock ${direction} ${absPct}% Today?`,
      description: aiSummary.summary,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: { "@type": "Organization", name: "WhyIs Finance", url: base },
      publisher: {
        "@type": "Organization",
        name: "WhyIs Finance",
        url: base,
        logo: { "@type": "ImageObject", url: `${base}/icon.svg` },
      },
      about: {
        "@type": "Corporation",
        name: quote.name,
        tickerSymbol: ticker,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Stocks", item: `${base}/markets` },
        { "@type": "ListItem", position: 3, name: ticker, item: `${base}/stocks/${ticker}` },
      ],
    },
  ];

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

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


          </div>
        </div>
      </div>
    </>
  );
}
