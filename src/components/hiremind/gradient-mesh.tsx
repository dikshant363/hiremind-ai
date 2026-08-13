"use client";

/**
 * GradientMesh — fixed-position animated gradient mesh background.
 *
 * Renders 4 large blurred color "blobs" that slowly drift around the screen
 * using CSS animations (defined in globals.css). The mesh sits behind all
 * content (z-0, pointer-events-none) and is GPU-friendly — only transform +
 * opacity are animated.
 *
 * Design intent:
 *  - VERY subtle atmosphere — opacity 0.04 in light mode, 0.06 in dark mode.
 *  - Slow drift (20–30s, ease-in-out, infinite alternate) so motion never
 *    distracts from foreground content.
 *  - Respects prefers-reduced-motion (animations disabled via CSS media query).
 *  - Contained to viewport (fixed inset-0 overflow-hidden) so blobs never cause
 *    horizontal scroll even when their transforms push them off-screen.
 *
 * Colors use the HIREMIND semantic tokens so theme changes propagate
 * automatically: accent-blue, success, warning, chart-5.
 */
export function GradientMesh() {
  return (
    <div
      aria-hidden="true"
      className="hm-mesh fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {/* Blob 1 — accent-blue, top-left quadrant */}
      <div
        className="hm-mesh-blob hm-mesh-blob-1"
        style={
          {
            top: "-10%",
            left: "-5%",
            background:
              "radial-gradient(circle at 50% 50%, var(--accent-blue), transparent 70%)",
          } as React.CSSProperties
        }
      />
      {/* Blob 2 — success, top-right quadrant */}
      <div
        className="hm-mesh-blob hm-mesh-blob-2"
        style={
          {
            top: "-8%",
            right: "-8%",
            background:
              "radial-gradient(circle at 50% 50%, var(--success), transparent 70%)",
          } as React.CSSProperties
        }
      />
      {/* Blob 3 — warning, bottom-left quadrant */}
      <div
        className="hm-mesh-blob hm-mesh-blob-3"
        style={
          {
            bottom: "-12%",
            left: "8%",
            background:
              "radial-gradient(circle at 50% 50%, var(--warning), transparent 70%)",
          } as React.CSSProperties
        }
      />
      {/* Blob 4 — chart-5 (violet), bottom-right quadrant */}
      <div
        className="hm-mesh-blob hm-mesh-blob-4"
        style={
          {
            bottom: "-10%",
            right: "5%",
            background:
              "radial-gradient(circle at 50% 50%, var(--chart-5), transparent 70%)",
          } as React.CSSProperties
        }
      />
    </div>
  );
}

export default GradientMesh;
