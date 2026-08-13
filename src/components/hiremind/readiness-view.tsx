"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, AlertOctagon, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import { ScoreRing, CompetencyBar } from "./shell";
import { SessionSummary } from "./session-summary";
import { ExportResults } from "./export-results";

export function ReadinessView() {
  const { readiness, interview, gaps, computeReadiness, loading, loadingStep, setView } = useHireMind();

  // If readiness hasn't been computed yet, prompt to compute
  if (!readiness) {
    return (
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue-foreground">
            <Sparkles className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Calculate your job readiness.</h1>
          <p className="mt-3 text-[14px] text-muted-foreground max-w-md mx-auto">
            We'll combine your match index, interview evidence and identified weaknesses into a transparent Prototype Job Readiness Index.
          </p>
          <div className="mt-6">
            <Button size="lg" className="h-12 px-7 gap-2" onClick={computeReadiness} disabled={loading}>
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 hm-thinking" /> {loadingStep || "Working…"}
                </>
              ) : (
                <>Calculate readiness</>
              )}
            </Button>
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

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Job Readiness</div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Where do you stand?</h1>
        <p className="mt-2 text-[14px] text-muted-foreground max-w-xl">
          This is a Prototype Job Readiness Index — assessment support, not a hiring verdict. It aggregates your match, required coverage and interview evidence.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="hm-card p-6 lg:col-span-2 flex flex-col items-center justify-center text-center"
        >
          <ScoreRing
            value={readiness.index}
            label="Prototype Job Readiness Index"
            caption={readiness.headline}
            tone={tone as "neutral" | "success" | "warning" | "critical"}
            delay={200}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hm-card p-6 lg:col-span-3"
        >
          <h3 className="text-[13px] font-semibold mb-4">Readiness dimensions</h3>
          <div className="space-y-4">
            {readiness.dimensions.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="font-medium">{d.label}</span>
                  <span className="font-semibold tabular-nums">{Math.round(d.score * 100)}</span>
                </div>
                <CompetencyBar
                  label=""
                  value={d.score}
                  status={d.score >= 0.7 ? "matched" : d.score >= 0.4 ? "weak" : "gap"}
                />
                <div className="mt-1 text-[11px] text-muted-foreground">{d.detail}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Critical blockers + next best action */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hm-card p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-critical/10 text-critical-foreground">
              <AlertOctagon className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[13px] font-semibold">Critical blockers</h3>
          </div>
          {readiness.criticalBlockers.length > 0 ? (
            <ul className="space-y-2">
              {readiness.criticalBlockers.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                  className="text-[13px] flex gap-2 items-center"
                >
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-critical animate-pulse" />
                  <span className="text-foreground">{b}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground">No critical blockers — well done.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hm-card p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
              <Compass className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[13px] font-semibold">Your next best action</h3>
          </div>
          <p className="text-[14px] text-foreground leading-relaxed">{readiness.nextBestAction}</p>
          <Button className="mt-4 gap-2" onClick={() => setView("roadmap")}>
            Open my roadmap <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="mt-3">
            <ExportResults />
          </div>
        </motion.div>
      </div>

      {/* Interview evidence summary */}
      {interview && interview.evaluations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="hm-card p-6 mt-4"
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

      {/* Session Summary */}
      <SessionSummary />
    </div>
  );
}
