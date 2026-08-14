"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  Repeat,
  CheckCircle2,
  Map,
  Compass,
  Clock,
  Zap,
  Target,
  RefreshCw,
  Check,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import { ScoreRing } from "@/components/hiremind/shell";
import { toast } from "sonner";
import type { RoadmapStep } from "@/lib/types";

/* ─── Phase metadata ─── */

const PHASES: RoadmapStep["phase"][] = ["TODAY", "NEXT", "THEN", "REASSESS"];

const PHASE_META: Record<
  RoadmapStep["phase"],
  { label: string; tone: string; time: string; icon: React.ElementType }
> = {
  TODAY: {
    label: "Today",
    tone: "var(--accent-blue)",
    time: "~1-2 hours",
    icon: Zap,
  },
  NEXT: {
    label: "Next",
    tone: "var(--success)",
    time: "~1-2 weeks",
    icon: ArrowRight,
  },
  THEN: {
    label: "Then",
    tone: "var(--warning)",
    time: "~1-2 months",
    icon: Target,
  },
  REASSESS: {
    label: "Reassess",
    tone: "var(--chart-5)",
    time: "~2-4 weeks",
    icon: RefreshCw,
  },
};

/* ─── Motivational messages by readiness band ─── */

const MOTIVATIONAL: Record<string, string> = {
  low: "Every expert was once a beginner. Start today — momentum compounds.",
  fair: "You're close to breaking through. A focused push on your gaps will get you there.",
  good: "Strong foundation! Sharpen the remaining gaps and you'll be interview-ready.",
  strong: "You're in great shape. Fine-tune and maintain — you're nearly there.",
};

/* ─── LocalStorage helpers for checked practice items ─── */

const LS_KEY = "hiremind-roadmap-checked";

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveChecked(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore quota errors
  }
}

/* ─── Component ─── */

export function RoadmapView() {
  const {
    roadmap,
    readiness,
    reset,
    setView,
    computeReadiness,
    loading,
    loadingStep,
  } = useHireMind();

  // Practice-item checked state (local, persisted to localStorage)
  const [checked, setChecked] = React.useState<Set<string>>(loadChecked);

  const toggleChecked = React.useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveChecked(next);
      return next;
    });
  }, []);

  // Copy-link handler
  const handleCopyLink = React.useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!", { duration: 2000 });
    });
  }, []);

  // Empty state
  if (!roadmap) {
    const hasReadiness = !!readiness;
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/20 to-chart-5/15 text-accent-blue-foreground ring-1 ring-accent-blue/20 shadow-sm">
            <Map className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
            {hasReadiness
              ? "Your roadmap is ready to generate."
              : "Calculate readiness to unlock your roadmap."}
          </h1>
          <p className="mt-3 text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">
            Your improvement roadmap is built directly from your detected gaps
            and interview weaknesses — every step has a clear reason and a
            concrete practice plan.
          </p>
          <div className="mt-6">
            <Button
              size="lg"
              className="h-12 px-7 gap-2"
              onClick={
                hasReadiness ? () => setView("roadmap") : computeReadiness
              }
              disabled={loading}
            >
              {loading ? (
                <>
                  <Compass className="h-4 w-4 hm-thinking" />
                  {loadingStep || "Working…"}
                </>
              ) : hasReadiness ? (
                <>
                  Open my roadmap <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Calculate readiness first{" "}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {!hasReadiness && (
            <p className="mt-4 text-xs text-muted-foreground">
              Or go to{" "}
              <button
                className="text-accent-blue-foreground underline underline-offset-2"
                onClick={() => setView("readiness")}
              >
                Readiness
              </button>{" "}
              to see what we&apos;ll measure.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Compute phase stats for progress indicator
  const phaseCounts: Partial<Record<RoadmapStep["phase"], number>> = {};
  for (const step of roadmap.steps) {
    phaseCounts[step.phase] = (phaseCounts[step.phase] ?? 0) + 1;
  }
  const currentPhase = roadmap.steps[0]?.phase ?? "TODAY";
  const currentPhaseIdx = PHASES.indexOf(currentPhase);

  // Count total + checked practice items
  let totalPractice = 0;
  let checkedPractice = 0;
  for (let i = 0; i < roadmap.steps.length; i++) {
    for (let j = 0; j < roadmap.steps[i].practice.length; j++) {
      totalPractice++;
      const key = `${i}-${j}`;
      if (checked.has(key)) checkedPractice++;
    }
  }

  // Readiness values for close-the-loop section
  const readinessIdx = readiness?.index ?? 0;
  const readinessBand = readiness?.band ?? "fair";
  const targetReadiness = 60;
  const ringTone: "neutral" | "success" | "warning" | "critical" =
    readinessBand === "strong"
      ? "success"
      : readinessBand === "good"
        ? "neutral"
        : readinessBand === "fair"
          ? "warning"
          : "critical";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-8 sm:py-14">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Improvement Roadmap
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">
              Your improvement path.
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={handleCopyLink}
          >
            <Link className="h-3.5 w-3.5" />
            Copy link
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Every step is generated directly from your detected gaps and interview
          weaknesses. No generic filler.
        </p>
      </motion.div>

      {/* ─── Phase progress indicator ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mt-5 sm:mt-6"
      >
        <div className="hm-card p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            {PHASES.map((phase, pi) => {
              const meta = PHASE_META[phase];
              const count = phaseCounts[phase] ?? 0;
              const isCompleted = pi < currentPhaseIdx;
              const isCurrent = pi === currentPhaseIdx;
              const isFuture = pi > currentPhaseIdx;
              return (
                <React.Fragment key={phase}>
                  {pi > 0 && (
                    <div className="flex-1 h-px bg-border relative overflow-hidden">
                      {(isCompleted || isCurrent) && (
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-foreground/20"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: 0.6,
                            delay: 0.1 + pi * 0.12,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={[
                        "inline-flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300",
                        isCompleted
                          ? "bg-foreground/10 text-foreground"
                          : isCurrent
                            ? "hm-step-pulse"
                            : "bg-muted text-muted-foreground/50",
                      ].join(" ")}
                      style={
                        isCurrent
                          ? {
                              background: `color-mix(in oklch, ${meta.tone} 18%, transparent)`,
                              color: meta.tone,
                              boxShadow: `0 0 0 3px color-mix(in oklch, ${meta.tone} 10%, transparent)`,
                            }
                          : undefined
                      }
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-[9px] font-bold">{count}</span>
                      )}
                    </span>
                    <span
                      className={[
                        "text-[10px] font-semibold uppercase tracking-wider",
                        isFuture ? "text-muted-foreground/40" : "",
                      ].join(" ")}
                      style={
                        isCurrent ? { color: meta.tone } : undefined
                      }
                    >
                      {meta.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ─── Current gap card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hm-card mt-4 sm:mt-5 p-4 sm:p-6"
      >
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
          Your current gap
        </div>
        <div className="text-2xl font-semibold tracking-tight">
          {roadmap.currentGap}
        </div>
      </motion.div>

      {/* ─── Timeline ─── */}
      <div className="mt-6 relative">
        {/* Animated vertical connector line — thicker (2px) with draw-in */}
        <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-border hm-timeline-draw-enhanced hidden sm:block" />

        <div className="space-y-5">
          {roadmap.steps.map((step, i) => {
            const meta = PHASE_META[step.phase];
            const PhaseIcon = meta.icon;
            return (
              <motion.div
                key={`step-${step.competency}-${step.phase}-${i}`}
                initial={{ opacity: 0, x: -14, rotate: -1.5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.18 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative pl-14"
              >
                {/* Larger, prominent node circle with phase icon inside */}
                <span
                  className="absolute left-0 top-1 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-all duration-200"
                  style={{ borderColor: meta.tone }}
                >
                  <PhaseIcon
                    className="h-5 w-5"
                    style={{ color: meta.tone }}
                  />
                </span>

                <div className="hm-card hm-card-hover p-4 sm:p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* Phase label pill */}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: `color-mix(in oklch, ${meta.tone} 12%, transparent)`,
                          color: meta.tone,
                        }}
                      >
                        {meta.label}
                      </span>
                      {/* Estimated time badge */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: `color-mix(in oklch, ${meta.tone} 6%, transparent)`,
                          color: `color-mix(in oklch, ${meta.tone} 70%, var(--muted-foreground))`,
                        }}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        {meta.time}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {step.competency}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">
                    {step.focus}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {step.reason}
                  </div>
                  {/* Practice items with checkbox toggle */}
                  {step.practice.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {step.practice.map((p, j) => {
                        const key = `${i}-${j}`;
                        const isChecked = checked.has(key);
                        return (
                          <li
                            key={`practice-${step.competency}-${j}`}
                            className="flex gap-2 cursor-pointer group"
                            onClick={() => toggleChecked(key)}
                          >
                            <CheckCircle2
                              className={[
                                "h-3.5 w-3.5 mt-0.5 shrink-0 transition-colors duration-200",
                                isChecked
                                  ? ""
                                  : "text-muted-foreground/60 group-hover:text-muted-foreground",
                              ].join(" ")}
                              style={
                                isChecked
                                  ? { color: meta.tone }
                                  : undefined
                              }
                              strokeWidth={isChecked ? 0 : 2}
                              fill={isChecked ? "currentColor" : "none"}
                            />
                            <span
                              className={[
                                "text-[12px] transition-all duration-200",
                                isChecked
                                  ? "line-through text-muted-foreground/60"
                                  : "text-muted-foreground",
                              ].join(" ")}
                            >
                              {p}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Practice completion counter ─── */}
      {totalPractice > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-4 text-center"
        >
          <span className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground hm-num-tabular">
              {checkedPractice}
            </span>{" "}
            of{" "}
            <span className="font-semibold hm-num-tabular">
              {totalPractice}
            </span>{" "}
            practice items completed
          </span>
          {totalPractice > 0 && (
            <div className="mt-1.5 mx-auto max-w-[200px] h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent-blue"
                initial={{ width: 0 }}
                animate={{
                  width: `${(checkedPractice / totalPractice) * 100}%`,
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Close the loop ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="hm-card mt-6 sm:mt-8 p-5 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          {/* Small readiness ring */}
          {readiness && (
            <div className="shrink-0">
              <ScoreRing
                value={readinessIdx}
                size={80}
                tone={ringTone}
                delay={0.6}
              />
            </div>
          )}

          <div className="text-center sm:text-left flex-1">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue-foreground sm:hidden">
              <Repeat className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-semibold">Close the loop.</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Practice, then re-run the adaptive interview. Your roadmap should
              be re-driven by new evidence — not a static to-do list.
            </p>

            {/* Before → After comparison */}
            {readiness && (
              <div className="mt-3 inline-flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground">
                  Current readiness:{" "}
                  <span className="font-semibold text-foreground hm-num-tabular">
                    {readinessIdx}/100
                  </span>
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-muted-foreground">
                  Target:{" "}
                  <span className="font-semibold text-foreground hm-num-tabular">
                    {targetReadiness}+
                  </span>
                </span>
              </div>
            )}

            {/* Motivational message */}
            {readiness && (
              <p className="mt-2 text-[11px] text-foreground/60 italic">
                {MOTIVATIONAL[readinessBand] ?? MOTIVATIONAL.fair}
              </p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setView("interview")}
                className="gap-2"
              >
                Retake the interview <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={reset} className="gap-2">
                Start a new analysis
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
