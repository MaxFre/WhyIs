import { NewsArticle } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import clsx from "clsx";

interface Props {
  articles: NewsArticle[];
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "badge-up",
  negative: "badge-down",
  neutral:  "badge-neutral",
};

const SENTIMENT_DOT: Record<string, string> = {
  positive: "bg-green-500",
  negative: "bg-red-500",
  neutral:  "bg-gray-500",
};

export default function NewsList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="card text-gray-500 text-sm text-center py-8">
        No recent news found for this ticker.
      </div>
    );
  }

  // Count sentiment distribution
  const counts = articles.reduce(
    (acc, a) => {
      acc[a.sentiment] = (acc[a.sentiment] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">📰</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Recent News
        </span>
        <div className="ml-auto flex gap-2 text-xs">
          {Object.entries(counts).map(([s, n]) => (
            <span key={s} className={SENTIMENT_BADGE[s]}>
              <span className={clsx("w-1.5 h-1.5 rounded-full inline-block", SENTIMENT_DOT[s])} />
              {n} {s}
            </span>
          ))}
        </div>
      </div>

      <ul className="space-y-4">
        {articles.map((article) => (
          <li key={article.id} className="group">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-xl hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-700 -mx-3"
            >
              <div className="flex items-start gap-3">
                {article.image && (
                  <Image
                    src={article.image}
                    alt=""
                    width={64}
                    height={48}
                    className="object-cover rounded-lg shrink-0 opacity-80"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug text-gray-200 group-hover:text-white transition-colors line-clamp-2">
                    {article.headline}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>{article.source}</span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(article.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span
                      className={clsx(
                        "ml-auto px-2 py-0.5 rounded-full font-semibold",
                        SENTIMENT_BADGE[article.sentiment]
                      )}
                    >
                      {article.sentiment}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
