import { Metadata } from "next";
import { getMarketContext } from "@/lib/marketContext";
import { format } from "date-fns";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Market Overview — Global Indices & Sectors Today",
  description:
    "Today's performance of major global market indices — S&P 500, Nasdaq, Dow Jones, Nikkei 225, FTSE 100, DAX, and more. Live sector ETF data and market sentiment.",
  alternates: { canonical: "/markets" },
};

const WATCHED_TICKERS = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "META", name: "Meta" },
  { ticker: "GOOGL", name: "Alphabet" },
  { ticker: "AMD",  name: "AMD" },
  { ticker: "NFLX", name: "Netflix" },
  { ticker: "SPY",  name: "S&P 500 ETF" },
];

export default async function MarketsPage() {
  const context = await getMarketContext();
  const today = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-1">Market Overview</h1>
      <p className="text-gray-500 text-sm mb-10">{today}</p>

      {/* Indices */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
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

      {/* Watchlist — links to stock pages */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
          Watchlist
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {WATCHED_TICKERS.map(({ ticker, name }) => (
            <a
              key={ticker}
              href={`/stocks/${ticker}`}
              className="card flex items-center justify-between hover:border-gray-600 transition-colors cursor-pointer group"
            >
              <div>
                <p className="font-semibold text-sm group-hover:text-green-400 transition-colors">
                  {ticker}
                </p>
                <p className="text-xs text-gray-500">{name}</p>
              </div>
              <span className="text-gray-500 group-hover:text-white transition-colors text-sm">
                →
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
