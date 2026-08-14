"use client";

import * as React from "react";

/**
 * GradientMesh — lightweight static gradient background.
 *
 * Provides a subtle, calm, Apple-like atmosphere using static radial gradients.
 * Eliminates continuous full-screen transform calculations and blur repaints,
 * ensuring silky-smooth typing and scrolling performance.
 */
export function GradientMesh() {
  return (
    <div
      aria-hidden="true"
      className="hm-mesh fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Blob 1 — accent-blue, top-left */}
      <div
        className="hm-mesh-blob hm-mesh-blob-1"
        style={
          {
            top: "-10%",
            left: "-5%",
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--accent-blue) 75%, transparent), transparent 70%)",
          } as React.CSSProperties
        }
      />
      {/* Blob 2 — success, top-right */}
      <div
        className="hm-mesh-blob hm-mesh-blob-2"
        style={
          {
            top: "-8%",
            right: "-8%",
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--success) 65%, transparent), transparent 70%)",
          } as React.CSSProperties
        }
      />
      {/* Blob 3 — warning, bottom-left */}
      <div
        className="hm-mesh-blob hm-mesh-blob-3"
        style={
          {
            bottom: "-12%",
            left: "8%",
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--warning) 60%, transparent), transparent 70%)",
          } as React.CSSProperties
        }
      />
      {/* Blob 4 — chart-5 (violet), bottom-right */}
      <div
        className="hm-mesh-blob hm-mesh-blob-4"
        style={
          {
            bottom: "-10%",
            right: "5%",
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--chart-5) 60%, transparent), transparent 70%)",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export default GradientMesh;
