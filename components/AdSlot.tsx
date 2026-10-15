"use client";

import { useEffect, useRef, useState } from "react";

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3379757990050247";

interface Props {
  slot?: string;
  mobileSlot?: string;
  format?: "auto" | "rectangle" | "leaderboard";
  className?: string;
}

export default function AdSlot({ slot, mobileSlot, format = "auto", className = "" }: Props) {
  const isDev = process.env.NODE_ENV === "development";
  const adRef = useRef<HTMLModElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const activeSlot = mobileSlot && isMobile === null ? undefined : isMobile && mobileSlot ? mobileSlot : slot;

  useEffect(() => {
    if (!mobileSlot) return;
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mobileSlot]);

  useEffect(() => {
    if (isDev || !activeSlot) return;
    const push = () => {
      const ad = adRef.current;
      if (localStorage.getItem("cookie-consent") !== "accepted" ||
          !ad || ad.dataset.adRequested || ad.dataset.adsbygoogleStatus || !ad.offsetWidth) return;
      try {
        const adsWindow = window as unknown as { adsbygoogle: object[] };
        (adsWindow.adsbygoogle = adsWindow.adsbygoogle || []).push({});
        ad.dataset.adRequested = "true";
      } catch (error) {
        console.error("Unable to initialize AdSense unit", error);
      }
    };
    push();
    window.addEventListener("cookie-consent-accepted", push);
    return () => window.removeEventListener("cookie-consent-accepted", push);
  }, [isDev, activeSlot]);

  if (!isDev && !activeSlot) return null;

  const height = format === "leaderboard" ? 100 : 250;

  return (
    <div className={`ad-manual min-w-0 ${className}`} role="region" aria-label="Advertisement">
      <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-gray-500">
        Advertisement
      </p>
      <div style={{ minHeight: height }}>
        {isDev ? (
          <div
            className="flex items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/40 text-xs text-gray-500"
            style={{ height }}
          >
            {format === "leaderboard" ? "Banner ad preview" : "Display ad preview"}
          </div>
        ) : (
          <ins
            key={activeSlot}
            ref={adRef}
            className="adsbygoogle"
            style={{ display: "block", height }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={activeSlot}
            data-ad-format={format === "leaderboard" ? "horizontal" : format}
            data-full-width-responsive="true"
          />
        )}
      </div>
    </div>
  );
}
