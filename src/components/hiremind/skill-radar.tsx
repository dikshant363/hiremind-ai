"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Radar, AlertCircle } from "lucide-react";
import { useHireMind } from "@/lib/store";
import type { CompetencyCategory, SkillEvidence } from "@/lib/types";

/**
 * Skill Proficiency Radar — pure-SVG spider chart that plots the candidate's
 * average evidence strength across all 10 competency categories.
 *
 * Lives on the Candidate view between the SkillHeatmap and ResumeStrength.
 *
 * Premium design:
 *  - 4 concentric grid rings (25/50/75/100%) with subtle strokes
 *  - 10 axis lines from center to edge
 *  - Data polygon: gradient fill (accent-blue, 50%→10% opacity) + 2px stroke
 *  - Small circles at each non-zero vertex with hover tooltips
 *  - Spring-eased draw-in entrance (scale 0 → 1 over 0.8s)
 *  - Graceful empty state ("No evidence yet")
 */

const CATEGORIES: { key: CompetencyCategory; label: string }[] = [
  { key: "system_design", label: "System Design" },
  { key: "backend", label: "Backend" },
  { key: "frontend", label: "Frontend" },
  { key: "data", label: "Data" },
  { key: "ml", label: "ML" },
  { key: "cloud", label: "Cloud" },
  { key: "devops", label: "DevOps" },
  { key: "languages", label: "Languages" },
  { key: "communication", label: "Communication" },
  { key: "domain", label: "Domain" },
];

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 96; // chart radius — leaves room for labels inside the 280² viewBox
const LABEL_RADIUS = 116;

interface CategoryStat {
  category: CompetencyCategory;
  label: string;
  avg: number; // 0..1
  count: number;
}

function computeStats(evidence: SkillEvidence[]): CategoryStat[] {
  return CATEGORIES.map(({ key, label }) => {
    const items = evidence.filter((e) => e.category === key);
    const count = items.length;
    const avg =
      count > 0
        ? items.reduce((s, e) => s + (e.strength ?? 0), 0) / count
        : 0;
    return { category: key, label, avg, count };
  });
}

/** Convert polar (radius, angle) to cartesian, with angle measured from +x axis. */
function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** Axis angle for index i (0=top, going clockwise). */
function axisAngle(i: number, total: number) {
  return -Math.PI / 2 + (i * 2 * Math.PI) / total;
}

export function SkillRadar() {
  const { candidate } = useHireMind();
  const [hover, setHover] = React.useState<number | null>(null);
  if (!candidate) return null;

  const stats = computeStats(candidate.evidence);
  const hasEvidence = candidate.evidence.length > 0;
  const categoriesWithEvidence = stats.filter((s) => s.count > 0).length;

  // Compute data points (always all 10, even if avg=0 for visual continuity)
  const points = stats.map((s, i) => {
    const angle = axisAngle(i, stats.length);
    const r = RADIUS * s.avg;
    return { ...polar(CENTER, CENTER, r, angle), stat: s, angle };
  });

  const polygonPoints = points
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  // Compute label positions with anchoring
  const labelPositions = stats.map((s, i) => {
    const angle = axisAngle(i, stats.length);
    const pos = polar(CENTER, CENTER, LABEL_RADIUS, angle);
    const isTop = Math.abs(angle + Math.PI / 2) < 0.001;
    const isBottom = Math.abs(angle - Math.PI / 2) < 0.001;
    let anchor: "start" | "middle" | "end" = "middle";
    if (!isTop && !isBottom) {
      anchor = pos.x < CENTER - 0.5 ? "end" : pos.x > CENTER + 0.5 ? "start" : "middle";
    }
    return { ...pos, label: s.label, anchor, isTop, isBottom };
  });

  const hoveredPoint = hover !== null ? points[hover] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="hm-card p-5 sm:p-7 mt-4"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
            <Radar className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Skill proficiency radar</h3>
            <p className="text-[11px] text-muted-foreground">
              Average evidence strength by category
            </p>
          </div>
        </div>
        {hasEvidence && (
          <div className="text-right shrink-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Categories
            </div>
            <div className="text-sm font-semibold tabular-nums hm-num-tabular">
              {categoriesWithEvidence}
              <span className="text-muted-foreground">/{stats.length}</span>
            </div>
          </div>
        )}
      </div>

      {!hasEvidence ? (
        <div className="flex flex-col items-center justify-center gap-2 text-[12px] text-muted-foreground py-12">
          <AlertCircle className="h-4 w-4" />
          <span>No evidence yet.</span>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            className="relative w-full"
            style={{ maxWidth: SIZE + 80 }}
          >
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              width="100%"
              height="auto"
              className="overflow-visible max-w-full"
              role="img"
              aria-label="Skill proficiency radar chart"
            >
              <defs>
                <linearGradient
                  id="radar-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--accent-blue)"
                    stopOpacity="0.5"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--accent-blue)"
                    stopOpacity="0.1"
                  />
                </linearGradient>
              </defs>

              {/* Concentric grid rings at 25/50/75/100% */}
              {[0.25, 0.5, 0.75, 1].map((ring) => (
                <circle
                  key={ring}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS * ring}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={1}
                  opacity={0.4}
                />
              ))}

              {/* Axis lines from center to each vertex */}
              {stats.map((_, i) => {
                const angle = axisAngle(i, stats.length);
                const end = polar(CENTER, CENTER, RADIUS, angle);
                return (
                  <line
                    key={i}
                    x1={CENTER}
                    y1={CENTER}
                    x2={end.x}
                    y2={end.y}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Data polygon — spring-eased draw-in */}
              <motion.polygon
                points={polygonPoints}
                fill="url(#radar-gradient)"
                stroke="var(--accent-blue)"
                strokeWidth={2}
                strokeLinejoin="round"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  stiffness: 120,
                  damping: 14,
                  delay: 0.1,
                }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              />

              {/* Data point circles — only for categories with evidence */}
              {points.map((p, i) =>
                p.stat.count > 0 ? (
                  <motion.circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill="var(--accent-blue)"
                    stroke="white"
                    strokeWidth={2}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.6 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.5 + i * 0.04,
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                    }}
                    style={{
                      transformOrigin: `${p.x}px ${p.y}px`,
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                ) : null
              )}

              {/* Category labels outside each axis */}
              {labelPositions.map((lp, i) => (
                <text
                  key={i}
                  x={lp.x}
                  y={lp.y}
                  textAnchor={lp.anchor}
                  dominantBaseline={lp.isTop ? "auto" : lp.isBottom ? "hanging" : "middle"}
                  fill="var(--muted-foreground)"
                  fontSize={10}
                  fontWeight={500}
                  className="select-none"
                >
                  {lp.label}
                </text>
              ))}
            </svg>

            {/* Hover tooltip */}
            {hoveredPoint && hoveredPoint.stat.count > 0 && (
              <div
                className="absolute pointer-events-none z-10 rounded-md border border-border bg-popover text-popover-foreground shadow-md px-2.5 py-1.5 text-[11px] leading-tight"
                style={{
                  left: `${(hoveredPoint.x / SIZE) * 100}%`,
                  top: `${(hoveredPoint.y / SIZE) * 100}%`,
                  transform: "translate(-50%, calc(-100% - 12px))",
                  whiteSpace: "nowrap",
                }}
              >
                <div className="font-semibold">{hoveredPoint.stat.label}</div>
                <div className="text-muted-foreground tabular-nums hm-num-tabular">
                  {Math.round(hoveredPoint.stat.avg * 100)}% avg strength
                </div>
                <div className="text-muted-foreground tabular-nums hm-num-tabular">
                  {hoveredPoint.stat.count} skill
                  {hoveredPoint.stat.count === 1 ? "" : "s"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Radar className="h-3 w-3 shrink-0" />
        <span>
          Hover any vertex to inspect category strength. Outer ring = 100% evidence strength.
        </span>
      </div>
    </motion.div>
  );
}
