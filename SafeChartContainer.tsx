import React, { useLayoutEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

interface SafeChartContainerProps {
  /** The chart component or elements to render inside the container. */
  children?: React.ReactNode;
  /** Height in pixels or percentage. Numeric values are treated as pixels. 
   * Defaults to "99%" for stabilization. */
  height?: number | string;
  /** Minimum height in pixels or percentage. Defaults to "100%". */
  minHeight?: number | string;
  /** Optional aspect ratio (width / height). */
  aspect?: number;
}

/**
 * 🛰️ SafeChartContainer
 * A high-fidelity wrapper for Recharts that ensures the DOM is ready 
 * and dimensions are non-zero before rendering. Uses the '99%' height trick
 * to prevent ResponsiveContainer feedback loops in flex containers.
 */
export default function SafeChartContainer({
  children,
  height = "99%", // Use 99% for stabilization in flex contexts
  minHeight = "100%",
  aspect,
}: SafeChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observeTarget = containerRef.current;
    
    const validateSize = () => {
      const rect = observeTarget.getBoundingClientRect();
      // Only set ready if we have valid dimensions
      if (rect.width > 0 && rect.height > 0) {
        setIsReady(true);
      }
    };

    validateSize();

    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      
      if (width > 0 && height > 0) {
        setIsReady(true);
      }
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
      resizeObserver.disconnect();
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    // If aspect is set and height is a percentage, we treat height as 'auto' 
    // to allow the ratio to dictate size. If it's a fixed number (px), we respect it.
    height: (aspect && typeof height === 'string' && height.includes('%')) ? "auto" : height,
    minHeight: minHeight,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
  };

  const hasValidChildren = React.Children.count(children) > 0;

  return (
    <div ref={containerRef} style={containerStyle} className="safe-chart-wrapper">
      {!isReady || !hasValidChildren ? (
        <div className="flex-1 bg-white/[0.02] animate-pulse rounded-3xl flex items-center justify-center border border-white/5 min-h-[inherit]">
          <div className="flex flex-col items-center gap-4">
            <i className="fas fa-satellite-dish text-[#A42420]/20 text-4xl"></i>
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-700">
              Calibrating Node...
            </span>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%" aspect={aspect}>
          {children as any}
        </ResponsiveContainer>
      )}
      <style>{`
        .safe-chart-wrapper .recharts-responsive-container {
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}