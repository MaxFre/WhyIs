import { AISummaryResult } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface Props {
  summary: AISummaryResult;
  ticker: string;
}

export default function AISummaryCard({ summary, ticker }: Props) {
  const timeAgo = formatDistanceToNow(new Date(summary.generatedAt), {
    addSuffix: true,
  });

  return (
    <div className="card relative overflow-hidden">
      {/* gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 rounded-t-2xl" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-5 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20">
            <span className="text-base">📊</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              AI Summary
            </span>
            <p className="text-[10px] text-gray-600 leading-tight">
              {ticker} · {timeAgo}
            </p>
          </div>
        </div>
        {summary.cached && (
          <span className="text-[10px] text-gray-600 font-mono px-2 py-0.5 rounded-md bg-gray-800/50">cached</span>
        )}
      </div>

      {/* Headline */}
      <h2 className="text-xl font-bold leading-snug mb-4 text-white">
        {summary.headline}
      </h2>

      {/* Summary text — broken into paragraphs at sentence boundaries */}
      <div className="text-sm text-gray-300 leading-relaxed mb-6 space-y-3">
        {splitIntoParagraphs(summary.summary).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-5" />

      {/* Key factors */}
      {summary.keyReasons.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Key Factors
          </h3>
          <div className="space-y-2.5">
            {summary.keyReasons.map((reason, i) => (
              <div
                key={i}
                className="flex gap-3 text-sm text-gray-400 px-3 py-2.5 rounded-xl bg-gray-800/30 border border-gray-800/50"
              >
                <span className="text-gray-600 font-bold tabular-nums shrink-0 mt-px">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/50">
        <p className="text-[10px] text-gray-600">
          Auto-generated analysis · Not financial advice
        </p>
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/50" />
          {timeAgo}
        </div>
      </div>
    </div>
  );
}

/** Split a long summary into ~2-3 paragraphs for readability */
function splitIntoParagraphs(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  if (sentences.length <= 3) return [text];

  const mid = Math.ceil(sentences.length / 2);
  return [
    sentences.slice(0, mid).join(" ").trim(),
    sentences.slice(mid).join(" ").trim(),
  ].filter(Boolean);
}
