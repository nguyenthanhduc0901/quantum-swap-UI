"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, ISeriesApi, AreaSeriesPartialOptions } from "lightweight-charts";
import { createChart } from "lightweight-charts";

type Point = { time: number; value: number };

type Props = {
  data: Point[];
  height?: number;
};

export function TokenChart({ data, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#0f172a" }, textColor: "#e2e8f0" },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      crosshair: { mode: 0 },
      height,
    });
    chartRef.current = chart;

    const areaOptions: AreaSeriesPartialOptions = {
      topColor: "rgba(0, 188, 212, 0.4)",
      bottomColor: "rgba(0, 188, 212, 0.0)",
      lineColor: "#00bcd4",
      lineWidth: 2,
    };
    const series = chart.addAreaSeries(areaOptions);
    seriesRef.current = series;
    series.setData(data);

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      const { width } = containerRef.current.getBoundingClientRect();
      chartRef.current.applyOptions({ width });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}


