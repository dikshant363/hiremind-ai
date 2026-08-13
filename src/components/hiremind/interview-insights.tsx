"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Grid3x3,
  Clock,
  Zap,
  Gauge,
} from "lucide-react";
import type { AnswerEvaluation, InterviewState } from "@/lib/types";
import { useHireMind } from "@/lib/store";

/* ============================================================================
 * Interview Insights — premium post-answer visual breakdown.
 *
 * Shown after each evaluation in the evaluation view. Renders four sections:
 *   A. Competency Radar Chart (SVG)
 *   B. Trajectory Sparkline (SVG)
 *   C. Strength-Weakness Matrix (2x2)
 *   D. Time Analysis (horizontal bars)
 *
 * All derived purely from the deterministic evaluation + competency state
 * already in the store. No new API calls.
 * ==========================================================================*/

const REQUIRED_THRESHOLD = 70; // 0-100 — the "passing" polygon outline

/** Five evaluation dimensions, mapped from the four numeric scores.
 *  "Problem Solving" is a synthetic blend of depth + technical accuracy so we
 *  get a fifth axis for a proper pentagon. */
const RADAR_AXES = [
  { key: "technicalAccuracy", label: "Technical" },
  { key: "relevance", label: "Relevance" },
  { key: "depth", label: "Depth" },
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem Solving" },
] as const;

type RadarKey = (typeof RADAR_AXES)[number]["key"];

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Build radar dimension values from the cumulative evaluations. Each value
 *  is 0-100. */
function buildRadarValues(evals: AnswerEvaluation[]): Record<RadarKey, number> {
  const v: Record<RadarKey, number> = {
    technicalAccuracy: average(evals.map((e) => e.technicalAccuracy)) * 100,
    relevance: average(evals.map((e) => e.relevance)) * 100,
    depth: average(evals.map((e) => e.depth)) * 100,
    communication: average(evals.map((e) => e.communication)) * 100,
    problemSolving:
      average(
        evals.map((e) => (e.technicalAccuracy * 0.5 + e.depth * 0.5))
      ) * 100,
  };
  return v;
}

/** Estimate minutes spent per answer from character count assuming ~30 wpm
 *  and ~5 chars/word -> ~150 chars/min. */
function estimateMinutes(text: string): number {
  const chars = text.trim().length;
  if (chars === 0) return 0;
  return Math.max(0.3, Math.round((chars / 150) * 10) / 10);
}

/** Build a smooth catmull-rom spline path string from a list of (x, y)
 *  points. Tension defaults to 0.5 for a gentle curve. */
function smoothPath(
  points: { x: number; y: number }[],
  tension = 0.5
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 6;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 6;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 6;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ----------------------------------------------------------------------------
 * A. Competency Radar Chart
 * ------------------------------------------------------------------------- */

function CompetencyRadar({ values }: { values: Record<RadarKey, number> }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 38; // leave room for labels
  const axes = RADAR_AXES;
  const n = axes.length;

  // Pre-compute axis end points (used for both gridlines and labels)
  const axisEnds = axes.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2; // start at top
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      angle,
    };
  });

  // Build polygon points string at a given set of 0-100 values
  const polygonPoints = (vals: number[]): string =>
    vals
      .map((v, i) => {
        const r = (Math.max(0, Math.min(100, v)) / 100) * radius;
        const a = axisEnds[i].angle;
        return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
      })
      .join(" ");

  const candidateVals = axes.map((a) => values[a.key]);
  const requiredVals = axes.map(() => REQUIRED_THRESHOLD);

  // Concentric grid pentagons at 25/50/75/100
  const gridRings = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Grid rings (concentric pentagons) */}
          {gridRings.map((ring) => (
            <polygon
              key={ring}
              points={polygonPoints(axes.map(() => ring))}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={ring === 100 ? "0" : "3 4"}
              opacity={ring === 100 ? 0.8 : 0.45}
            />
          ))}

          {/* Axis spokes */}
          {axisEnds.map((end, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.55}
            />
          ))}

          {/* Required threshold polygon (dashed outline) */}
          <motion.polygon
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            points={polygonPoints(requiredVals)}
            fill="var(--muted-foreground)"
            fillOpacity={0.05}
            stroke="var(--muted-foreground)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Candidate polygon (filled) */}
          <motion.polygon
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
              type: "spring",
              stiffness: 80,
              damping: 14,
            }}
            points={polygonPoints(candidateVals)}
            fill="var(--accent-blue)"
            fillOpacity={0.18}
            stroke="var(--accent-blue)"
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Candidate vertex dots */}
          {candidateVals.map((v, i) => {
            const r = (Math.max(0, Math.min(100, v)) / 100) * radius;
            const a = axisEnds[i].angle;
            return (
              <motion.circle
                key={i}
                initial={{ opacity: 0, r: 0 }}
                animate={{ opacity: 1, r: 3.5 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                cx={cx + Math.cos(a) * r}
                cy={cy + Math.sin(a) * r}
                fill="var(--accent-blue)"
                stroke="var(--card)"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Axis labels */}
          {axes.map((axis, i) => {
            const labelR = radius + 20;
            const a = axisEnds[i].angle;
            const x = cx + Math.cos(a) * labelR;
            const y = cy + Math.sin(a) * labelR;
            const val = Math.round(values[axis.key]);
            return (
              <g key={axis.key}>
                <text
                  x={x}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  {axis.label}
                </text>
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 9, fontWeight: 500 }}
                >
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-accent-blue" />
          Your score
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{
              background: "transparent",
              border: "1px dashed var(--muted-foreground)",
            }}
          />
          Target ({REQUIRED_THRESHOLD})
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * B. Trajectory Sparkline
 * ------------------------------------------------------------------------- */

function TrajectorySparkline({
  evals,
}: {
  evals: AnswerEvaluation[];
}) {
  const width = 220;
  const height = 56;
  const padX = 8;
  const padY = 10;

  const points = evals.map((e, i) => {
    const x =
      evals.length === 1
        ? width / 2
        : padX + (i / (evals.length - 1)) * (width - padX * 2);
    const y =
      height - padY - (Math.round(e.overall * 100) / 100) * (height - padY * 2);
    return { x, y };
  });

  const path = smoothPath(points);
  const areaPath =
    points.length > 0
      ? `${path} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
      : "";

  const trend =
    evals.length < 2
      ? { dir: "flat", label: "Baseline", icon: Minus }
      : evals[evals.length - 1].overall > evals[0].overall + 0.02
      ? { dir: "up", label: "Improving", icon: TrendingUp }
      : evals[evals.length - 1].overall < evals[0].overall - 0.02
      ? { dir: "down", label: "Declining", icon: TrendingDown }
      : { dir: "flat", label: "Steady", icon: Minus };

  const TrendIcon = trend.icon;
  const trendColor =
    trend.dir === "up"
      ? "text-success-foreground"
      : trend.dir === "down"
      ? "text-critical-foreground"
      : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-2">
      {evals.length < 2 ? (
        <div
          className="flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-3 text-[11px] text-muted-foreground"
          style={{ width, height }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-blue" />
            Baseline established · trajectory appears after Q2
          </span>
        </div>
      ) : (
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="hm-spark-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Baseline at 50% */}
          <line
            x1={padX}
            x2={width - padX}
            y1={height / 2}
            y2={height / 2}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.6}
          />
          {areaPath && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              d={areaPath}
              fill="url(#hm-spark-area)"
            />
          )}
          {path && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              d={path}
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              initial={{ opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: 2.8 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
              cx={p.x}
              cy={p.y}
              fill="var(--card)"
              stroke="var(--accent-blue)"
              strokeWidth={1.8}
            />
          ))}
        </svg>
      )}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">
          Q1{evals.length > 1 ? ` → Q${evals.length}` : " · baseline"}
        </span>
        <span className={`inline-flex items-center gap-1 font-medium ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          {trend.label}
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * C. Strength-Weakness Matrix
 * ------------------------------------------------------------------------- */

interface MatrixQuadrant {
  title: string;
  description: string;
  chips: string[];
  borderClass: string;
  chipClass: string;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StrengthWeaknessMatrix({
  interview,
  gaps,
}: {
  interview: InterviewState;
  gaps: { competency: string; importance: string }[] | null;
}) {
  // Build competency chips per quadrant from the deterministic state.
  const states = interview.competencyStates;
  const evaluatedCompetencies = new Set(
    interview.evaluations.map((e) => e.competency)
  );

  const strongPracticed: string[] = [];
  const strongUnverified: string[] = [];
  const weakImproving: string[] = [];
  const criticalGaps: string[] = [];

  for (const s of states) {
    if (
      (s.interviewLevel === "strong" || s.current === "strong") &&
      evaluatedCompetencies.has(s.competency)
    ) {
      strongPracticed.push(s.competency);
    } else if (
      (s.resumeLevel === "strong" || s.resumeLevel === "moderate") &&
      s.interviewLevel === "unknown"
    ) {
      strongUnverified.push(s.competency);
    } else if (
      (s.interviewLevel === "weak" || s.current === "weak") &&
      s.status !== "gap"
    ) {
      weakImproving.push(s.competency);
    } else if (s.status === "gap" || s.current === "unknown") {
      criticalGaps.push(s.competency);
    }
  }

  // Pull from gaps list to round out critical gaps
  if (gaps) {
    for (const g of gaps) {
      if (criticalGaps.length < 3 && !criticalGaps.includes(g.competency)) {
        if (g.importance === "critical" || g.importance === "high") {
          criticalGaps.push(g.competency);
        }
      }
    }
  }

  // Limit each quadrant to 3 chips; use em-dash placeholder when empty so the
  // 2x2 grid stays balanced.
  const take3 = (arr: string[]): string[] => {
    const out = arr.slice(0, 3);
    return out.length === 0 ? ["—"] : out;
  };

  const quadrants: MatrixQuadrant[] = [
    {
      title: "Strong & Practiced",
      description: "Demonstrated well in the interview",
      chips: take3(strongPracticed),
      borderClass: "border-success/40",
      chipClass: "bg-success/10 text-success-foreground border-success/30",
      iconBg: "bg-success/15",
      iconColor: "text-success-foreground",
      icon: TrendingUp,
    },
    {
      title: "Strong but Unverified",
      description: "On resume, not yet asked",
      chips: take3(strongUnverified),
      borderClass: "border-accent-blue/40",
      chipClass: "bg-accent-blue/10 text-accent-blue-foreground border-accent-blue/30",
      iconBg: "bg-accent-blue/15",
      iconColor: "text-accent-blue-foreground",
      icon: Radar,
    },
    {
      title: "Weak but Improving",
      description: "Low scores, recent gains",
      chips: take3(weakImproving),
      borderClass: "border-warning/40",
      chipClass: "bg-warning/10 text-warning-foreground border-warning/30",
      iconBg: "bg-warning/15",
      iconColor: "text-warning-foreground",
      icon: Activity,
    },
    {
      title: "Critical Gaps",
      description: "Need urgent work",
      chips: take3(criticalGaps),
      borderClass: "border-critical/40",
      chipClass: "bg-critical/10 text-critical-foreground border-critical/30",
      iconBg: "bg-critical/15",
      iconColor: "text-critical-foreground",
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {quadrants.map((q, i) => {
        const Icon = q.icon;
        return (
          <motion.div
            key={q.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-xl border ${q.borderClass} bg-card/60 p-3`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${q.iconBg} ${q.iconColor}`}>
                <Icon className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold leading-tight">{q.title}</div>
                <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{q.description}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {q.chips.map((chip) => (
                <span
                  key={chip}
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${q.chipClass}`}
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * D. Time Analysis
 * ------------------------------------------------------------------------- */

function TimeAnalysis({ interview }: { interview: InterviewState }) {
  const minutes = interview.answers.map((a) => estimateMinutes(a.text));
  const maxMin = Math.max(1, ...minutes);
  const avg = minutes.length > 0 ? average(minutes) : 0;

  const pace =
    avg >= 3
      ? { label: "Thoughtful", icon: Gauge, color: "text-success-foreground", bg: "bg-success/15" }
      : avg >= 1
      ? { label: "Quick", icon: Zap, color: "text-accent-blue-foreground", bg: "bg-accent-blue/15" }
      : { label: "Rushed", icon: Clock, color: "text-warning-foreground", bg: "bg-warning/15" };

  const PaceIcon = pace.icon;

  return (
    <div>
      <div className="space-y-2">
        {minutes.map((m, i) => {
          const widthPct = (m / maxMin) * 100;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] font-medium text-muted-foreground w-6 shrink-0 tabular-nums">
                Q{i + 1}
              </span>
              <div className="flex-1 h-4 rounded bg-muted/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded"
                  style={{
                    background:
                      m >= 3
                        ? "linear-gradient(90deg, var(--success), var(--accent-blue))"
                        : m >= 1
                        ? "linear-gradient(90deg, var(--accent-blue), var(--accent-blue))"
                        : "linear-gradient(90deg, var(--warning), var(--warning))",
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">
                {m}min
              </span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full ${pace.bg} ${pace.color} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider`}>
          <PaceIcon className="h-2.5 w-2.5" />
          {pace.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          avg {avg.toFixed(1)} min / answer
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Main exported component
 * ------------------------------------------------------------------------- */

export function InterviewInsights() {
  const { interview, gaps } = useHireMind();

  if (!interview || interview.evaluations.length === 0) return null;

  const evals = interview.evaluations;
  const radarValues = buildRadarValues(evals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="hm-card hm-card-hover mt-5 sm:mt-6 p-5 sm:p-8 relative overflow-visible"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/12 text-accent-blue-foreground">
          <Grid3x3 className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Interview Insights
          </div>
          <h3 className="text-[15px] font-semibold tracking-tight">
            A deeper look at your performance
          </h3>
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground mt-1 mb-5">
        Updated after each answer. All scores are deterministic aggregates — no raw model output.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* A. Radar */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Radar className="h-3.5 w-3.5 text-accent-blue-foreground" />
            <h4 className="text-[12px] font-semibold">Competency Radar</h4>
          </div>
          <div className="flex justify-center">
            <CompetencyRadar values={radarValues} />
          </div>
        </div>

        {/* B. Sparkline + D. Time analysis share a column */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-accent-blue-foreground" />
                <h4 className="text-[12px] font-semibold">Score Trajectory</h4>
              </div>
              <span className="text-[10px] text-muted-foreground">Overall %</span>
            </div>
            <div className="flex justify-center">
              <TrajectorySparkline evals={evals} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent-blue-foreground" />
                <h4 className="text-[12px] font-semibold">Time per Answer</h4>
              </div>
              <span className="text-[10px] text-muted-foreground">~30 wpm estimate</span>
            </div>
            <TimeAnalysis interview={interview} />
          </div>
        </div>

        {/* C. Strength-Weakness Matrix — full width */}
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Grid3x3 className="h-3.5 w-3.5 text-accent-blue-foreground" />
              <h4 className="text-[12px] font-semibold">Strength-Weakness Matrix</h4>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {interview.competencyStates.length} competencies tracked
            </span>
          </div>
          <StrengthWeaknessMatrix interview={interview} gaps={gaps} />
        </div>
      </div>
    </motion.div>
  );
}
