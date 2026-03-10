"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3379757990050247";

interface Props {
  slot: string;
  format?: "auto" | "rectangle" | "leaderboard";
  className?: string;
  /** On mobile (<640px), collapse the ad to a thin horizontal bar (~90px) */
  mobileBanner?: boolean;
}

export default function AdSlot({ slot, format = "auto", className = "", mobileBanner = false }: Props) {
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDev) return;
    try {
      const w = window as unknown as { adsbygoogle: object[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {}
  }, [isDev]);

  const mobileClass = mobileBanner ? "max-h-[90px] sm:max-h-none overflow-hidden" : "";

  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 text-xs text-gray-600 ${mobileClass} ${className}`}
        style={{ minHeight: format === "leaderboard" ? 90 : mobileBanner ? undefined : 250, height: mobileBanner ? undefined : undefined }}
      >
        Advertisement
      </div>
    );
  }

  return (
    <div className={`${mobileClass} ${className}`}>
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
