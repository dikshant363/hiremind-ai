"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingDown, Lightbulb, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import { CompetencyBar } from "./shell";
import type { AnswerEvaluation } from "@/lib/types";

export function EvaluationView() {
  const { lastEvaluation, interview, setView, isDemo } = useHireMind();
  if (!lastEvaluation || !interview) return null;

  const ev: AnswerEvaluation = lastEvaluation;
  const isComplete = interview.status === "complete";
  const nextQ = interview.questions[interview.currentIndex];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Answer Evaluation</div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Here's what we learned.</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          We evaluated your answer along four dimensions. The overall score is computed by application logic — never raw model output.
        </p>
      </motion.div>

      {/* Dimensions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="hm-card mt-6 sm:mt-8 p-5 sm:p-8"
      >
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <DimensionBar label="Technical Accuracy" value={ev.technicalAccuracy} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
            <DimensionBar label="Relevance" value={ev.relevance} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.26 }}>
            <DimensionBar label="Depth" value={ev.depth} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.34 }}>
            <DimensionBar label="Communication" value={ev.communication} />
          </motion.div>
        </div>
        <div className="hm-divider my-6" />
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-muted-foreground">Overall (weighted aggregate)</div>
          <div className="text-2xl font-semibold tabular-nums">{Math.round(ev.overall * 100)}%</div>
        </div>
      </motion.div>

      {/* Strengths & weaknesses */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hm-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[13px] font-semibold">What you did well</h3>
          </div>
          {ev.strengths.length > 0 ? (
            <ul className="space-y-2">
              {ev.strengths.map((s, i) => (
                <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-success-foreground">·</span>
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground">No specific strengths detected.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hm-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[13px] font-semibold">Where you can improve</h3>
          </div>
          {ev.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {ev.weaknesses.map((s, i) => (
                <li key={i} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-warning-foreground">·</span>
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground">No major weaknesses detected.</p>
          )}
        </motion.div>
      </div>

      {/* THE WOW MOMENT — what happens next */}
      <AnimatePresence>
        {!isComplete && ev.detectedGap && nextQ && (
          <motion.div
            key="wow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hm-card mt-5 sm:mt-6 p-6 sm:p-10 relative overflow-hidden hm-radial-glow"
          >
            <div
              className="absolute -top-32 -right-32 h-72 w-72 rounded-full opacity-[0.08]"
              style={{ background: "radial-gradient(circle, var(--accent-blue), transparent 70%)" }}
            />
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue/10 text-accent-blue-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider mb-4">
              <Lightbulb className="h-3 w-3" /> What happens next
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-[12px] text-muted-foreground">Your answer showed</span>
                <span className="text-[13px] font-medium">{ev.detectedCompetency} reasoning.</span>
              </div>
              <div className="flex items-start gap-3">
                <TrendingDown className="h-4 w-4 text-critical-foreground mt-0.5" />
                <span className="text-[14px]">
                  One area needs deeper reasoning: <span className="font-semibold">{ev.detectedGap}</span>.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-accent-blue-foreground mt-0.5" />
                <span className="text-[14px]"><span className="hm-typewriter">Let's test that.</span></span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-secondary/40 p-4">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Your next question
              </div>
              <div className="text-[15px] font-medium leading-relaxed text-foreground">{nextQ.text}</div>
              <div className="mt-2 text-[11px] text-muted-foreground">{nextQ.reason}</div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              The interview adapted because of your answer.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-end gap-3">
        {isComplete ? (
          <Button size="lg" className="h-12 px-7 gap-2" onClick={() => setView("readiness")}>
            See your readiness <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" className="h-12 px-7 gap-2" onClick={() => setView("interview")}>
            Continue interview <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <CompetencyBar
        label=""
        value={value}
        status={value >= 0.7 ? "matched" : value >= 0.4 ? "weak" : "gap"}
      />
    </div>
  );
}
