import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import TickerSearch from "@/components/TickerSearch";
import AdSenseLoader from "@/components/AdSenseLoader";

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

const BASE = "https://www.whyisstock.com";

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

export default async function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:pt-20 pb-24 sm:pb-32">
      {/* Structured data */}
      {[websiteSchema, orgSchema, faqSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <AdSenseLoader />
      {/* Hero */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-snug">
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

      {/* Search */}
      <div className="mb-14">
        <TickerSearch />
      </div>

      {/* Trending */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Popular searches
        </h2>
        <div className="flex flex-wrap gap-2">
          {TRENDING.map((ticker) => (
            <a
              key={ticker}
              href={`/stocks/${ticker}`}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-200 transition-colors border border-gray-700 hover:border-gray-500"
            >
              {ticker}
            </a>
          ))}
        </div>
      </section>

      {/* Countries covered */}
      <section className="mt-16">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Markets covered
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { flag: "🇺🇸", name: "United States", desc: "NYSE · NASDAQ" },
            { flag: "🇨🇳", name: "China",         desc: "Shanghai · HK" },
            { flag: "🇯🇵", name: "Japan",         desc: "Tokyo (TSE)" },
            { flag: "🇬🇧", name: "UK",            desc: "London (LSE)" },
            { flag: "🇮🇳", name: "India",         desc: "NSE · BSE" },
            { flag: "🇩🇪", name: "Germany",       desc: "XETRA · FSE" },
            { flag: "🇸🇪", name: "Sweden",        desc: "Nasdaq Sthlm" },
          ].map(({ flag, name, desc }) => (
            <div key={name} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800 border border-gray-700">
              <span className="shrink-0 w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
                {flag}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate">{desc}</p>
              </div>
            </div>
          ))}
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
    </div>
  );
}
