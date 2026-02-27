"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RefreshButton({ ticker }: { ticker: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    router.refresh();
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
      title="Refresh data"
    >
      <svg
        className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0  004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? "Refreshing…" : "Refresh"}
    </button>
  );
}
