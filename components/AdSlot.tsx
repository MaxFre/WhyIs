"use client";

/**
 * Plug-in AdSense or any ad network here.
 * Currently renders a placeholder box.
 *
 * To enable AdSense:
 *   1. Set NEXT_PUBLIC_ADSENSE_CLIENT in .env.local
 *   2. Replace the placeholder div with <ins class="adsbygoogle" ...>
 */

interface Props {
  slot?: string;
  format?: "auto" | "rectangle" | "leaderboard";
  className?: string;
}

export default function AdSlot({ format = "auto", className = "" }: Props) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!adsenseClient) {
    // Dev placeholder
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 text-xs text-gray-600 ${className}`}
        style={{ minHeight: format === "leaderboard" ? 90 : 250 }}
      >
        Advertisement
      </div>
    );
  }

  // Production: render AdSense unit
  return (
    <div className={className}>
      {/* Add real AdSense ins tag here */}
    </div>
  );
}
