"use client";

import { useEffect } from "react";

function loadAdSense() {
  if (document.getElementById("adsense-script")) return;
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3379757990050247";
  const s = document.createElement("script");
  s.id = "adsense-script";
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  // Push anchor / vignette overlays to bottom so they don't cover hero on mobile
  s.dataset.overlays = "bottom";
  document.head.appendChild(s);
}

/** Drop this in only the pages where you want ads (homepage + stock pages). */
export default function AdSenseLoader() {
  useEffect(() => {
    // Already consented — load immediately
    if (localStorage.getItem("cookie-consent") === "accepted") {
      loadAdSense();
      return;
    }
    // Wait for user to accept the banner
    const handler = () => loadAdSense();
    window.addEventListener("cookie-consent-accepted", handler);
    return () => window.removeEventListener("cookie-consent-accepted", handler);
  }, []);

  return null;
}
