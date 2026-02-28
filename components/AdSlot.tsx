"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3379757990050247";

interface Props {
  slot: string;
  format?: "auto" | "rectangle" | "leaderboard";
  className?: string;
}

export default function AdSlot({ slot, format = "auto", className = "" }: Props) {
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDev) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, [isDev]);

  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 text-xs text-gray-600 ${className}`}
        style={{ minHeight: format === "leaderboard" ? 90 : 250 }}
      >
        Advertisement
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
