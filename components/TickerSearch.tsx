"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  flag?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Detect if the query looks like a misspelling vs the best result
// e.g. user typed "chevrron", best result is "Chevron" → show "Did you mean?"
function isMisspelling(query: string, result: SearchResult): boolean {
  const q = query.toLowerCase().replace(/\s+/g, "");
  const name = result.name.toLowerCase().replace(/\s+/g, "");
  const ticker = result.ticker.toLowerCase();
  // Exact match on ticker or name prefix → not a misspelling
  if (ticker.startsWith(q) || name.startsWith(q)) return false;
  // query is quite different from ticker but similar to name → misspelling
  if (q.length >= 4 && !name.includes(q)) return true;
  return false;
}

export default function TickerSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(value, 250);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery.trim());
  }, [debouncedQuery, fetchResults]);

  const navigate = (ticker: string) => {
    if (!ticker.trim()) return;
    router.push(`/stocks/${ticker.trim().toUpperCase()}`);
    setValue("");
    setResults([]);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const doSearch = () => {
    // If top result exists use it, otherwise treat input as raw ticker
    if (results.length > 0) {
      navigate(results[0].ticker);
    } else {
      navigate(value);
    }
  };

  const showDropdown = open && value.trim().length >= 2;
  const showDidYouMean =
    showDropdown &&
    results.length === 1 &&
    isMisspelling(value, results[0]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex items-center gap-3 bg-gray-800 border border-gray-700 focus-within:border-green-500 rounded-2xl px-4 py-3 transition-colors min-w-0"
        >
          <span className="text-gray-500 text-lg">🔍</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder="Ticker or company name…"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-base min-w-0"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <span className="text-gray-500 text-xs animate-pulse shrink-0">…</span>
          )}
        </form>
        <button
          type="button"
          onClick={doSearch}
          className="shrink-0 px-5 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-2xl text-sm transition-colors"
        >
          Search
        </button>
      </div>

      {showDropdown && (showDidYouMean ? (
        /* ── "Did you mean?" single suggestion ── */
        <div className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-50 shadow-xl">
          <button
            type="button"
            onMouseDown={() => navigate(results[0].ticker)}
            className="w-full text-left px-5 py-3 text-sm hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-400">Did you mean </span>
            <span className="text-white font-semibold">{results[0].name}</span>
            <span className="text-green-400 font-mono ml-2">({results[0].ticker})</span>
            <span className="text-gray-500 ml-2">{results[0].exchange}</span>
            <span className="text-gray-400">?</span>
          </button>
        </div>
      ) : results.length > 0 ? (
        /* ── Full dropdown ── */
        <ul className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-50 shadow-xl">
          {results.map((r) => (
            <li key={r.ticker}>
              <button
                type="button"
                onMouseDown={() => navigate(r.ticker)}
                className="w-full text-left px-5 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-green-400 shrink-0 w-14">{r.ticker}</span>
                  <span className="text-sm text-gray-200 truncate">{r.name}</span>
                  {r.flag && <span className="text-base shrink-0">{r.flag}</span>}
                </span>
                <span className="text-xs text-gray-500 shrink-0">{r.exchange}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null)}
    </div>
  );
}
