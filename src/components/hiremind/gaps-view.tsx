"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Target, Sparkles, ListChecks, Plus, ChevronDown, Lightbulb, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import { PriorityPill, CompetencyBar } from "./shell";
import { GapDeepDive } from "./gap-deep-dive";
import type { CompetencyCategory, SkillGap } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Category badge config
 * ------------------------------------------------------------------------- */
const CATEGORY_BADGE: Record<CompetencyCategory, { label: string; cls: string }> = {
  system_design: { label: "Systems", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  backend: { label: "Backend", cls: "bg-success/15 text-success-foreground" },
  frontend: { label: "Frontend", cls: "bg-chart-3/15 text-chart-3" },
  data: { label: "Data", cls: "bg-warning/15 text-warning-foreground" },
  ml: { label: "ML", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  cloud: { label: "Cloud", cls: "bg-chart-4/15 text-chart-4" },
  devops: { label: "DevOps", cls: "bg-chart-5/15 text-chart-5" },
  languages: { label: "Lang", cls: "bg-chart-2/15 text-chart-2" },
  communication: { label: "Comm", cls: "bg-success/15 text-success-foreground" },
  domain: { label: "Domain", cls: "bg-muted text-muted-foreground" },
};

function CategoryBadge({ category }: { category: CompetencyCategory }) {
  const cfg = CATEGORY_BADGE[category] ?? CATEGORY_BADGE.domain;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Impact Meter — animated horizontal bar for priorityScore
 * ------------------------------------------------------------------------- */
function ImpactMeter({ score, priority }: { score: number; priority: SkillGap["priority"] }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0.02, Math.min(1, score))), 120);
    return () => clearTimeout(t);
  }, [score]);

  const gradient =
    priority === "critical"
      ? "linear-gradient(90deg, var(--critical), color-mix(in oklch, var(--critical) 70%, var(--warning)))"
      : priority === "high"
      ? "linear-gradient(90deg, var(--warning), color-mix(in oklch, var(--warning) 70%, var(--accent-blue)))"
      : priority === "medium"
      ? "linear-gradient(90deg, color-mix(in oklch, var(--warning) 60%, var(--accent-blue)), var(--accent-blue))"
      : "linear-gradient(90deg, var(--muted-foreground), var(--muted))";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-foreground">Impact score</span>
        <span className="text-muted-foreground tabular-nums">{Math.round(score * 100)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ width: `${w * 100}%`, background: gradient }}
          initial={{ width: 0 }}
          animate={{ width: `${w * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Gap Comparison — "Your level vs Required level" bars
 * ------------------------------------------------------------------------- */
const CANDIDATE_LEVEL_PCT: Record<string, number> = {
  unknown: 0.05,
  weak: 0.25,
  moderate: 0.55,
  strong: 0.85,
};

const IMPORTANCE_PCT: Record<string, number> = {
  critical: 0.95,
  high: 0.8,
  medium: 0.6,
  low: 0.4,
};

function GapComparison({ gap }: { gap: SkillGap }) {
  const yourPct = CANDIDATE_LEVEL_PCT[gap.candidateLevel] ?? 0.05;
  const reqPct = IMPORTANCE_PCT[gap.importance] ?? 0.5;

  return (
    <div className="space-y-3 mt-5">
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Your level vs. Required level</div>
      {/* Required level bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Required</span>
          <span className="text-muted-foreground tabular-nums">{Math.round(reqPct * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, color-mix(in oklch, var(--accent-blue) 80%, var(--success)), var(--accent-blue))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${reqPct * 100}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </div>
      </div>
      {/* Your level bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Your level</span>
          <span className="text-muted-foreground tabular-nums">{Math.round(yourPct * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--muted-foreground)", opacity: 0.6 }}
            initial={{ width: 0 }}
            animate={{ width: `${yourPct * 100}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          />
        </div>
      </div>
      {/* Gap indicator */}
      {(reqPct - yourPct) > 0.05 && (
        <div className="text-[11px] text-critical-foreground font-medium">
          Gap: {Math.round((reqPct - yourPct) * 100)} percentage points
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Other gap card — with expand/collapse
 * ------------------------------------------------------------------------- */
function OtherGapCard({
  g,
  index,
  onOpenDeepDive,
}: {
  g: SkillGap;
  index: number;
  onOpenDeepDive: (g: SkillGap) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const severityValue = g.priorityScore ?? 0;
  const barStatus: "matched" | "weak" | "unknown" | "gap" | "accent" =
    g.priority === "critical" || g.priority === "high" ? "gap" : g.priority === "medium" ? "weak" : "unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "hm-elevated hm-card-hover rounded-xl p-4 cursor-pointer select-none",
        "transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-0.5"
      )}
      onClick={() => onOpenDeepDive(g)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDeepDive(g);
        }
      }}
      aria-label={`Open deep dive for ${g.competency}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium truncate">{g.competency}</span>
            <CategoryBadge category={g.category} />
          </div>
          <div className="text-[11px] text-muted-foreground capitalize mb-2">
            {g.candidateLevel} · {g.importance}
          </div>
          <CompetencyBar label="" value={severityValue} status={barStatus} index={index} />
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <PriorityPill priority={g.priority} />
          {/* Chevron is a separate button so the card body opens the deep
              dive while the chevron only toggles the inline expand. */}
          <button
            type="button"
            aria-label={expanded ? "Collapse details" : "Expand details"}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-border/60 text-[12px] text-muted-foreground leading-relaxed">
              {g.reason}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * Stagger container variants
 * ------------------------------------------------------------------------- */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ---------------------------------------------------------------------------
 * GapsView
 * ------------------------------------------------------------------------- */
export function GapsView() {
  const { gaps, candidate, job, setView, startInterview, loading, loadingStep } = useHireMind();
  const [deepDiveGap, setDeepDiveGap] = React.useState<SkillGap | null>(null);
  if (!gaps) return null;

  const top = gaps[0];
  const others = gaps.slice(1, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Skill Gaps</div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Your biggest opportunity.</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          We prioritized every gap by job importance, candidate evidence and semantic alignment. The first one is where your time will matter most.
        </p>
      </motion.div>

      {/* Hero gap */}
      {top && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="hm-gradient-border-critical mt-6 sm:mt-8 p-6 sm:p-10 relative overflow-hidden"
        >
          <div
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, var(--accent-blue), transparent 70%)" }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-critical/10 text-critical-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
              <Target className="h-3 w-3" /> Highest-impact gap
            </span>
            <PriorityPill priority={top.priority} />
            <CategoryBadge category={top.category} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">{top.competency}</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">{top.reason}</p>

          {/* Impact meter */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-sm"
          >
            <ImpactMeter score={top.priorityScore} priority={top.priority} />
          </motion.div>

          {/* Stat tiles */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12px]"
          >
            <motion.div variants={fadeUp} className="hm-stat-tile p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Why it matters</div>
              <div className="text-foreground">
                Marked <span className="font-medium">{top.importance}</span> for {job?.title ?? "this role"}.
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="hm-stat-tile p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5">Your evidence</div>
              {top.candidateLevel === "unknown" ? (
                <div
                  className="hm-void-box flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium"
                  title="Add evidence"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add evidence</span>
                </div>
              ) : (
                <div className="text-foreground capitalize">{top.candidateLevel} · {top.status}</div>
              )}
            </motion.div>
            <motion.div variants={fadeUp} className="hm-stat-tile p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5">Priority</div>
              <div className="flex items-center">
                <PriorityPill priority={top.priority} />
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="hm-stat-tile p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Next step</div>
              <div className="text-foreground">Test it in the adaptive interview.</div>
            </motion.div>
          </motion.div>

          {/* Gap comparison */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-sm"
          >
            <GapComparison gap={top} />
          </motion.div>

          {/* Quick tip callout */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="hm-insight-callout mt-5 px-4 py-3 flex items-start gap-2.5 max-w-xl"
          >
            <Lightbulb className="h-4 w-4 text-accent-blue-foreground shrink-0 mt-0.5" />
            <span className="text-[12px] text-foreground/80 leading-relaxed">
              <span className="font-medium text-foreground">Tip:</span> Focus on this gap first. Closing your highest-impact gap typically raises your Job Match Index by 10–15 points.
            </span>
          </motion.div>

          {/* CTA buttons */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3 flex-wrap">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Button onClick={startInterview} size="lg" className="h-12 px-6 gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 hm-thinking" /> {loadingStep || "Working…"}
                  </>
                ) : (
                  <>
                    Test this skill <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
            <Button
              variant="ghost"
              onClick={() => setDeepDiveGap(top)}
              className="h-12 gap-2 text-accent-blue-foreground hover:text-accent-blue-foreground hover:bg-accent-blue/10"
            >
              <BookOpen className="h-4 w-4" />
              Deep dive
            </Button>
            <Button variant="ghost" onClick={() => setView("interview")} className="text-muted-foreground h-12">
              Resume interview →
            </Button>
          </div>
        </motion.div>
      )}

      {/* Other gaps */}
      {others.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Other open gaps</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {others.map((g, i) => (
              <OtherGapCard key={g.competency} g={g} index={i} onOpenDeepDive={setDeepDiveGap} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Skill Gap Deep-Dive modal — controlled by deepDiveGap state. */}
      <GapDeepDive
        gap={deepDiveGap}
        open={!!deepDiveGap}
        onOpenChange={(o) => !o && setDeepDiveGap(null)}
      />
    </div>
  );
}
