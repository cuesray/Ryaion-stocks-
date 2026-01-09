import React from "react";

/**
 * 🛰️ ChartGate
 * Provides a fixed-height boundary for ResponsiveContainers to prevent
 * layout thrashing and ensure stable rendering.
 */
type ChartGateProps = {
  height?: number;
  children?: React.ReactNode;
};

export default function ChartGate({
  height = 360,
  children,
}: ChartGateProps) {
  return (
    <div
      style={{
        width: "100%",
        height,
        minHeight: height,
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}