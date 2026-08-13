"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Grid3x3, ListChecks, TrendingUp, Gauge, Lightbulb } from "lucide-react";
import { useHireMind } from "@/lib/store";
import { computeResumeStrength } from "@/lib/resume-strength";
import { CompetencyBar } from "./shell";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Grid3x3,
  ListChecks,
  TrendingUp,
};

const BAND_TONE: Record<string, { tone: "neutral" | "success" | "warning" | "critical"; label: string; color: string }> = {
  strong: { tone: "success", label: "Strong", color: "var(--success)" },
  good: { tone: "success", label: "Good", color: "var(--success)" },
  fair: { tone: "warning", label: "Fair", color: "var(--warning)" },
  thin: { tone: "critical", label: "Thin", color: "var(--critical)" },
};

/**
 * Resume Strength Score — a deterministic, transparent assessment of how
 * informative the candidate's resume is as evidence for the HireMind engine.
 *
 * Not a hireability score. Measures signal richness:
 *   - Evidence quality (action verbs + quantified impact)
 *   - Skill coverage (distinct competencies demonstrated)
 *   - Section completeness (experience, projects, education, certs)
 *   - Achievement density (metrics-rich evidence ratio)
 */
export function ResumeStrength() {
  const { candidate } = useHireMind();
  if (!candidate) return null;

  const result = computeResumeStrength(candidate);
  const band = BAND_TONE[result.band];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="hm-card p-5 sm:p-7 mt-4"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
            <Gauge className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Resume strength</h3>
            <p className="text-[11px] text-muted-foreground">
              How informative your resume is as evidence · deterministic
            </p>
          </div>
        </div>
        {/* Score badge */}
        <div className="flex items-center gap-2 text-right">
          <div>
            <div
              className="text-2xl font-semibold tabular-nums leading-none hm-num-tabular"
              style={{ color: band.color }}
            >
              {result.index}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">/ 100</div>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: `color-mix(in oklch, ${band.color} 12%, transparent)`,
              color: band.color,
            }}
          >
            {band.label}
          </span>
        </div>
      </div>

      {/* Headline */}
      <p className="text-[13px] text-foreground/80 leading-relaxed mb-4">{result.headline}</p>

      {/* Dimension bars */}
      <div className="space-y-3">
        {result.dimensions.map((d, i) => {
          const Icon = ICONS[d.icon] ?? Sparkles;
          return (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.06 }}
            >
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{d.label}</span>
                </div>
                <span className="font-semibold tabular-nums hm-num-tabular">
                  {Math.round(d.score * 100)}%
                </span>
              </div>
              <CompetencyBar
                label=""
                value={d.score}
                status={d.score >= 0.7 ? "matched" : d.score >= 0.4 ? "weak" : "gap"}
                index={i}
              />
              <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{d.detail}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mt-5 pt-4 border-t border-border/60">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="h-3.5 w-3.5 text-accent-blue-foreground" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            How to strengthen your resume
          </h4>
        </div>
        <ul className="space-y-1.5">
          {result.tips.slice(0, 3).map((tip, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
              className="text-[12px] text-foreground/80 leading-relaxed flex gap-2"
            >
              <span className="text-accent-blue-foreground mt-0.5">·</span>
              <span>{tip}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Honest-by-design footer */}
      <div className="mt-4 text-[10px] text-muted-foreground/70 italic">
        Resume strength measures signal richness, not hireability. It helps the engine extract better evidence.
      </div>
    </motion.div>
  );
}
