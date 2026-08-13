"use client";

/**
 * HIREMIND AI — Resume Improvement Suggestions
 *
 * A self-contained, collapsible panel rendered inside the Gaps view. It turns
 * the abstract concept of "you have gaps" into concrete, actionable resume
 * additions: for each detected gap (top 6), we emit a deterministic suggestion
 * derived from the candidate's evidence level.
 *
 * - unknown  → suggest adding any project / work experience demonstrating it
 * - weak     → suggest quantifying impact + naming specific tools / methods
 * - moderate → suggest adding depth (scale, tradeoffs, outcomes)
 * - strong   → skipped (no suggestion needed)
 *
 * No AI calls — everything is derived from the SkillGap fields. Each card has
 * a one-click "copy to clipboard" affordance with a 2-second confirmation
 * state and a sonner toast.
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Copy, Check, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PriorityPill } from "./shell";
import { toast } from "sonner";
import type { CompetencyCategory, SkillGap, SkillLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Category badge config — mirrors gaps-view.tsx exactly so badges are visually
 * consistent across the deep-dive modal, the gaps cards, and this panel.
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Candidate-level badge — color-coded to match the gap-confidence zones used
 * elsewhere in the app (critical = unknown, warning = weak, accent-blue =
 * moderate, success = strong). Strong is never rendered here because we skip
 * strong gaps, but the entry exists for type-completeness.
 * ------------------------------------------------------------------------- */
const LEVEL_BADGE: Record<SkillLevel, { label: string; cls: string }> = {
  unknown: { label: "No evidence", cls: "bg-critical/15 text-critical-foreground" },
  weak: { label: "Weak evidence", cls: "bg-warning/20 text-warning-foreground" },
  moderate: { label: "Moderate", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  strong: { label: "Strong", cls: "bg-success/15 text-success-foreground" },
};

function LevelBadge({ level }: { level: SkillLevel }) {
  const cfg = LEVEL_BADGE[level] ?? LEVEL_BADGE.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Deterministic suggestion generator. Pure function of the SkillGap fields —
 * no AI calls, no randomness. The copy is intentionally concrete so it can be
 * pasted into a resume draft and edited in place.
 * ------------------------------------------------------------------------- */
function buildSuggestion(gap: SkillGap): string | null {
  switch (gap.candidateLevel) {
    case "unknown":
      return `Add a project or work experience demonstrating ${gap.competency}. Even a personal project counts.`;
    case "weak":
      return `Strengthen your ${gap.competency} evidence — quantify impact (e.g. 'reduced latency by 40%') and mention specific tools/methods.`;
    case "moderate":
      return `Add depth to your ${gap.competency} mention — include scale, tradeoffs, and outcomes.`;
    case "strong":
      // Already strong — no resume suggestion needed.
      return null;
    default:
      return null;
  }
}

interface ResumeSuggestion {
  gap: SkillGap;
  text: string;
}

function deriveSuggestions(gaps: SkillGap[]): ResumeSuggestion[] {
  const out: ResumeSuggestion[] = [];
  for (const gap of gaps.slice(0, 6)) {
    const text = buildSuggestion(gap);
    if (text) out.push({ gap, text });
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Framer Motion staggered container — children fade up in sequence when the
 * panel is expanded.
 * ------------------------------------------------------------------------- */
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ---------------------------------------------------------------------------
 * Single suggestion card with copy-to-clipboard affordance.
 * ------------------------------------------------------------------------- */
function SuggestionCard({ suggestion, index }: { suggestion: ResumeSuggestion; index: number }) {
  const { gap, text } = suggestion;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Suggestion copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in insecure contexts or when the document
      // isn't focused. Surface the failure so the user isn't left guessing.
      toast.error("Couldn't copy — please copy manually.");
    }
  }, [text]);

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "hm-card-lift hm-elevated rounded-xl p-4 sm:p-5",
        "bg-card/60 border border-border/60",
        "flex flex-col gap-3",
      )}
    >
      {/* Header row: competency + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h4 className="text-[13px] font-semibold text-foreground truncate">
              {gap.competency}
            </h4>
            <CategoryBadge category={gap.category} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <PriorityPill priority={gap.priority} />
            <LevelBadge level={gap.candidateLevel} />
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums shrink-0 mt-0.5">
          #{index + 1}
        </span>
      </div>

      {/* Suggestion body */}
      <p className="text-[13px] leading-relaxed text-foreground/85">{text}</p>

      {/* Footer: copy button */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy suggestion for ${gap.competency}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success-foreground" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * ResumeSuggestions — exported panel. Renders inside the Gaps view, after the
 * "Other open gaps" section. Starts collapsed.
 * ------------------------------------------------------------------------- */
export function ResumeSuggestions({ gaps }: { gaps: SkillGap[] }) {
  const [open, setOpen] = React.useState(false);
  const suggestions = React.useMemo(() => deriveSuggestions(gaps), [gaps]);

  if (suggestions.length === 0) {
    // No actionable suggestions (e.g. every gap is already "strong"). Hide
    // the panel entirely rather than render an empty collapsible.
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="hm-glass-panel rounded-2xl">
      {/* Header / trigger */}
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="resume-suggestions-content"
          className={cn(
            "group flex w-full items-center gap-3 p-4 sm:p-6 text-left",
            "rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
            "transition-colors hover:bg-foreground/[0.02]",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold text-foreground">
                Resume improvement suggestions
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-blue-foreground">
                <Sparkles className="h-3 w-3" />
                {suggestions.length} actionable
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
              Concrete additions to strengthen your resume, derived from your detected gaps.
            </p>
          </div>
          <span className="flex items-center gap-1.5 shrink-0 text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="hidden sm:inline">{open ? "Hide" : "Show"} suggestions</span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </span>
        </button>
      </CollapsibleTrigger>

      {/* Collapsible content */}
      <CollapsibleContent id="resume-suggestions-content" className="CollapsibleContent">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="h-px bg-border/60 mb-4" />
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {suggestions.map((s, i) => (
                    <SuggestionCard key={s.gap.competency} suggestion={s} index={i} />
                  ))}
                </motion.div>

                {/* Footnote */}
                <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                  Suggestions are deterministic and based on your detected evidence level for
                  each gap. Use the copy button to drop them into your resume draft, then edit
                  for your specific context.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
