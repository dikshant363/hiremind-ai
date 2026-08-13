"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, SkipForward, Wand2, CheckCircle2, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useHireMind } from "@/lib/store";
import { ScoreRing } from "./shell";
import { cn } from "@/lib/utils";

export function InterviewView() {
  const { interview, submitAnswer, loading, loadingStep, setView, isDemo } = useHireMind();
  const [answer, setAnswer] = React.useState("");

  if (!interview) return null;

  const current = interview.questions[interview.currentIndex];
  const isComplete = interview.status === "complete";

  if (isComplete) {
    return (
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success-foreground">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">Interview complete.</h1>
          <p className="mt-3 text-[14px] text-muted-foreground max-w-md mx-auto">
            We gathered fresh evidence across {interview.evaluations.length} question{interview.evaluations.length === 1 ? "" : "s"}. Let's see where you stand now.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-[12px] text-muted-foreground">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Weaknesses identified: {interview.identifiedWeaknesses.join(", ") || "none — strong performance"}
          </div>
          <div className="mt-7">
            <Button size="lg" className="h-12 px-7 gap-2" onClick={() => setView("readiness")}>
              See your readiness →
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-14 text-center">
        <p className="text-muted-foreground">No active question.</p>
        <Button className="mt-4" onClick={() => setView("gaps")}>Back to gaps</Button>
      </div>
    );
  }

  const onSubmit = () => {
    if (!answer.trim()) return;
    submitAnswer(current.id, answer);
    setAnswer("");
  };

  const onDemoAnswer = () => {
    submitAnswer(current.id, "", { useDemoAnswer: true });
    setAnswer("");
  };

  const progress = ((interview.currentIndex) / interview.totalQuestions) * 100;

  return (
    <div className="hm-ambient min-h-[80vh]">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
        {/* Top meta */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-blue/10 text-accent-blue-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Adaptive Interview
              </span>
              {isDemo && (
                <span className="rounded-full bg-warning/15 text-warning-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  Demo
                </span>
              )}
            </div>
            <span className="tabular-nums">
              Question {interview.currentIndex + 1} of {interview.totalQuestions}
            </span>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-blue transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Progress step indicator dots */}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {Array.from({ length: interview.totalQuestions }, (_, i) => {
              const isComplete = i < interview.currentIndex;
              const isActive = i === interview.currentIndex;
              return (
                <span
                  key={i}
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full hm-step-dot",
                    isActive && "hm-step-dot-active",
                    isComplete && "hm-step-dot-complete",
                    !isActive && !isComplete && "bg-muted-foreground/25"
                  )}
                />
              );
            })}
          </div>
        </motion.div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="hm-card mt-8 p-8 sm:p-10"
          >
            <div className="text-[11px] font-semibold text-accent-blue-foreground uppercase tracking-wider">
              {current.competency} · {current.difficulty}
              <span className="ml-2 inline-flex hm-typing-indicator">
                <span /><span /><span />
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight leading-snug text-balance">
              {current.text}
            </h1>

            {/* Why we're asking */}
            <div className="mt-5 rounded-xl border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground">
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Why we're asking</div>
                  <div className="mt-0.5 text-[13px] text-foreground leading-relaxed">{current.reason}</div>
                </div>
              </div>
            </div>

            {/* Answer */}
            <div className="mt-6">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer here. Take your time — depth matters more than length."
                className="min-h-[160px] resize-none text-[14px] leading-relaxed bg-transparent border-border/60 hm-focus-ring transition-all duration-200"
                disabled={loading}
              />
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Tip: explain tradeoffs, not just keywords</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Button onClick={onSubmit} size="lg" disabled={loading || answer.trim().length < 5} className="h-12 px-6 gap-2">
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 hm-thinking" />
                    {loadingStep || "Working…"}
                  </>
                ) : (
                  <>
                    Submit answer <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
              {isDemo && (
                <Button onClick={onDemoAnswer} variant="outline" size="lg" disabled={loading} className="h-12 px-5 gap-2">
                  <Wand2 className="h-4 w-4" />
                  Use scripted demo answer
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                disabled={loading}
                onClick={() => {
                  submitAnswer(current.id, "I'd like to skip this one.");
                  setAnswer("");
                }}
                className="h-12 px-5 text-muted-foreground gap-2"
              >
                <SkipForward className="h-4 w-4" /> Skip
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Past questions summary */}
        {interview.evaluations.length > 0 && (
          <div className="mt-6">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Previous answers</div>
            <div className="space-y-2">
              {interview.evaluations.map((ev, i) => (
                <div key={ev.questionId} className="hm-elevated rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-medium">
                      Q{i + 1}. {ev.competency}
                    </div>
                    <div className="text-[12px] tabular-nums text-muted-foreground">
                      {Math.round(ev.overall * 100)}% overall
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {ev.weaknesses[0] ?? "Solid answer."}
                    {ev.detectedGap && (
                      <span className="ml-1 text-critical-foreground">· Drilled into {ev.detectedGap}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
