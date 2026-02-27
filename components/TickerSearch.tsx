"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL",
  "NFLX", "AMD", "INTC", "DIS", "BA", "JPM", "GS", "V",
];

export default function TickerSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = value.trim().toUpperCase();
    if (q.length < 1) {
      setFiltered([]);
      return;
    }
    setFiltered(SUGGESTIONS.filter((s) => s.startsWith(q)).slice(0, 6));
  }, [value]);

  const navigate = (ticker: string) => {
    if (!ticker.trim()) return;
    router.push(`/stocks/${ticker.trim().toUpperCase()}`);
    setValue("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(value);
        }}
        className="flex items-center gap-3 bg-gray-800 border border-gray-700 focus-within:border-green-500 rounded-2xl px-4 py-3 transition-colors"
      >
        <span className="text-gray-500 text-lg">🔍</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Enter a ticker symbol (e.g. AAPL, TSLA)"
          className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl text-sm transition-colors"
        >
          Search
        </button>
      </form>

      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-50 shadow-xl">
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={() => navigate(s)}
                className="w-full text-left px-5 py-3 text-sm hover:bg-gray-700 transition-colors font-mono font-semibold text-green-400"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
