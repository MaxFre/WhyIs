"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

const MARKET_OPTIONS: { value: string; label: string }[] = [
  { value: "us", label: "S&P" },
  { value: "se", label: "OMX" },
  { value: "uk", label: "FTSE" },
  { value: "de", label: "DAX" },
  { value: "jp", label: "Nikkei" },
  { value: "cn", label: "China" },
  { value: "in", label: "Nifty" },
];

interface Mover {
  ticker: string;
  name: string;
  price?: number;
  changePercent: number;
}

export default function MoversBanner() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState("us");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // All mutable state in a single ref to avoid stale closures
  const state = useRef({
    offset: 0,           // current translateX position
    velocity: 0,         // momentum after release (px/frame)
    autoSpeed: -0.6,     // auto-scroll speed (px/frame, negative = left)
    dragging: false,
    dragStartX: 0,
    dragStartOffset: 0,
    lastPointerX: 0,
    lastPointerTime: 0,
    hasMoved: false,
    hovered: false,
    pointerId: 0,
  });

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

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/movers?market=${selectedMarket}`)
      .then((r) => r.json())
      .then((d) => {
        setGainers(d.gainers ?? []);
        setLosers(d.losers ?? []);
        setLoaded(true);
        // Reset scroll offset on market change
        state.current.offset = 0;
        state.current.velocity = 0;
      })
      .catch(() => setLoaded(true));
  }, [selectedMarket]);

  // Core animation loop
  const tick = useCallback(() => {
    const s = state.current;
    const track = trackRef.current;
    if (!track) { animRef.current = requestAnimationFrame(tick); return; }

    const halfWidth = track.scrollWidth / 2;

    if (s.dragging) {
      // While dragging: nothing to add, offset is set directly in pointer handler
    } else if (Math.abs(s.velocity) > 0.1) {
      // Momentum phase: decelerate
      s.offset += s.velocity;
      s.velocity *= 0.95;
    } else {
      // Auto-scroll (unless hovered)
      s.velocity = 0;
      if (!s.hovered) {
        s.offset += s.autoSpeed;
      }
    }

    // Wrap around for seamless loop
    if (halfWidth > 0) {
      if (s.offset < -halfWidth) s.offset += halfWidth;
      if (s.offset > 0) s.offset -= halfWidth;
    }

    track.style.transform = `translateX(${s.offset}px)`;
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [loaded, tick]);

  // Pointer handlers — attached to the container div
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true;
    s.hasMoved = false;
    s.velocity = 0;
    s.dragStartX = e.clientX;
    s.dragStartOffset = s.offset;
    s.lastPointerX = e.clientX;
    s.lastPointerTime = performance.now();
    s.pointerId = e.pointerId;
    // Do NOT setPointerCapture here — it swallows click events on children.
    // We capture lazily in onPointerMove once drag threshold is crossed.
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.dragStartX;
    if (!s.hasMoved && Math.abs(dx) > 8) {
      s.hasMoved = true;
      // Now that we know it's a drag, capture so we don't lose tracking
      containerRef.current?.setPointerCapture(s.pointerId);
    }
    if (s.hasMoved) {
      s.offset = s.dragStartOffset + dx;
    }

    // Track velocity for momentum
    const now = performance.now();
    const dt = now - s.lastPointerTime;
    if (dt > 0) {
      s.velocity = (e.clientX - s.lastPointerX) / Math.max(dt / 16, 1);
    }
    s.lastPointerX = e.clientX;
    s.lastPointerTime = now;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.hasMoved) {
      try { containerRef.current?.releasePointerCapture(e.pointerId); } catch {}
    }
    s.velocity = Math.max(-15, Math.min(15, s.velocity));
    if (!s.hasMoved) s.velocity = 0;
  }, []);

  if (!loaded || (gainers.length === 0 && losers.length === 0)) return null;

  const allItems = [
    ...gainers.map((m) => ({ ...m, kind: "gainer" as const })),
    { ticker: "", name: "", changePercent: 0, kind: "sep" as const },
    ...losers.map((m) => ({ ...m, kind: "loser" as const })),
    { ticker: "", name: "", changePercent: 0, kind: "sep" as const },
  ];
  const items = [...allItems, ...allItems];

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="relative bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden select-none touch-pan-y"
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-12 bg-gradient-to-r from-gray-950 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-12 bg-gradient-to-l from-gray-950 to-transparent z-20" />

        <div className="flex items-stretch">
          {/* Static label with market dropdown */}
          <div className="shrink-0 flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-3 bg-gray-900/80 border-r border-gray-800 z-30 gap-0.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-green-400 leading-none">
              Top 5
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-red-400 leading-none">
              Bottom 5
            </span>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
            >
              {MARKET_OPTIONS.find((m) => m.value === selectedMarket)?.label ?? "S&P"}
              <svg
                className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

        {/* Scrolling track */}
        <div
          ref={containerRef}
          className="overflow-hidden flex-1 cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div ref={trackRef} className="flex items-center py-2 will-change-transform">
            {items.map((item, i) => {
              if (item.kind === "sep") {
                return (
                  <div key={`sep-${i}`} className="mx-3 h-8 w-px bg-gray-700/50 shrink-0" aria-hidden />
                );
              }

              const up = item.changePercent >= 0;
              const pct = Math.abs(item.changePercent);
              const isTop = i === 0 || i === allItems.length;
              const isBottom = item.kind === "loser" && losers[0] && item.ticker === losers[0].ticker;

              return (
                <Link
                  key={`${item.ticker}-${i}`}
                  href={`/stocks/${item.ticker}`}
                  onClick={(e) => { if (state.current.hasMoved) { e.preventDefault(); e.stopPropagation(); } }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className={`shrink-0 flex items-center gap-2 sm:gap-3 mx-1 px-2 sm:px-4 py-2 rounded-xl transition-all duration-200
                    ${up ? "hover:bg-green-500/10" : "hover:bg-red-500/10"}
                    ${isTop ? "ring-1 ring-green-500/20 bg-green-500/5" : ""}
                    ${isBottom ? "ring-1 ring-red-500/20 bg-red-500/5" : ""}
                  `}
                >
                  <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-bold
                    ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {up ? "▲" : "▼"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs sm:text-sm font-bold leading-tight ${up ? "text-green-400" : "text-red-400"}`}>
                      {item.ticker}
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight truncate max-w-[60px] sm:max-w-[80px]">
                      {item.name}
                    </span>
                  </div>
                  <div className={`ml-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold tabular-nums whitespace-nowrap
                    ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {up ? "+" : "-"}{pct.toFixed(2)}%
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* Dropdown — rendered outside overflow-hidden container */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[100px]">
          {MARKET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSelectedMarket(opt.value);
                setDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                selectedMarket === opt.value
                  ? "text-white bg-gray-800 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
