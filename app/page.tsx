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
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-32">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-5 leading-tight pt-10">
          Why is{" "}
          <span className="text-green-400">[stock]</span>{" "}
          <span className="relative inline-block">
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-green-400 italic text-3xl sm:text-4xl font-extrabold whitespace-nowrap">
              Up
            </span>
            <span className="text-red-400 italic">Down</span>
          </span>{" "}
          today?
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

      {/* Feature cards */}
      <section className="mt-20 grid sm:grid-cols-3 gap-5">
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
