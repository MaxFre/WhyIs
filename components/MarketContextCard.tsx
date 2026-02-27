import { MarketContext } from "@/types";
import clsx from "clsx";

interface Props {
  context: MarketContext;
}

const SENTIMENT_LABEL: Record<string, { label: string; color: string }> = {
  "risk-on":  { label: "Risk-On 📈", color: "text-green-400" },
  "risk-off": { label: "Risk-Off 📉", color: "text-red-400" },
  "neutral":  { label: "Neutral 😐", color: "text-gray-400" },
};

export default function MarketContextCard({ context }: Props) {
  const mood = SENTIMENT_LABEL[context.marketSentiment];

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🌐</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Market Context
        </span>
        <span className={clsx("ml-auto text-sm font-semibold", mood.color)}>
          {mood.label}
        </span>
      </div>

      {/* Major indices */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {context.indices.map((idx) => {
          const up = idx.changePercent >= 0;
          return (
            <div key={idx.symbol} className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-medium">{idx.name}</p>
              <p
                className={clsx(
                  "text-sm font-bold mt-1 tabular-nums",
                  up ? "text-green-400" : "text-red-400"
                )}
              >
                {up ? "+" : ""}
                {idx.changePercent.toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Sector */}
      {context.sectorPerf && (
        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500">
            Sector: <span className="text-gray-300">{context.sectorPerf.sector}</span>
          </p>
          <p
            className={clsx(
              "text-sm font-bold tabular-nums",
              context.sectorPerf.changePercent >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {context.sectorPerf.changePercent >= 0 ? "+" : ""}
            {context.sectorPerf.changePercent.toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  );
}
