import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TickerSearch from "@/components/TickerSearch";
import MoversBanner from "@/components/MoversBanner";
// import AdSlot from "@/components/AdSlot";
import { getMarketContext } from "@/lib/marketContext";

export const metadata: Metadata = {
  title: "Why Is Your Stock Up or Down Today? | WhyIs",
  description:
    "Find out why any stock is up or down today. Search any ticker for a real-time AI explanation — breaking news, market context, and a plain-English summary. Covers US, Europe, and Asian markets.",
  alternates: { canonical: "/" },
  keywords: [
    "why is stock up", "why is stock down", "stock price today",
    "stock movement explained", "AI stock analysis", "stock news today",
    "why is AAPL up", "why is TSLA down", "stock market today",
  ],
};

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.whyisstock.com";

// WebSite schema — enables Google sitelinks searchbox
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WhyIs",
  url: BASE,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE}/stocks/{search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

// Organization schema
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WhyIs Finance",
  url: BASE,
  logo: `${BASE}/icon.svg`,
  sameAs: [],
};

// FAQ schema — targets common "why is stock" queries
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is my stock up or down today?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Stock prices move due to breaking news, earnings reports, analyst upgrades or downgrades, sector-wide trends, and broader market movements. WhyIs analyses all of these signals in real time and gives you a plain-English summary for any ticker.",
      },
    },
    {
      "@type": "Question",
      name: "How does WhyIs explain stock movements?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WhyIs combines live price data, the latest news headlines, and market context (indices, sector performance) to generate an AI-powered summary that explains what is driving the stock price today.",
      },
    },
    {
      "@type": "Question",
      name: "Which stock markets does WhyIs cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WhyIs covers stocks from the United States (NYSE, NASDAQ), China (Shanghai, Hong Kong), Japan (TSE), United Kingdom (LSE), India (NSE, BSE), Germany (XETRA, FSE), and Sweden (Nasdaq Stockholm).",
      },
    },
    {
      "@type": "Question",
      name: "Is WhyIs stock analysis free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, WhyIs is completely free. Search any ticker to get an instant AI explanation of today's stock price movement — no account required.",
      },
    },
  ],
};

// Popular US tickers to seed the homepage
const TRENDING = [
  "AAPL", "NVDA", "TSLA", "MSFT", "AMZN",
  "META", "GOOGL", "NFLX", "AMD", "SPY",
];

// ItemList schema — helps Google show trending tickers as a carousel / list
const trendingListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Popular Stock Searches",
  itemListElement: TRENDING.map((ticker, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `Why is ${ticker} stock up or down today?`,
    url: `${BASE}/stocks/${ticker}`,
  })),
};

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getPulseCopy(sentiment: "risk-on" | "risk-off" | "neutral", averageChange: number) {
  if (sentiment === "risk-on") {
    return `Global indices are leaning positive today, with the broad market up ${formatPercent(averageChange)} on average.`;
  }

  if (sentiment === "risk-off") {
    return `Markets are defensive today, with the broad index basket down ${formatPercent(averageChange)} on average.`;
  }

  return `Markets are mixed today, with the broad index basket close to flat at ${formatPercent(averageChange)} on average.`;
}

export const revalidate = 900;

export default async function HomePage() {
  const context = await getMarketContext();
  const sortedIndices = [...context.indices].sort((a, b) => b.changePercent - a.changePercent);
  const strongestIndex = sortedIndices[0];
  const weakestIndex = sortedIndices[sortedIndices.length - 1];
  const averageIndexChange = context.indices.length
    ? context.indices.reduce((sum, idx) => sum + idx.changePercent, 0) / context.indices.length
    : 0;
  const positiveMarkets = context.indices.filter((idx) => idx.changePercent > 0).length;
  const pulseTone =
    context.marketSentiment === "risk-on"
      ? "text-green-400 bg-green-500/10 border-green-500/20"
      : context.marketSentiment === "risk-off"
        ? "text-red-400 bg-red-500/10 border-red-500/20"
        : "text-gray-300 bg-gray-500/10 border-gray-500/20";
  const pulseLabel =
    context.marketSentiment === "risk-on"
      ? "Risk-on"
      : context.marketSentiment === "risk-off"
        ? "Risk-off"
        : "Mixed";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:pt-20 pb-24 sm:pb-32">
      {/* Structured data */}
      {[websiteSchema, orgSchema, faqSchema, trendingListSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Hero */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-snug">
          Why is{" "}
          <span className="text-green-400">[stock]</span>
          <br />
          <span className="text-green-400 italic">Up</span>
          {" or "}
          <span className="text-red-400 italic">Down</span>
          {" today?"}
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Search any ticker to instantly see why it&apos;s moving — AI-powered news analysis,
          market context, and a plain-English explanation.
        </p>
      </div>

      <div className="relative mb-10">
        {/* Today's Market Pulse */}
        <section className="mb-6 rounded-2xl border border-gray-800 bg-gray-950/80 p-5 text-left shadow-2xl shadow-black/20 sm:p-6 xl:absolute xl:left-[calc(100%+0.75rem)] xl:top-0 xl:mb-0 xl:w-[300px]">
          <div className="mb-5 flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Today&apos;s Market Pulse
              </p>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {getPulseCopy(context.marketSentiment, averageIndexChange)}
              </h2>
            </div>
            <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${pulseTone}`}>
              {pulseLabel}
            </span>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Markets Up</p>
              <p className="mt-2 text-2xl font-bold text-white tabular-nums">
                {positiveMarkets} of {context.indices.length}
              </p>
              <p className="mt-1 text-sm text-gray-400">major indices are up today</p>
            </div>

            {strongestIndex && (
              <Link
                href="/markets"
                className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 transition-colors hover:border-green-500/50 hover:bg-gray-900"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Strongest</p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-white">{strongestIndex.name}</p>
                  <p className="text-xl font-bold text-green-400 tabular-nums">
                    {formatPercent(strongestIndex.changePercent)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-400">leading today&apos;s index tape</p>
              </Link>
            )}

            {weakestIndex && (
              <Link
                href="/markets"
                className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 transition-colors hover:border-red-500/50 hover:bg-gray-900"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Weakest</p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-white">{weakestIndex.name}</p>
                  <p className={`text-xl font-bold tabular-nums ${weakestIndex.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatPercent(weakestIndex.changePercent)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-400">lagging the global basket</p>
              </Link>
            )}
          </div>
        </section>

        {/* Popular searches */}
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Popular searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map((ticker) => (
              <Link
                key={ticker}
                href={`/stocks/${ticker}`}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-200 transition-colors border border-gray-700 hover:border-gray-500"
              >
                {ticker}
              </Link>
            ))}
          </div>
        </section>

        {/* Search */}
        <div className="mb-6">
          <TickerSearch />
        </div>

        {/* Best / Worst today banner */}
        <MoversBanner />
      </div>

      {/* Markets we cover */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-xs text-gray-400">
        <span className="uppercase tracking-widest font-semibold text-gray-500">Markets we cover:</span>
        {[
          { code: "us", label: "US" },
          { code: "cn", label: "CN" },
          { code: "jp", label: "JP" },
          { code: "gb", label: "UK" },
          { code: "in", label: "IN" },
          { code: "de", label: "DE" },
          { code: "se", label: "SE" },
        ].map(({ code, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <img
              src={`https://flagcdn.com/20x15/${code}.png`}
              srcSet={`https://flagcdn.com/40x30/${code}.png 2x`}
              width={20}
              height={15}
              alt={label}
              className="rounded-sm"
            />
            <span className="font-medium">{label}</span>
          </span>
        ))}
      </div>

      {/* Major Indices */}
      <section className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Major Indices
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {context.indices.map((idx) => {
            const up = idx.changePercent >= 0;
            return (
              <div key={idx.symbol} className="card text-center">
                <div className="flex items-center justify-center gap-2">
                  {idx.flag && <span className="text-base">{idx.flag}</span>}
                  <p className="text-gray-400 text-sm font-medium">{idx.name}</p>
                </div>
                <p
                  className={`text-2xl font-bold mt-2 tabular-nums ${
                    up ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {up ? "+" : ""}
                  {idx.changePercent.toFixed(2)}%
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mt-12 grid sm:grid-cols-3 gap-5">
        {[
          {
            icon: "/icons/realDataIcon.png",
            title: "Real-time data",
            desc: "Price, volume, and intraday changes refreshed every minute.",
          },
          {
            icon: "/icons/aiIcon.png",
            title: "AI summaries",
            desc: "Concise, neutral plain-English explanations of what's driving each move.",
          },
          {
            icon: "/icons/newsIcon.png",
            title: "News & sentiment",
            desc: "Latest headlines with automatic positive/negative tagging.",
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <Image src={f.icon} alt={f.title} width={64} height={64} className="rounded-lg" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Ad unit — commented out for now
      {process.env.NEXT_PUBLIC_AD_SLOT_HOME && (
        <div className="my-8">
          <AdSlot slot={process.env.NEXT_PUBLIC_AD_SLOT_HOME} format="auto" />
        </div>
      )}
      */}

      {/* FAQ — visible section matching JSON-LD schema for double SEO value */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {[
            {
              q: "Why is my stock up or down today?",
              a: "Stock prices move due to breaking news, earnings reports, analyst upgrades or downgrades, sector-wide trends, and broader market movements. WhyIs analyses all of these signals in real time and gives you a plain-English summary for any ticker.",
            },
            {
              q: "How does WhyIs explain stock movements?",
              a: "WhyIs combines live price data, the latest news headlines, and market context (indices, sector performance) to generate an AI-powered summary that explains what is driving the stock price today.",
            },
            {
              q: "Which stock markets does WhyIs cover?",
              a: "WhyIs covers stocks from the United States (NYSE, NASDAQ), China (Shanghai, Hong Kong), Japan (TSE), United Kingdom (LSE), India (NSE, BSE), Germany (XETRA, FSE), and Sweden (Nasdaq Stockholm).",
            },
            {
              q: "Is WhyIs stock analysis free?",
              a: "Yes, WhyIs is completely free. Search any ticker to get an instant AI explanation of today's stock price movement — no account required.",
            },
          ].map(({ q, a }) => (
            <details key={q} className="card group">
              <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                {q}
                <span className="text-gray-500 group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* SEO-rich footer text */}
      <section className="mt-16 text-center">
        <h2 className="text-xl font-semibold mb-3">
          Instant AI Stock Analysis for Every Investor
        </h2>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Whether you&apos;re checking why Tesla is down today, why NVIDIA stock is up after
          earnings, or what&apos;s moving the S&amp;P 500 — WhyIs gives you the answer in
          seconds. Search any ticker from the US, Europe, or Asia and get a real-time,
          AI-generated explanation backed by the latest news and market data.
        </p>
      </section>
    </div>
  );
}
