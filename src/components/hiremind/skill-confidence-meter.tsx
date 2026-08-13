"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */
interface SkillConfidenceMeterProps {
  skill: string;
  confidence: number; // 0..1
  level: "strong" | "moderate" | "weak" | "unknown";
  detail?: string;
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Map confidence 0..1 to an angle in radians (π → 0) */
function confToAngle(c: number): number {
  return Math.PI * (1 - Math.max(0, Math.min(1, c)));
}

/** Angle → SVG (x, y) on the arc */
function angleToSVG(angle: number, cx: number, cy: number, r: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

/** Confidence zone */
function getZone(c: number): { label: string; color: string; glow: string } {
  if (c < 0.3) return { label: "Low confidence", color: "var(--critical)", glow: "rgba(220, 50, 50, 0.25)" };
  if (c < 0.6) return { label: "Moderate confidence", color: "var(--warning)", glow: "rgba(220, 170, 50, 0.2)" };
  return { label: "High confidence", color: "var(--success)", glow: "rgba(50, 190, 100, 0.2)" };
}

/** Detail text based on level */
function levelDetail(level: SkillConfidenceMeterProps["level"]): string {
  switch (level) {
    case "strong":
      return "Strong evidence found in profile";
    case "moderate":
      return "Partial evidence from profile";
    case "weak":
      return "Limited evidence — assessment uncertain";
    case "unknown":
      return "No evidence — gap inferred from job reqs";
  }
}

/* ---------------------------------------------------------------------------
 * SVG constants
 * ------------------------------------------------------------------------- */
const CX = 60;
const CY = 58;
const R = 44;
const NEEDLE_R = 36; // needle doesn't reach the arc edge
const VIEW_W = 120;
const VIEW_H = 74;

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */
export function SkillConfidenceMeter({
  skill,
  confidence,
  level,
  detail,
}: SkillConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(1, confidence));
  const zone = getZone(clamped);
  const angle = confToAngle(clamped);
  const needleEnd = angleToSVG(angle, CX, CY, NEEDLE_R);
  const pct = Math.round(clamped * 100);

  /* Zone boundary angles for arc segments */
  const zoneBoundaries = [
    { start: 0, end: 0.3, color: "var(--critical)", opacity: 0.35 },
    { start: 0.3, end: 0.6, color: "var(--warning)", opacity: 0.35 },
    { start: 0.6, end: 1, color: "var(--success)", opacity: 0.35 },
  ];

  return (
    <div className="inline-flex flex-col items-center w-[120px]">
      {/* Gauge */}
      <div className="relative w-[120px] h-[74px]">
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-60 transition-opacity duration-500"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% 80%, ${zone.glow}, transparent 70%)` }}
        />

        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width={VIEW_W}
          height={VIEW_H}
          className="relative z-10"
          aria-label={`${skill} confidence: ${pct}%`}
          role="img"
        >
          {/* Background track arc (thin) */}
          <path
            d={arcPath(CX, CY, R, Math.PI, 0)}
            fill="none"
            stroke="currentColor"
            className="text-muted/50"
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Colored zone segments */}
          {zoneBoundaries.map((z, i) => (
            <path
              key={i}
              d={arcPath(CX, CY, R, confToAngle(z.start), confToAngle(z.end))}
              fill="none"
              stroke={z.color}
              strokeWidth={6}
              strokeLinecap={i === 0 ? "round" : "butt"}
              opacity={z.opacity}
            />
          ))}

          {/* Active fill arc (from left up to current confidence) */}
          <motion.path
            d={arcPath(CX, CY, R, Math.PI, angle)}
            fill="none"
            stroke={zone.color}
            strokeWidth={6}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />

          {/* Needle */}
          <motion.line
            x1={CX}
            y1={CY}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={zone.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ x2: CX, y2: CY - NEEDLE_R * 0.1, opacity: 0 }}
            animate={{ x2: needleEnd.x, y2: needleEnd.y, opacity: 1 }}
            transition={{
              x2: { type: "spring", stiffness: 60, damping: 14, delay: 0.3 },
              y2: { type: "spring", stiffness: 60, damping: 14, delay: 0.3 },
              opacity: { duration: 0.3, delay: 0.2 },
            }}
          />

          {/* Center dot */}
          <circle cx={CX} cy={CY} r={3.5} fill={zone.color} opacity={0.9} />
          <circle cx={CX} cy={CY} r={1.5} fill="white" opacity={0.8} />

          {/* Tick marks at 0%, 50%, 100% */}
          {[0, 0.5, 1].map((t) => {
            const a = confToAngle(t);
            const outer = angleToSVG(a, CX, CY, R + 2);
            const inner = angleToSVG(a, CX, CY, R - 2);
            return (
              <line
                key={t}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="currentColor"
                className="text-muted-foreground/40"
                strokeWidth={1}
              />
            );
          })}

          {/* Percentage label at center-bottom of arc */}
          <motion.text
            x={CX}
            y={CY - 8}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            {pct}%
          </motion.text>
        </svg>
      </div>

      {/* Labels below gauge */}
      <div className="flex flex-col items-center gap-0.5 mt-1">
        <span
          className={cn(
            "text-[9px] font-semibold uppercase tracking-wider",
            clamped < 0.3 && "text-critical-foreground",
            clamped >= 0.3 && clamped < 0.6 && "text-warning-foreground",
            clamped >= 0.6 && "text-success-foreground"
          )}
        >
          {zone.label}
        </span>
        <span className="text-[9px] text-muted-foreground leading-tight text-center max-w-[100px]">
          {detail ?? levelDetail(level)}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Arc path helper — draws an arc from startAngle to endAngle
 * (angles in radians, measured CCW from positive x-axis)
 * ------------------------------------------------------------------------- */
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = angleToSVG(startAngle, cx, cy, r);
  const end = angleToSVG(endAngle, cx, cy, r);
  // Arc sweep: from start to end going clockwise in SVG (which is CCW in math)
  // Since we go from larger angle to smaller (left to right), we use large-arc-flag = 0
  const angleDiff = Math.abs(startAngle - endAngle);
  const largeArc = angleDiff > Math.PI ? 1 : 0;
  // sweep-flag = 0 for counter-clockwise in SVG = clockwise in math
  // Our arc goes from left (π) towards right (0), which in SVG is clockwise
  // So sweep-flag = 0 (SVG counter-clockwise) maps to math clockwise
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
