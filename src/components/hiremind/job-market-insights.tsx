"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Globe,
  Layers,
  Star,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useHireMind } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Job Market Insights — deterministic, JD-derived market signals shown on the
 * Match view. Complements `JobInsights` (which shows *what we extracted*) with
 * *what that implies about the market*:
 *
 *  - Demand level         (signal: # of requirements)
 *  - Seniority signal     (signal: seniority keywords in title/summary/resp.)
 *  - Skill scarcity       (signal: candidate's coverage of *critical* skills)
 *  - Work flexibility     (signal: remote / hybrid / flexible keywords)
 *  - Tech stack diversity (signal: distinct categories in requirements)
 *  - Top in-demand skills (top 5 requirements by importance)
 *
 * No AI calls — every value is computed inline from `JobProfile`.
 */
export function JobMarketInsights() {
  const { job, match } = useHireMind();
  if (!job) return null;

  const reqCount = job.requirements.length;

  // --- Demand level --------------------------------------------------------
  // More requirements = broader / higher-signal role.
  const demandLevel =
    reqCount > 12
      ? "Very high demand"
      : reqCount >= 9
      ? "High demand"
      : reqCount >= 5
      ? "Moderate demand"
      : "Niche role";
  const demandDesc = `${reqCount} requirement${reqCount === 1 ? "" : "s"} detected in JD`;

  // --- Seniority signal ----------------------------------------------------
  // Keyword scan over title + summary + responsibilities.
  const haystack = `${job.title} ${job.summary} ${job.responsibilities.join(" ")}`.toLowerCase();
  let seniority = "Mid-Senior";
  let seniorityDesc = "Default inference";
  if (/\b(senior|lead|staff|principal)\b/.test(haystack)) {
    seniority = "Senior level";
    seniorityDesc = "Keywords: senior, lead, staff, principal";
  } else if (/\b(junior|entry|graduate|intern)\b/.test(haystack)) {
    seniority = "Entry level";
    seniorityDesc = "Keywords: junior, entry, graduate, intern";
  } else if (/\b(mid|intermediate)\b/.test(haystack)) {
    seniority = "Mid level";
    seniorityDesc = "Keywords: mid, intermediate";
  }

  // --- Tech stack diversity ------------------------------------------------
  const categories = Array.from(new Set(job.requirements.map((r) => r.category)));
  const categoryCount = categories.length;
  const techValue = `${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`;
  const techDesc =
    categories.length > 0
      ? `${categories.slice(0, 3).join(", ")}${categories.length > 3 ? ` +${categories.length - 3} more` : ""}`
      : "Single-domain focus";

  // --- Work flexibility ----------------------------------------------------
  const remoteMatches = haystack.match(/\b(remote|hybrid|flexible|work from home|wfh|distributed)\b/g) || [];
  const remoteKeywords = Array.from(new Set(remoteMatches));
  let remoteValue = "On-site likely";
  let remoteDesc = "No flexibility keywords found";
  if (remoteKeywords.length > 0) {
    if (remoteKeywords.includes("remote")) remoteValue = "Remote available";
    else if (remoteKeywords.includes("hybrid")) remoteValue = "Hybrid available";
    else remoteValue = "Flexible work";
    remoteDesc = `Mentions: ${remoteKeywords.slice(0, 2).join(", ")}`;
  }

  // --- Skill scarcity ------------------------------------------------------
  // How rare the candidate's combination is, approximated by their coverage of
  // the role's *critical* skills (matched rows in the existing match result).
  const criticalReqs = job.requirements.filter((r) => r.importance === "critical");
  let scarcityValue = "No critical skills defined";
  let scarcityDesc = "Role has no critical-weighted requirements";
  let criticalCoveragePct = 0;
  if (criticalReqs.length > 0) {
    const matchedCritical = criticalReqs.filter((r) => {
      const row = match?.rows.find((m) => m.competency === r.competency);
      return row?.status === "matched";
    }).length;
    criticalCoveragePct = Math.round((matchedCritical / criticalReqs.length) * 100);
    if (criticalCoveragePct > 70) {
      scarcityValue = "Your skills are in high demand";
    } else if (criticalCoveragePct >= 40) {
      scarcityValue = "Partial coverage of in-demand skills";
    } else {
      scarcityValue = "Significant skill development needed";
    }
    scarcityDesc = `${matchedCritical} of ${criticalReqs.length} critical skills matched · ${criticalCoveragePct}%`;
  }

  // --- Top in-demand skills ------------------------------------------------
  // 5 most-important requirements, sorted by importance rank then required flag.
  const IMPORTANCE_RANK: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const topSkills = [...job.requirements]
    .sort((a, b) => {
      const rankDiff = IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance];
      if (rankDiff !== 0) return rankDiff;
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.skill.localeCompare(b.skill);
    })
    .slice(0, 5);

  const tiles: {
    icon: LucideIcon;
    label: string;
    value: string;
    description: string;
  }[] = [
    { icon: TrendingUp, label: "Demand level", value: demandLevel, description: demandDesc },
    { icon: Briefcase, label: "Seniority signal", value: seniority, description: seniorityDesc },
    { icon: Star, label: "Skill scarcity", value: scarcityValue, description: scarcityDesc },
    { icon: Globe, label: "Work flexibility", value: remoteValue, description: remoteDesc },
    { icon: Layers, label: "Tech stack diversity", value: techValue, description: techDesc },
  ];

  // Importance dot color for skill pills (solid bg, visible at tiny size).
  const IMPORTANCE_DOT: Record<string, string> = {
    critical: "bg-critical",
    high: "bg-warning",
    medium: "bg-accent-blue",
    low: "bg-muted-foreground/60",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="hm-card p-5 sm:p-7 mt-4"
    >
      <div className="flex items-start gap-2.5 mb-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
          <Zap className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Job market insights</h3>
          <p className="text-[11px] text-muted-foreground">
            Derived from this job description · deterministic analysis
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t, i) => (
          <InsightTile
            key={t.label}
            icon={t.icon}
            label={t.label}
            value={t.value}
            description={t.description}
            delay={0.3 + i * 0.06}
          />
        ))}

        {/* Top in-demand skills — spans full width on every breakpoint */}
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.3 + tiles.length * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="hm-elevated rounded-lg p-3 sm:col-span-2 lg:col-span-3"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground/80">
              <Zap className="h-4 w-4" />
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Top in-demand skills
            </span>
          </div>
          {topSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topSkills.map((s, i) => (
                <motion.span
                  key={`${s.skill}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.5 + i * 0.05 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      IMPORTANCE_DOT[s.importance]
                    )}
                    aria-hidden
                  />
                  <span>{s.skill}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {s.importance}
                  </span>
                </motion.span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground italic">
              No requirements were extracted from this job description.
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

interface InsightTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
  delay?: number;
}

function InsightTile({
  icon: Icon,
  label,
  value,
  description,
  delay = 0,
}: InsightTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="hm-elevated rounded-lg p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground/80">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-sm font-semibold leading-snug">{value}</div>
      {description && (
        <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
          {description}
        </div>
      )}
    </motion.div>
  );
}
