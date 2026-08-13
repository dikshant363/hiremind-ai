"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  AlertOctagon,
  ArrowRightCircle,
  Compass,
  Target,
  ListChecks,
  MessageSquare,
  ShieldCheck,
  GitBranch,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  RotateCcw,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useHireMind } from "@/lib/store";
import { toast } from "sonner";
import { ScoreRing, CompetencyBar, AnimatedCounter } from "./shell";
import { SessionSummary } from "./session-summary";
import { ExportResults } from "./export-results";
import { InterviewTimeline } from "./interview-timeline";
import type { SkillLevel } from "@/lib/types";

/** Map a 0..1 dimension score onto the smooth color scale:
 * <0.30 critical · 0.30–0.50 warning · 0.50–0.70 accent-blue · >0.70 success. */
function scoreToStatus(score: number): "matched" | "weak" | "gap" | "accent" {
  if (score >= 0.7) return "matched";
  if (score >= 0.5) return "accent";
  if (score >= 0.3) return "weak";
  return "gap";
}

/** A short human explanation of what each readiness dimension represents. */
const DIMENSION_EXPLANATIONS: Record<string, string> = {
  "Job alignment":
    "Derived from your Prototype Job Match Index — how well your resume maps to required + preferred competencies for this role.",
  "Required competency coverage":
    "Share of must-have competencies you have demonstrated. Missing required skills cap this score hard.",
  "Interview evidence":
    "Average depth, technical accuracy and clarity across your adaptive interview answers. Empty if you skipped the interview.",
  "Technical readiness":
    "Aggregate of job alignment plus demonstrated depth from the interview — a forward-looking signal.",
  Communication:
    "How clearly and structurally your interview answers were framed. Heavily weighted by the evaluation rubric.",
};

export function ReadinessView() {
  const { readiness, interview, gaps, computeReadiness, loading, loadingStep, setView, startInterview } = useHireMind();

  // Look up past sessions to derive a trend vs the most recent prior readiness index.
  const [trend, setTrend] = React.useState<{ delta: number; label: string } | null>(null);
  React.useEffect(() => {
    if (!readiness) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session?list=true");
        if (!res.ok) return;
        const data = await res.json();
        const sessions: { readinessIndex: number | null }[] = data.sessions || [];
        // The list is ordered newest-first; the *previous* session is at index 1
        // (index 0 is the current session that just produced this readiness score).
        const prior = sessions.find((s) => typeof s.readinessIndex === "number" && s.readinessIndex !== readiness.index);
        if (!prior || prior.readinessIndex === null) return;
        const delta = readiness.index - prior.readinessIndex;
        if (!cancelled && delta !== 0) {
          setTrend({
            delta,
            label: delta > 0 ? `↑${delta} vs last session` : `↓${Math.abs(delta)} vs last session`,
          });
        }
      } catch {
        /* ignore — trend is purely informational */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [readiness]);

  // If readiness hasn't been computed yet, prompt to compute
  if (!readiness) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Vibrant Compass icon with subtle gradient background — more confident than a faint Sparkles */}
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/20 to-chart-5/15 text-accent-blue-foreground ring-1 ring-accent-blue/20 shadow-sm">
            <Compass className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">Calculate your job readiness.</h1>
          <p className="mt-3 text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">
            We&rsquo;ll combine your match index, interview evidence and identified weaknesses into a transparent Prototype Job Readiness Index.
          </p>
          <div className="mt-6">
            <Button size="lg" className={`h-12 px-7 gap-2${loading ? " hm-glow-pulse" : ""}`} onClick={computeReadiness} disabled={loading}>
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 hm-thinking" /> {loadingStep || "Working…"}
                </>
              ) : (
                <>Calculate readiness</>
              )}
            </Button>
          </div>

          {/* "What we calculate" preview — shows the dimensions before computing */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 grid sm:grid-cols-3 gap-3 text-left"
          >
            {[
              { icon: <Target className="h-4 w-4" />, title: "Job alignment", body: "How well your evidence maps to required + preferred competencies." },
              { icon: <ListChecks className="h-4 w-4" />, title: "Required coverage", body: "Share of must-have competencies you have demonstrated." },
              { icon: <MessageSquare className="h-4 w-4" />, title: "Interview evidence", body: "Depth and clarity from your adaptive interview answers." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="hm-elevated rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
                    {item.icon}
                  </span>
                  <h4 className="text-[13px] font-semibold">{item.title}</h4>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust feature row — reduces the empty space below the button */}
          <div className="mt-10 pt-6 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-blue-foreground" />
              Honest by design
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent-blue-foreground" />
              Explainable scores
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-accent-blue-foreground" />
              Adaptive, not static
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  const tone =
    readiness.band === "strong"
      ? "success"
      : readiness.band === "good"
      ? "success"
      : readiness.band === "fair"
      ? "warning"
      : "critical";

  // The biggest gap drives the recommended-next-action CTA copy.
  const topGap = gaps && gaps.length > 0 ? gaps[0] : null;
  const recommendationFocus = topGap?.competency ?? "your top gap";

  // Look up priority level for each blocker name (blockers are just competency strings).
  const priorityByCompetency = new Map<string, "critical" | "high" | "medium" | "low">();
  if (gaps) for (const g of gaps) priorityByCompetency.set(g.competency, g.importance);

  const trendPill = trend ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        trend.delta > 0
          ? "bg-success/15 text-success-foreground"
          : "bg-critical/15 text-critical-foreground"
      }`}
    >
      {trend.delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {trend.label}
    </span>
  ) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Job Readiness</div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Where do you stand?</h1>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    toast("Session link copied to clipboard");
                  });
                }}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span className="text-[11px]">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy link to share this session</TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          This is a Prototype Job Readiness Index — assessment support, not a hiring verdict. It aggregates your match, required coverage and interview evidence.
        </p>
      </motion.div>

      <div className="mt-6 sm:mt-8 grid gap-4 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="hm-card hm-card-hover p-4 sm:p-6 lg:col-span-2 flex flex-col items-center justify-center text-center overflow-visible"
        >
          <ScoreRing
            value={readiness.index}
            label="Prototype Job Readiness Index"
            caption={readiness.headline}
            tone={tone as "neutral" | "success" | "warning" | "critical"}
            delay={200}
            labelExtra={trendPill}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hm-card hm-card-hover p-4 sm:p-6 lg:col-span-3 overflow-visible"
        >
          <h3 className="text-[13px] font-semibold mb-4">Readiness dimensions</h3>
          <div className="space-y-5">
            {readiness.dimensions.map((d, i) => {
              const status = scoreToStatus(d.score);
              const explanation =
                DIMENSION_EXPLANATIONS[d.label] ?? "This dimension contributes to your overall Job Readiness Index.";
              return (
                <Tooltip key={d.label} delayDuration={120}>
                  <TooltipTrigger asChild>
                    <div className="group cursor-help rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-secondary/40">
                      {/* Label + score on a single aligned row */}
                      <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center mb-1.5">
                        <span className="text-[13px] font-medium">{d.label}</span>
                        <span className="text-[13px] font-semibold tabular-nums hm-num-tabular text-right">
                          <AnimatedCounter value={Math.round(d.score * 100)} delay={0.2 + i * 0.08} duration={900} />
                        </span>
                      </div>
                      {/* Bar spans full width below */}
                      <CompetencyBar label="" value={d.score} status={status} index={i} />
                      <div className="mt-1 text-[11px] text-foreground/80 leading-relaxed">{d.detail}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-left leading-relaxed font-normal">
                    <span className="block">
                      <span className="font-semibold">{d.label}</span>
                      <br />
                      {explanation}
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* INSIGHTS TABS — deeper breakdown of strengths, watch-outs, coverage */}
      <InsightsTabs />

      {/* Critical blockers + next best action */}
      <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          // overflow-visible + min-h-fit so the card grows naturally and never clips the last list item
          className="hm-card p-4 sm:p-6 min-h-fit overflow-visible"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-critical/15 text-critical-foreground">
              <AlertOctagon className="h-5 w-5" />
            </span>
            <h3 className="text-[13px] font-semibold">Critical blockers</h3>
          </div>
          {readiness.criticalBlockers.length > 0 ? (
            <ul className="space-y-3">
              {readiness.criticalBlockers.map((b, i) => {
                const priority = priorityByCompetency.get(b) ?? "critical";
                const priorityLabel =
                  priority === "critical"
                    ? "Critical"
                    : priority === "high"
                    ? "High"
                    : priority === "medium"
                    ? "Medium"
                    : "Low";
                return (
                  <motion.li
                    key={b}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                    className="group flex items-start gap-3"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-critical/15 text-critical-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-critical animate-pulse" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground">{b}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {priorityLabel} priority
                        </span>
                      </div>
                      <button
                        onClick={() => setView("gaps")}
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent-blue-foreground opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hover:underline"
                      >
                        View in Skill Gaps <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground">No critical blockers — well done.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hm-card p-4 sm:p-6 min-h-fit overflow-visible"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue-foreground">
              <ArrowRightCircle className="h-5 w-5" />
            </span>
            <h3 className="text-[13px] font-semibold">Your next best action</h3>
          </div>
          <p className="text-[14px] text-foreground leading-relaxed">{readiness.nextBestAction}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button className="gap-2" onClick={() => setView("roadmap")}>
              Open my roadmap <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => startInterview()}
              disabled={loading}
            >
              {loading ? <Sparkles className="h-4 w-4 hm-thinking" /> : <RotateCcw className="h-4 w-4" />}
              Retake interview
            </Button>
          </div>
          <div className="mt-3">
            <ExportResults />
          </div>
        </motion.div>
      </div>

      {/* Recommended next action card — targets the biggest gap with a focused interview CTA */}
      {topGap && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="hm-card hm-card-hover p-4 sm:p-6 mt-4 overflow-visible"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue-foreground">
                <Target className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                  Recommended next action
                </div>
                <div className="text-[14px] font-semibold text-foreground">
                  Start a focused interview on {recommendationFocus}
                </div>
                <p className="mt-1 text-[12px] text-foreground/80 leading-relaxed">
                  Your adaptive interview will open with a question targeting your highest-impact gap. Three to seven questions, calibrated to your level.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                className="gap-2 h-11 px-5"
                onClick={() => {
                  if (interview && interview.status !== "complete") {
                    setView("interview");
                  } else {
                    startInterview();
                  }
                }}
              >
                Start focused interview <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Interview evidence summary */}
      {interview && interview.evaluations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="hm-card p-4 sm:p-6 mt-4 overflow-visible"
        >
          <h3 className="text-[13px] font-semibold mb-3">Interview evidence ({interview.evaluations.length} answered)</h3>
          <div className="space-y-2">
            {interview.competencyStates
              .filter((c) => c.interviewLevel !== "unknown")
              .map((c) => (
                <div key={c.competency} className="flex items-center justify-between text-[13px]">
                  <div>
                    <span className="font-medium">{c.competency}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground capitalize">
                      resume: {c.resumeLevel} → interview: {c.interviewLevel}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground capitalize">{c.status}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Interview journey — full adaptive timeline */}
      <InterviewTimeline />

      {/* Session Summary */}
      <SessionSummary />
    </div>
  );
}

/* ============================================================================
 * InsightsTabs — tabbed section with Strengths / Watch-outs / Coverage.
 * Renders after the readiness dimensions grid. All derived from existing
 * store state (gaps, interview, match) — no API calls.
 * ==========================================================================*/

const LEVEL_INTENSITY: Record<SkillLevel, { label: string; bg: string; text: string; dot: string }> = {
  strong: {
    label: "Strong",
    bg: "bg-success/12",
    text: "text-success-foreground",
    dot: "bg-success",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-accent-blue/10",
    text: "text-accent-blue-foreground",
    dot: "bg-accent-blue",
  },
  weak: {
    label: "Weak",
    bg: "bg-warning/12",
    text: "text-warning-foreground",
    dot: "bg-warning",
  },
  unknown: {
    label: "Unknown",
    bg: "bg-muted/60",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

function InsightsTabs() {
  const { gaps, interview, match } = useHireMind();
  const [tab, setTab] = React.useState("strengths");

  // Derive strengths: competencies whose current level is strong or moderate,
  // or that have interview evidence with high overall scores.
  const strengths: { name: string; reason: string }[] = [];
  const watchOuts: { name: string; reason: string }[] = [];

  if (interview) {
    for (const c of interview.competencyStates) {
      if (c.current === "strong") {
        strengths.push({
          name: c.competency,
          reason:
            c.interviewLevel !== "unknown"
              ? `Demonstrated in interview (resume: ${c.resumeLevel}).`
              : `Strong resume signal — not yet verified in interview.`,
        });
      } else if (c.current === "moderate" && c.interviewLevel !== "unknown") {
        strengths.push({
          name: c.competency,
          reason: `Solid interview evidence (resume: ${c.resumeLevel} → interview: ${c.interviewLevel}).`,
        });
      } else if (c.status === "gap" || c.current === "unknown" || c.current === "weak") {
        watchOuts.push({
          name: c.competency,
          reason:
            c.notes ||
            (c.interviewLevel === "unknown"
              ? "No interview evidence yet — unverified."
              : "Low scores in this area."),
        });
      }
    }
  }

  // Augment watch-outs from gaps list (if not already present)
  if (gaps) {
    for (const g of gaps) {
      if (watchOuts.find((w) => w.name === g.competency)) continue;
      if (g.importance === "critical" || g.importance === "high") {
        watchOuts.push({
          name: g.competency,
          reason: g.reason,
        });
      }
    }
  }

  // Augment strengths from match rows (matched competencies not in competencyStates)
  if (match) {
    for (const r of match.rows) {
      if (r.status === "matched" && !strengths.find((s) => s.name === r.competency)) {
        strengths.push({
          name: r.competency,
          reason: r.evidence
            ? `Resume evidence: "${r.evidence.slice(0, 80)}${r.evidence.length > 80 ? "…" : ""}"`
            : "Aligned with job requirements.",
        });
      }
    }
  }

  // Cap each list at 6 items for layout stability
  const topStrengths = strengths.slice(0, 6);
  const topWatchOuts = watchOuts.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="hm-card hm-card-hover mt-4 p-4 sm:p-6 overflow-visible"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue-foreground">
          <LayoutGrid className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-[13px] font-semibold">Insights</h3>
          <div className="text-[11px] text-muted-foreground">A deeper breakdown of your readiness signals</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="strengths" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Strengths
            <span className="ml-1 rounded bg-success/15 text-success-foreground px-1 text-[9px] font-semibold leading-none py-0.5">
              {topStrengths.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="watchouts" className="gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Watch-outs
            <span className="ml-1 rounded bg-warning/15 text-warning-foreground px-1 text-[9px] font-semibold leading-none py-0.5">
              {topWatchOuts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-1.5">
            <LayoutGrid className="h-3 w-3" />
            Coverage
          </TabsTrigger>
        </TabsList>

        {/* Strengths tab */}
        <TabsContent value="strengths">
          {topStrengths.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {topStrengths.map((s, i) => (
                <motion.li
                  key={s.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/5 p-3"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-success/15 text-success-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground leading-tight">{s.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{s.reason}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground py-6 text-center">
              No standout strengths detected yet. Run the interview to gather evidence.
            </p>
          )}
        </TabsContent>

        {/* Watch-outs tab */}
        <TabsContent value="watchouts">
          {topWatchOuts.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {topWatchOuts.map((w, i) => (
                <motion.li
                  key={w.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/5 p-3"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning-foreground">
                    <AlertTriangle className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground leading-tight">{w.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{w.reason}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground py-6 text-center">
              No watch-outs detected. Your profile aligns well with the role requirements.
            </p>
          )}
        </TabsContent>

        {/* Coverage tab — heatmap grid */}
        <TabsContent value="coverage">
          <CoverageHeatmap />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

/** Coverage heatmap — grid of competency cells. Each cell shows the competency
 *  name, level, and required badge. Background tint + dot color reflect the
 *  candidate's current level. */
function CoverageHeatmap() {
  const { match, interview } = useHireMind();

  // Merge match rows with interview competency states so each cell shows the
  // latest known level (interview evidence takes precedence over resume level).
  const interviewLevels = new Map<string, SkillLevel>();
  if (interview) {
    for (const c of interview.competencyStates) {
      interviewLevels.set(c.competency, c.current);
    }
  }

  if (!match || match.rows.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground py-6 text-center">
        Run an analysis to see your competency coverage.
      </p>
    );
  }

  const rows = match.rows;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[11px] text-muted-foreground">
          {rows.length} competencies · color shows your level · ring shows required
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {(["strong", "moderate", "weak", "unknown"] as SkillLevel[]).map((lvl) => (
            <span key={lvl} className="inline-flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-sm ${LEVEL_INTENSITY[lvl].dot}`} />
              {LEVEL_INTENSITY[lvl].label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {rows.map((r, i) => {
          const level = interviewLevels.get(r.competency) ?? r.candidateLevel;
          const intensity = LEVEL_INTENSITY[level];
          return (
            <motion.div
              key={r.competency}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.4) }}
              className={`relative rounded-lg border ${r.required ? "border-foreground/40" : "border-border/60"} ${intensity.bg} p-2.5 min-h-[68px] flex flex-col justify-between`}
              title={`${r.competency} — ${intensity.label} (${r.importance} importance)`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] font-semibold leading-tight line-clamp-2 text-foreground">
                  {r.competency}
                </span>
                {r.required && (
                  <span className="shrink-0 rounded bg-foreground/85 text-background px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider leading-none">
                    Req
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${intensity.dot}`} />
                <span className={`text-[10px] font-medium ${intensity.text}`}>
                  {intensity.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
