"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  ListChecks,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useHireMind } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Job Description Insights — transparent breakdown of what the AI extracted
 * from the target role. Lives on the Match view, below the score row.
 *
 * Premium Apple-inspired card with:
 *  - Seniority + summary header
 *  - Required vs preferred skill chips (color-coded by importance)
 *  - Top responsibilities (collapsible)
 *  - Coverage stats (X of Y required skills matched)
 */
export function JobInsights() {
  const { job, match } = useHireMind();
  const [expanded, setExpanded] = React.useState(false);

  if (!job) return null;

  const required = job.requirements.filter((r) => r.required);
  const preferred = job.requirements.filter((r) => !r.required);
  const matchedRequired = required.filter((r) => {
    const row = match?.rows.find((m) => m.competency === r.competency);
    return row?.status === "matched";
  }).length;

  // Group requirements by category for visual variety
  const byCategory = job.requirements.reduce<Record<string, typeof job.requirements>>(
    (acc, r) => {
      (acc[r.category] ??= []).push(r);
      return acc;
    },
    {}
  );

  const importanceTone = (imp: string) =>
    imp === "critical"
      ? "bg-critical/10 text-critical-foreground border-critical/20"
      : imp === "high"
      ? "bg-warning/15 text-warning-foreground border-warning/25"
      : imp === "medium"
      ? "bg-accent-blue/10 text-accent-blue-foreground border-accent-blue/20"
      : "bg-muted text-muted-foreground border-border";

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
            <Briefcase className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">What we extracted from this role</h3>
            <p className="text-[11px] text-muted-foreground">
              {job.requirements.length} competencies · {required.length} required · {preferred.length} preferred
            </p>
          </div>
        </div>
        {match && (
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Required coverage</div>
            <div className="text-lg font-semibold tabular-nums">
              {matchedRequired}
              <span className="text-muted-foreground text-sm">/{required.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary line */}
      <p className="text-[13px] text-foreground/75 leading-relaxed mb-5">
        {job.summary}
      </p>

      {/* Required vs Preferred chips */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks className="h-3 w-3 text-critical-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Required skills
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {required.length > 0 ? (
              required.map((r, i) => {
                const row = match?.rows.find((m) => m.competency === r.competency);
                const matched = row?.status === "matched";
                return (
                  <motion.span
                    key={`${r.competency}-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.02 }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                      matched
                        ? "bg-success/10 text-success-foreground border-success/25"
                        : importanceTone(r.importance)
                    )}
                  >
                    {r.competency}
                    {matched && <Sparkles className="h-2.5 w-2.5" />}
                  </motion.span>
                );
              })
            ) : (
              <span className="text-[12px] text-muted-foreground italic">
                No explicitly required skills detected.
              </span>
            )}
          </div>
        </div>

        {preferred.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3 w-3 text-accent-blue-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Preferred skills
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferred.map((r, i) => (
                <motion.span
                  key={`pref-${r.competency}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.4 + i * 0.02 }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 text-foreground/80 px-2 py-0.5 text-[11px] font-medium"
                >
                  {r.competency}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Responsibilities (collapsible) */}
      {job.responsibilities.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border/60">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>Key responsibilities ({job.responsibilities.length})</span>
          </button>
          <motion.div
            initial={false}
            animate={{
              height: expanded ? "auto" : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <ul className="mt-3 space-y-2">
              {job.responsibilities.map((r, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: expanded ? 1 : 0, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="flex gap-2 text-[12px] text-foreground/75 leading-relaxed"
                >
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-accent-blue/60 shrink-0" />
                  <span>{r}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
