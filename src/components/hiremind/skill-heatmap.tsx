"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Grid3x3, TrendingUp, AlertCircle } from "lucide-react";
import { useHireMind } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SkillLevel, CompetencyCategory } from "@/lib/types";

/**
 * Skill Confidence Heatmap — at-a-glance visual grid of every detected
 * competency, color-coded by evidence strength. Lives on the Candidate view,
 * above the demonstrated-skills list.
 *
 * Premium design:
 *  - Compact tile grid (no labels on tiny tiles, tooltip on hover)
 *  - Color intensity maps to strength (strong=solid, weak=faint)
 *  - Grouped by category with a sticky category label
 *  - Legend with counts
 */
const LEVEL_COLOR: Record<SkillLevel, string> = {
  strong: "bg-success text-success-foreground",
  moderate: "bg-warning text-warning-foreground",
  weak: "bg-muted-foreground/40 text-foreground/70",
  unknown: "bg-muted text-muted-foreground",
};

const LEVEL_LABEL: Record<SkillLevel, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
  unknown: "Unknown",
};

const CATEGORY_LABEL: Record<CompetencyCategory, string> = {
  system_design: "System Design",
  backend: "Backend",
  frontend: "Frontend",
  data: "Data",
  ml: "Machine Learning",
  cloud: "Cloud",
  devops: "DevOps",
  languages: "Languages",
  communication: "Communication",
  domain: "Domain",
};

export function SkillHeatmap() {
  const { candidate } = useHireMind();
  if (!candidate) return null;

  // Dedupe by competency, keep highest level
  const byComp = new Map<string, { level: SkillLevel; category: CompetencyCategory; skill: string }>();
  for (const ev of candidate.evidence) {
    const existing = byComp.get(ev.competency);
    const order: SkillLevel[] = ["unknown", "weak", "moderate", "strong"];
    if (!existing || order.indexOf(ev.level) > order.indexOf(existing.level)) {
      byComp.set(ev.competency, {
        level: ev.level,
        category: ev.category,
        skill: ev.skill,
      });
    }
  }

  // Group by category
  const byCategory = new Map<CompetencyCategory, typeof entries>();
  const entries = Array.from(byComp.entries()).map(([competency, info]) => ({
    competency,
    ...info,
  }));
  for (const e of entries) {
    const arr = byCategory.get(e.category) ?? [];
    arr.push(e);
    byCategory.set(e.category, arr);
  }

  // Sort categories by count desc
  const sortedCategories = Array.from(byCategory.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  // Counts for legend
  const counts = {
    strong: entries.filter((e) => e.level === "strong").length,
    moderate: entries.filter((e) => e.level === "moderate").length,
    weak: entries.filter((e) => e.level === "weak").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="hm-card p-5 sm:p-7 mt-4"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
            <Grid3x3 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Skill confidence heatmap</h3>
            <p className="text-[11px] text-muted-foreground">
              {entries.length} competencies detected · color = evidence strength
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium">
          <LegendDot color="bg-success" label={`${counts.strong} strong`} />
          <LegendDot color="bg-warning" label={`${counts.moderate} moderate`} />
          <LegendDot color="bg-muted-foreground/40" label={`${counts.weak} weak`} />
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {sortedCategories.map(([cat, items], ci) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.2 + ci * 0.06 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABEL[cat]}
              </span>
              <span className="text-[10px] text-muted-foreground/60">·</span>
              <span className="text-[10px] text-muted-foreground/60">{items.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {items.map((item, i) => (
                <motion.div
                  key={item.competency}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.25 + ci * 0.06 + i * 0.015 }}
                  whileHover={{ scale: 1.04, y: -1 }}
                  className={cn(
                    "group relative rounded-md px-2 py-1.5 cursor-default transition-all",
                    LEVEL_COLOR[item.level],
                    "shadow-sm"
                  )}
                  title={`${item.competency} — ${LEVEL_LABEL[item.level]}\n(from: ${item.skill})`}
                >
                  <div className="text-[11px] font-medium leading-tight line-clamp-1">
                    {item.competency}
                  </div>
                  <div className="text-[9px] opacity-70 mt-0.5 capitalize">
                    {LEVEL_LABEL[item.level]}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-3">
          <AlertCircle className="h-3.5 w-3.5" />
          No skill evidence detected yet.
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span>
          Hover any tile to see the source skill. Strong evidence = explicit project or quantified impact.
        </span>
      </div>
    </motion.div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-sm", color)} />
      {label}
    </span>
  );
}
