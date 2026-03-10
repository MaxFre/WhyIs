"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3379757990050247";

interface Props {
  slot: string;
  /** Separate slot served only on mobile (<640 px). When provided, two independent ad units are rendered. */
  mobileSlot?: string;
  format?: "auto" | "rectangle" | "leaderboard";
  className?: string;
}

export default function AdSlot({ slot, mobileSlot, format = "auto", className = "" }: Props) {
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDev) return;
    const push = () => {
      try {
        const w = window as unknown as { adsbygoogle: object[] };
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch {}
    };
    if (mobileSlot) push(); // mobile unit
    push();                  // desktop unit
  }, [isDev, mobileSlot]);

  if (isDev) {
    return (
      <div className={className}>
        {mobileSlot && (
          <div className="sm:hidden flex items-center justify-center h-[90px] rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 text-xs text-gray-600">
            Ad (mobile)
          </div>
        )}
        <div
          className={`${mobileSlot ? "hidden sm:flex" : "flex"} items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 text-xs text-gray-600`}
          style={{ minHeight: format === "leaderboard" ? 90 : 250 }}
        >
          Advertisement
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {mobileSlot && (
        <div className="sm:hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={mobileSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      )}
      <div className={mobileSlot ? "hidden sm:block" : ""}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
