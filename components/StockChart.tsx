"use client";

import { useEffect, useRef } from "react";
import { Candle } from "@/types";

interface Props {
  candles: Candle[];
  changePercent: number;
}

export default function StockChart({ candles, changePercent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let chart: ReturnType<typeof import("lightweight-charts")["createChart"]>;

    import("lightweight-charts").then(({ createChart, LineStyle }) => {
      const isUp = changePercent >= 0;
      const upColor   = "#22c55e";
      const downColor = "#ef4444";
      const lineColor = isUp ? upColor : downColor;

      chart = createChart(containerRef.current!, {
        width: containerRef.current!.clientWidth,
        height: 260,
        layout: {
          background: { color: "transparent" },
          textColor: "#6b7280",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: "#1f2937", style: LineStyle.Dotted },
          horzLines: { color: "#1f2937", style: LineStyle.Dotted },
        },
        crosshair: {
          vertLine: { color: "#4b5563", width: 1, style: LineStyle.Dashed },
          horzLine: { color: "#4b5563", width: 1, style: LineStyle.Dashed },
        },
        timeScale: {
          borderColor: "#374151",
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: { borderColor: "#374151" },
      });

      const areaSeries = chart.addAreaSeries({
        lineColor,
        topColor: lineColor + "40",
        bottomColor: lineColor + "04",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const data = candles.map((c) => ({
        time: c.time as unknown as import("lightweight-charts").Time,
        value: c.close,
      }));

      areaSeries.setData(data);
      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    });

    return () => {
      chart?.remove();
    };
  }, [candles, changePercent]);

  if (candles.length === 0) {
    return (
      <div className="card flex items-center justify-center h-[260px] text-gray-600 text-sm">
        Chart data unavailable
      </div>
    );
  }

  return (
    <div className="card !p-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">
        Intraday Chart — 5-min intervals
      </p>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
