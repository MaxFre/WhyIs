"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

interface Mover {
  ticker: string;
  name: string;
  changePercent: number;
}

interface Props {
  exchange?: string;
  ticker?: string;
}

const MARKET_OPTIONS: { value: string; label: string }[] = [
  { value: "us", label: "US" },
  { value: "se", label: "Swedish" },
  { value: "uk", label: "UK" },
  { value: "de", label: "German" },
  { value: "jp", label: "Japanese" },
  { value: "cn", label: "Chinese" },
  { value: "in", label: "Indian" },
];

export default function MarketMovers({ exchange, ticker }: Props) {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [resolvedMarket, setResolvedMarket] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const [loaded, setLoaded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // The active market is either user-selected or the auto-resolved one
  const activeMarket = selectedMarket ?? resolvedMarket;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch movers — re-runs when selectedMarket changes or initial exchange/ticker
  useEffect(() => {
    setLoaded(false);
    const params = new URLSearchParams();
    if (selectedMarket) {
      params.set("market", selectedMarket);
    } else {
      if (exchange) params.set("exchange", exchange);
      if (ticker) params.set("ticker", ticker);
    }
    const qs = params.toString();

    fetch(`/api/movers${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        setGainers(d.gainers ?? []);
        setLosers(d.losers ?? []);
        setResolvedMarket(d.market ?? "us");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [exchange, ticker, selectedMarket]);

  if (!loaded) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/50 rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  if (gainers.length === 0 && losers.length === 0) return null;

  const items = tab === "gainers" ? gainers : losers;
  const currentLabel = MARKET_OPTIONS.find((m) => m.value === activeMarket)?.label ?? "US";

  return (
    <div className="card">
      {/* Header with dropdown */}
      <div className="relative mb-3" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((p) => !p)}
          className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
        >
          {currentLabel} Market Movers
          <svg
            className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
            {MARKET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedMarket(opt.value);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  activeMarket === opt.value
                    ? "text-white bg-gray-800 font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                {opt.label} Market
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setTab("gainers")}
          className={`flex-1 text-xs font-bold uppercase tracking-widest py-2 rounded-lg transition-colors ${
            tab === "gainers"
              ? "bg-green-500/15 text-green-400"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          }`}
        >
          ▲ Winners
        </button>
        <button
          onClick={() => setTab("losers")}
          className={`flex-1 text-xs font-bold uppercase tracking-widest py-2 rounded-lg transition-colors ${
            tab === "losers"
              ? "bg-red-500/15 text-red-400"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
          }`}
        >
          ▼ Losers
        </button>
      </div>

      {/* List */}
      <div className="space-y-1">
        {items.map((item, i) => {
          const up = item.changePercent >= 0;
          const pct = Math.abs(item.changePercent);

          return (
            <Link
              key={item.ticker}
              href={`/stocks/${item.ticker}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/70 transition-colors group"
            >
              {/* Rank */}
              <span className="text-xs font-bold text-gray-600 w-4 text-center tabular-nums">
                {i + 1}
              </span>

              {/* Arrow */}
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0
                  ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}
              >
                {up ? "▲" : "▼"}
              </div>

              {/* Ticker + name */}
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className={`text-sm font-bold leading-tight group-hover:underline ${
                    up ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {item.ticker}
                </span>
                <span className="text-xs text-gray-500 leading-tight truncate">
                  {item.name}
                </span>
              </div>

              {/* Change badge */}
              <div
                className={`px-2 py-0.5 rounded-md text-xs font-bold tabular-nums whitespace-nowrap
                  ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}
              >
                {up ? "+" : "-"}{pct.toFixed(2)}%
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
