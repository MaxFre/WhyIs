import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TickerSearch from "@/components/TickerSearch";

export const metadata: Metadata = {
  title: "Why Is Your Stock Up or Down Today?",
  description:
    "Search any ticker to get a real-time AI explanation of today's stock price movement — news, market context, and a plain-English summary.",
};

// Popular US tickers to seed the homepage
const TRENDING = [
  "AAPL", "NVDA", "TSLA", "MSFT", "AMZN",
  "META", "GOOGL", "NFLX", "AMD", "SPY",
];

export default async function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:pt-20 pb-24 sm:pb-32">
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
        <div className="flex flex-wrap gap-3">
          {[
            { flag: "🇺🇸", name: "United States", desc: "NYSE · NASDAQ" },
            { flag: "🇨🇳", name: "China",         desc: "Shanghai · HK" },
            { flag: "🇯🇵", name: "Japan",         desc: "Tokyo (TSE)" },
            { flag: "🇬🇧", name: "United Kingdom", desc: "London (LSE)" },
            { flag: "🇮🇳", name: "India",         desc: "NSE · BSE" },
            { flag: "🇸🇪", name: "Sweden",        desc: "Nasdaq Sthlm" },
          ].map(({ flag, name, desc }) => (
            <div key={name} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700">
              <span className="text-2xl">{flag}</span>
              <div>
                <p className="font-semibold text-sm text-white">{name}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mt-12 grid sm:grid-cols-3 gap-5">
        {[
          {
            icon: "⚡",
            title: "Real-time data",
            desc: "Price, volume, and intraday changes refreshed every minute.",
          },
          {
            icon: "🤖",
            title: "AI summaries",
            desc: "Concise, neutral plain-English explanations of what's driving each move.",
          },
          {
            icon: "📰",
            title: "News & sentiment",
            desc: "Latest headlines with automatic positive/negative tagging.",
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
