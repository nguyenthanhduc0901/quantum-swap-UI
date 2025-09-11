"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";

type Point = { time: number; value: number };

type Props = {
  data: Point[];
  height?: number;
};

export function TokenChart({ data, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    let chartLocal: IChartApi | null = null;
    let cleanup: (() => void) | null = null;
    (async () => {
      const lib = await import("lightweight-charts");
      const chart = lib.createChart(containerRef.current as HTMLDivElement, {
        layout: { background: { color: "#0f172a" }, textColor: "#e2e8f0" },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false },
        grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
        crosshair: { mode: 0 },
        height,
      });
      chartRef.current = chart;
      chartLocal = chart;
      // Fallback to line series if area series is unavailable (older/light builds)
      const apiAny = chart as any;
      let series: ISeriesApi<any> | null = null;
      if (typeof apiAny.addAreaSeries === "function") {
        series = apiAny.addAreaSeries({
          topColor: "rgba(0, 188, 212, 0.4)",
          bottomColor: "rgba(0, 188, 212, 0.0)",
          lineColor: "#00bcd4",
          lineWidth: 2,
        });
      } else if (typeof apiAny.addLineSeries === "function") {
        series = apiAny.addLineSeries({ color: "#00bcd4", lineWidth: 2 });
      } else {
        console.warn("lightweight-charts: series API not available in this build");
      }
      seriesRef.current = series as any;
      if (series) {
        series.setData(data);
      }

      const handleResize = () => {
        if (!containerRef.current || !chartRef.current) return;
        const { width } = containerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({ width });
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    })();
    return () => {
      if (cleanup) cleanup();
      if (chartLocal) {
        try { chartLocal.remove(); } catch {}
      }
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height, data]);

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}


