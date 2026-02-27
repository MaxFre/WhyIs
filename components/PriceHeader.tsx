import { StockQuote } from "@/types";
import { format } from "date-fns";
import clsx from "clsx";

interface Props {
  quote: StockQuote;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function PriceHeader({ quote }: Props) {
  const isUp = quote.changePercent >= 0;
  const absPct = Math.abs(quote.changePercent).toFixed(2);
  const absChange = Math.abs(quote.change).toFixed(2);

  return (
    <div className="card">
      {/* Company name + ticker */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{quote.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {quote.ticker} · {quote.exchange} · {quote.currency}
          </p>
        </div>
        {quote.sector && quote.sector !== "Unknown" && (
          <span
            className={clsx(
              "text-xs font-semibold px-3 py-1 rounded-full",
              isUp ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
            )}
          >
            {quote.sector}
          </span>
        )}
      </div>

      {/* Price row */}
      <div className="flex flex-wrap items-end gap-4">
        <span className="text-5xl font-extrabold tabular-nums">
          {quote.currency === "USD" ? "$" : ""}
          {fmt(quote.price)}
        </span>
        <div className="mb-1.5">
          <span
            className={clsx(
              "text-xl font-bold",
              isUp ? "text-green-400" : "text-red-400"
            )}
          >
            {isUp ? "▲" : "▼"} {absChange} ({absPct}%)
          </span>
          <p className="text-xs text-gray-500 mt-0.5">
            vs. prev. close ${fmt(quote.previousClose)}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <p className="text-xs text-gray-600 mt-4">
        Last updated {format(new Date(quote.timestamp), "MMM d, yyyy HH:mm")}
      </p>
    </div>
  );
}
