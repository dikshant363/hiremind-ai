"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  Zap,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Timer,
  TimerOff,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { AnswerEvaluation, InterviewState } from "@/lib/types";
import { useHireMind } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ============================================================================
 * Interview Insights Panel — premium post-interview analytics.
 *
 * Shown AFTER the interview is complete (status === "complete") inside the
 * evaluation view. Renders five sections:
 *   1. Performance Trend — CSS bar chart of overall scores per question
 *   2. Time Analysis — avg / fastest / slowest answer times
 *   3. Skill Coverage — colored pills for each tested skill
 *   4. Strengths & Weaknesses — top 2 strongest / top 2 weakest dimensions
 *   5. Improvement Quick Tips — actionable tips from weakest areas
 *
 * All derived from deterministic evaluation + competency state in the store.
 * No new API calls. Glassmorphism card design with framer-motion entrance.
 * ==========================================================================*/

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Average of an array of numbers. Returns 0 for empty. */
function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Estimate minutes spent per answer from character count assuming ~30 wpm
 *  and ~5 chars/word → ~150 chars/min. Minimum 0.3 min. */
function estimateMinutes(text: string): number {
  const chars = text.trim().length;
  if (chars === 0) return 0;
  return Math.max(0.3, Math.round((chars / 150) * 10) / 10);
}

/** Format minutes to "Xm Ys" or "Ys". */
function formatTime(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** The four evaluation dimensions as labeled entries. */
const DIMENSIONS = [
  { key: "technicalAccuracy", label: "Technical Accuracy" },
  { key: "relevance", label: "Relevance" },
  { key: "depth", label: "Depth" },
  { key: "communication", label: "Communication" },
] as const;

type DimKey = (typeof DIMENSIONS)[number]["key"];

/** Skill level to color mapping. */
function skillColor(level: "strong" | "moderate" | "weak"): string {
  switch (level) {
    case "strong":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20";
    case "moderate":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20";
    case "weak":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20";
  }
}

/** Score to skill level. */
function scoreToLevel(score: number): "strong" | "moderate" | "weak" {
  if (score >= 0.7) return "strong";
  if (score >= 0.4) return "moderate";
  return "weak";
}

/** Quick improvement tips keyed by dimension name. */
const TIP_MAP: Record<string, string[]> = {
  "Technical Accuracy": [
    "Review core fundamentals with spaced-repetition flashcards.",
    "Practice explaining concepts aloud — clarity reveals gaps.",
  ],
  Relevance: [
    "Before answering, restate the question in your own words to stay on-topic.",
    "Study the job description's top 3 requirements and align answers to them.",
  ],
  Depth: [
    "Use the '5 Whys' technique to go beyond surface-level answers.",
    "Include a real-world example or trade-off analysis in every answer.",
  ],
  Communication: [
    "Structure answers with a brief intro, core point, and takeaway.",
    "Avoid jargon overload — explain terms if the interviewer might not know them.",
  ],
};

function getTips(weakestDims: string[]): string[] {
  const tips: string[] = [];
  for (const dim of weakestDims) {
    const dimTips = TIP_MAP[dim];
    if (dimTips) {
      for (const t of dimTips) {
        if (!tips.includes(t)) tips.push(t);
      }
    }
  }
  // Fallback generic tips
  if (tips.length === 0) {
    tips.push(
      "Practice mock interviews weekly — repetition builds confidence.",
      "Record yourself answering and review for clarity and depth.",
      "Focus on the weakest skill area first for highest impact."
    );
  }
  return tips.slice(0, 3);
}

/* ---------------------------------------------------------------------------
 * Section 1: Performance Trend (CSS bar chart)
 * ------------------------------------------------------------------------- */

function PerformanceTrend({ evals }: { evals: AnswerEvaluation[] }) {
  const scores = evals.map((e) => Math.round(e.overall * 100));
  const maxScore = Math.max(...scores, 1);
  const avgScore = Math.round(avg(scores));
  const trend =
    scores.length >= 2
      ? scores[scores.length - 1] - scores[scores.length - 2]
      : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-semibold">Performance Trend</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Avg: <span className="font-semibold text-foreground tabular-nums">{avgScore}%</span></span>
          {scores.length >= 2 && (
            <span className={cn("flex items-center gap-0.5 font-medium", trend > 0 ? "text-emerald-600 dark:text-emerald-400" : trend < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-20">
        {scores.map((score, i) => {
          const heightPct = Math.max(8, (score / maxScore) * 100);
          const barColor =
            score >= 70
              ? "bg-emerald-500/70 dark:bg-emerald-500/50"
              : score >= 50
                ? "bg-amber-500/70 dark:bg-amber-500/50"
                : "bg-rose-500/70 dark:bg-rose-500/50";

          return (
            <motion.div
              key={i}
              className={cn("flex-1 rounded-t-sm relative group min-w-[14px]", barColor)}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${heightPct}%`, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Hover tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-foreground bg-card border border-border rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap tabular-nums">
                Q{i + 1}: {score}%
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Question labels */}
      <div className="flex gap-1.5">
        {scores.map((_, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums min-w-[14px]">
            Q{i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section 2: Time Analysis
 * ------------------------------------------------------------------------- */

function TimeAnalysis({ interview }: { interview: InterviewState }) {
  const times = interview.answers.map((a) => estimateMinutes(a.text));
  const nonZeroTimes = times.filter((t) => t > 0);

  if (nonZeroTimes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
            <Clock className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-semibold">Time Analysis</span>
        </div>
        <p className="text-[12px] text-muted-foreground">No answer timing data available.</p>
      </div>
    );
  }

  const avgTime = avg(nonZeroTimes);
  const fastest = Math.min(...nonZeroTimes);
  const slowest = Math.max(...nonZeroTimes);
  const fastestIdx = times.indexOf(fastest);
  const slowestIdx = times.lastIndexOf(slowest);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
          <Clock className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold">Time Analysis</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Average */}
        <div className="rounded-lg bg-secondary/40 p-3 text-center space-y-1">
          <Timer className="h-4 w-4 mx-auto text-muted-foreground/60" />
          <div className="text-[11px] text-muted-foreground">Average</div>
          <div className="text-[15px] font-semibold tabular-nums">{formatTime(avgTime)}</div>
          <div className="text-[10px] text-muted-foreground">per question</div>
        </div>

        {/* Fastest */}
        <div className="rounded-lg bg-emerald-500/5 dark:bg-emerald-500/8 p-3 text-center space-y-1 ring-1 ring-emerald-500/10">
          <Zap className="h-4 w-4 mx-auto text-emerald-600 dark:text-emerald-400" />
          <div className="text-[11px] text-muted-foreground">Fastest</div>
          <div className="text-[15px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatTime(fastest)}
          </div>
          <div className="text-[10px] text-muted-foreground">Q{fastestIdx + 1}</div>
        </div>

        {/* Slowest */}
        <div className="rounded-lg bg-amber-500/5 dark:bg-amber-500/8 p-3 text-center space-y-1 ring-1 ring-amber-500/10">
          <TimerOff className="h-4 w-4 mx-auto text-amber-600 dark:text-amber-400" />
          <div className="text-[11px] text-muted-foreground">Slowest</div>
          <div className="text-[15px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">
            {formatTime(slowest)}
          </div>
          <div className="text-[10px] text-muted-foreground">Q{slowestIdx + 1}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section 3: Skill Coverage (colored pills)
 * ------------------------------------------------------------------------- */

function SkillCoverage({ interview }: { interview: InterviewState }) {
  // Build a map of competency → average overall score across evaluations
  const compScores: Record<string, number> = {};
  for (const ev of interview.evaluations) {
    const comp = ev.detectedCompetency || ev.competency;
    if (!compScores[comp]) compScores[comp] = 0;
    compScores[comp] += ev.overall;
  }
  // Also add competencies from questions that weren't evaluated yet
  const seenComps = new Set(Object.keys(compScores));
  for (const q of interview.questions) {
    if (!seenComps.has(q.competency)) {
      compScores[q.competency] = 0;
      seenComps.add(q.competency);
    }
  }

  // Count evaluations per competency for averaging
  const compCounts: Record<string, number> = {};
  for (const ev of interview.evaluations) {
    const comp = ev.detectedCompetency || ev.competency;
    compCounts[comp] = (compCounts[comp] || 0) + 1;
  }

  const skills = Object.entries(compScores).map(([comp, total]) => ({
    name: comp,
    score: compCounts[comp] ? total / compCounts[comp] : 0,
    level: compCounts[comp] ? scoreToLevel(total / compCounts[comp]) : "weak",
  }));

  // Sort: strong first, then moderate, then weak
  const order = { strong: 0, moderate: 1, weak: 2 };
  skills.sort((a, b) => order[a.level] - order[b.level] || b.score - a.score);

  const strongCount = skills.filter((s) => s.level === "strong").length;
  const moderateCount = skills.filter((s) => s.level === "moderate").length;
  const weakCount = skills.filter((s) => s.level === "weak").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
            <Target className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-semibold">Skill Coverage</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {strongCount > 0 && <span className="text-emerald-600 dark:text-emerald-400">{strongCount} strong</span>}
          {moderateCount > 0 && <span className="text-amber-600 dark:text-amber-400">{moderateCount} moderate</span>}
          {weakCount > 0 && <span className="text-rose-600 dark:text-rose-400">{weakCount} weak</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, i) => (
          <motion.span
            key={skill.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
              skillColor(skill.level)
            )}
          >
            {skill.level === "strong" && <TrendingUp className="h-3 w-3" />}
            {skill.level === "moderate" && <Minus className="h-3 w-3" />}
            {skill.level === "weak" && <TrendingDown className="h-3 w-3" />}
            {skill.name}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section 4: Strengths & Weaknesses (top 2 dimensions)
 * ------------------------------------------------------------------------- */

function StrengthsWeaknesses({ evals }: { evals: AnswerEvaluation[] }) {
  // Average each dimension across all evaluations
  const dimScores: { key: DimKey; label: string; score: number }[] = DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    score: avg(evals.map((e) => e[d.key as keyof AnswerEvaluation] as number)),
  }));

  // Sort descending by score
  const sorted = [...dimScores].sort((a, b) => b.score - a.score);
  const top2 = sorted.slice(0, 2);
  const bottom2 = sorted.slice(-2).reverse(); // weakest first

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
          <Award className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold">Strengths & Weaknesses</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Top strengths */}
        <div className="rounded-lg bg-emerald-500/5 dark:bg-emerald-500/8 p-3 ring-1 ring-emerald-500/10 space-y-2">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Strongest
          </div>
          {top2.map((d) => (
            <div key={d.key} className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">{d.label}</span>
              <span className="text-[12px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {Math.round(d.score * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* Bottom weaknesses */}
        <div className="rounded-lg bg-rose-500/5 dark:bg-rose-500/8 p-3 ring-1 ring-rose-500/10 space-y-2">
          <div className="text-[11px] font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Needs Work
          </div>
          {bottom2.map((d) => (
            <div key={d.key} className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">{d.label}</span>
              <span className="text-[12px] font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                {Math.round(d.score * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section 5: Improvement Quick Tips
 * ------------------------------------------------------------------------- */

function ImprovementTips({ evals }: { evals: AnswerEvaluation[] }) {
  // Find weakest dimensions
  const dimScores: { label: string; score: number }[] = DIMENSIONS.map((d) => ({
    label: d.label,
    score: avg(evals.map((e) => e[d.key as keyof AnswerEvaluation] as number)),
  }));

  const sorted = [...dimScores].sort((a, b) => a.score - b.score);
  const weakestLabels = sorted.slice(0, 2).map((d) => d.label);
  const tips = getTips(weakestLabels);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
          <Lightbulb className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold">Improvement Quick Tips</span>
      </div>

      <div className="space-y-2">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
            className="flex items-start gap-2.5 rounded-lg bg-secondary/30 px-3 py-2.5 text-[12px] text-foreground leading-relaxed"
          >
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue-foreground text-[10px] font-semibold">
              {i + 1}
            </span>
            {tip}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main Component: InterviewInsightsPanel
 * ------------------------------------------------------------------------- */

export function InterviewInsightsPanel() {
  const { interview } = useHireMind();
  const [expanded, setExpanded] = React.useState(true);

  // Only show when interview is complete
  if (!interview || interview.status !== "complete") return null;
  if (interview.evaluations.length === 0) return null;

  const evals = interview.evaluations;
  const totalQ = interview.totalQuestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 sm:mt-8"
    >
      {/* Header — expandable toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between rounded-xl hm-glass-chip px-5 py-3.5 mb-1 group transition-all hover:bg-accent-blue/5"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <div className="text-left">
            <div className="text-[14px] font-semibold">Interview Insights</div>
            <div className="text-[11px] text-muted-foreground">
              {totalQ} questions · {evals.length} evaluated · comprehensive breakdown
            </div>
          </div>
        </div>
        <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-xl hm-glass-chip p-5 sm:p-6 mt-1 space-y-6">
              {/* 1. Performance Trend */}
              <PerformanceTrend evals={evals} />

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* 2. Time Analysis */}
              <TimeAnalysis interview={interview} />

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* 3. Skill Coverage */}
              <SkillCoverage interview={interview} />

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* 4. Strengths & Weaknesses */}
              <StrengthsWeaknesses evals={evals} />

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* 5. Improvement Quick Tips */}
              <ImprovementTips evals={evals} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
