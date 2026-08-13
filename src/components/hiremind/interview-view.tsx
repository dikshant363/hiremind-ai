"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, SkipForward, Wand2, CheckCircle2, MessageSquareQuote, Zap, Flame, Mountain, Gauge, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useHireMind } from "@/lib/store";
import type { InterviewDifficulty } from "@/lib/types";
import { ScoreRing } from "./shell";
import { AnswerCoach } from "./answer-coach";
import { InterviewTimer } from "./interview-timer";
import { cn } from "@/lib/utils";

/** Maps a difficulty level to its tonal color tokens for pills and badges. */
const DIFFICULTY_TONE: Record<InterviewDifficulty, { bg: string; text: string; ring: string }> = {
  easy: { bg: "bg-success/15", text: "text-success-foreground", ring: "ring-success/30" },
  medium: { bg: "bg-accent-blue/15", text: "text-accent-blue-foreground", ring: "ring-accent-blue/30" },
  hard: { bg: "bg-critical/15", text: "text-critical-foreground", ring: "ring-critical/30" },
  auto: { bg: "bg-warning/15", text: "text-warning-foreground", ring: "ring-warning/30" },
};

const DIFFICULTY_OPTIONS: {
  value: InterviewDifficulty;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  {
    value: "easy",
    label: "Warm-up",
    description: "Foundational concepts and definitions. Build confidence first.",
    icon: Zap,
    tone: "var(--success)",
  },
  {
    value: "medium",
    label: "Balanced",
    description: "Real-world scenarios with tradeoffs. The default interview feel.",
    icon: Gauge,
    tone: "var(--accent-blue)",
  },
  {
    value: "hard",
    label: "Deep dive",
    description: "Multi-step system design and edge cases. Push your limits.",
    icon: Mountain,
    tone: "var(--critical)",
  },
  {
    value: "auto",
    label: "Adaptive",
    description: "Let HireMind pick based on your gap priority and resume strength.",
    icon: Flame,
    tone: "var(--warning)",
  },
];

export function InterviewView() {
  const { interview, startInterview, submitAnswer, loading, loadingStep, setView, isDemo } = useHireMind();
  const [answer, setAnswer] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<InterviewDifficulty>("auto");
  const [showDifficultySelect, setShowDifficultySelect] = React.useState(false);

  if (!interview) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue-foreground">
            <Sparkles className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">Your adaptive interview awaits.</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            The interview targets your highest-impact skill gap and adapts based on your answers. Pick a difficulty to begin.
          </p>

          {/* Difficulty selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-7 grid sm:grid-cols-2 gap-2.5 text-left"
          >
            {DIFFICULTY_OPTIONS.map((opt, i) => {
              const isActive = difficulty === opt.value;
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    "group relative rounded-xl border p-3.5 text-left transition-all duration-200",
                    isActive
                      ? "border-transparent bg-secondary/60 shadow-sm"
                      : "border-border/60 bg-card/40 hover:border-border hover:bg-secondary/40 hover:shadow-[0_0_0_3px_color-mix(in_oklch,var(--hm-tone)_18%,transparent),0_8px_24px_-8px_color-mix(in_oklch,var(--hm-tone)_22%,transparent)]"
                  )}
                  style={
                    isActive
                      ? { boxShadow: `0 0 0 2px color-mix(in oklch, ${opt.tone} 50%, transparent), 0 4px 12px -4px color-mix(in oklch, ${opt.tone} 30%, transparent)` }
                      : ({ "--hm-tone": opt.tone } as React.CSSProperties)
                  }
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `color-mix(in oklch, ${opt.tone} 12%, transparent)`,
                        color: opt.tone,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-semibold">{opt.label}</h4>
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                            style={{ background: opt.tone, color: "white" }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </motion.span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{opt.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7"
          >
            <Button
              size="lg"
              className="h-11 sm:h-12 px-6 sm:px-7 gap-2"
              onClick={() => startInterview({ difficulty })}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 hm-thinking" />
                  {loadingStep || "Starting interview…"}
                </>
              ) : (
                <>
                  Begin {difficulty === "auto" ? "adaptive " : ""}interview →
                </>
              )}
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            Or go to <button className="text-accent-blue-foreground underline underline-offset-2" onClick={() => setView("gaps")}>Skill Gaps</button> to review your gaps first.
          </p>
        </motion.div>
      </div>
    );
  }

  const current = interview.questions[interview.currentIndex];
  const isComplete = interview.status === "complete";

  if (isComplete) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-14 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success-foreground">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl sm:text-4xl font-semibold tracking-tight">Interview complete.</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            We gathered fresh evidence across {interview.evaluations.length} question{interview.evaluations.length === 1 ? "" : "s"}. Let's see where you stand now.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 text-[12px] text-muted-foreground">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Weaknesses identified: {interview.identifiedWeaknesses.join(", ") || "none — strong performance"}
          </div>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="h-12 px-7 gap-2" onClick={() => setView("readiness")}>
              See your readiness →
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 gap-2"
              onClick={() => startInterview()}
              disabled={loading}
            >
              {loading ? <Sparkles className="h-4 w-4 hm-thinking" /> : <RotateCcw className="h-4 w-4" />}
              Retake the interview
            </Button>
          </div>

          {/* Retake with different difficulty */}
          <div className="mt-4">
            <button
              onClick={() => setShowDifficultySelect((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showDifficultySelect ? "rotate-180" : ""}`} />
              Retake with different difficulty
            </button>
            <AnimatePresence>
              {showDifficultySelect && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid sm:grid-cols-2 gap-2.5 text-left max-w-md mx-auto">
                    {DIFFICULTY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            startInterview({ difficulty: opt.value });
                            setShowDifficultySelect(false);
                          }}
                          disabled={loading}
                          className="group rounded-xl border border-border/60 bg-card/40 p-3 text-left hover:border-border hover:bg-secondary/40 transition-all duration-200 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              style={{
                                background: `color-mix(in oklch, ${opt.tone} 12%, transparent)`,
                                color: opt.tone,
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <div className="text-[12px] font-semibold">{opt.label}</div>
                              <div className="text-[10px] text-muted-foreground leading-relaxed">{opt.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-14 text-center">
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

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const progress = ((interview.currentIndex) / interview.totalQuestions) * 100;

  return (
    <div className="hm-ambient min-h-[80vh]">
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-8 sm:py-14">
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
              {interview.difficultyPreference && interview.difficultyPreference !== "auto" && (
                <span className="rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider capitalize">
                  {interview.difficultyPreference}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <InterviewTimer />
              <span className="tabular-nums">
                Question {interview.currentIndex + 1} of {interview.totalQuestions}
              </span>
            </div>
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
            className="hm-card hm-card-hover mt-6 sm:mt-8 p-6 sm:p-10"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-blue-foreground uppercase tracking-wider">
              <span>{current.competency}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  DIFFICULTY_TONE[current.difficulty].bg,
                  DIFFICULTY_TONE[current.difficulty].text
                )}
              >
                {current.difficulty}
              </span>
              <span className="ml-1 inline-flex hm-typing-indicator">
                <span /><span /><span />
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight leading-snug text-balance">
              {current.text}
            </h1>

            {/* Why we're asking */}
            <div className="mt-5 hm-insight-callout p-4">
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

            {/* Answer + Coach — side-by-side on lg */}
            <div className="mt-6 grid gap-4 lg:grid-cols-5">
              {/* Answer column */}
              <div className="lg:col-span-3">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      if (!loading && answer.trim().length >= 5) {
                        onSubmit();
                      }
                    }
                  }}
                  placeholder="Write your answer here. Take your time — depth matters more than length."
                  className="min-h-[180px] sm:min-h-[220px] resize-none text-sm leading-relaxed bg-transparent border-border/60 hm-focus-ring transition-all duration-200"
                  disabled={loading}
                />
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>Tip: explain tradeoffs, not just keywords</span>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:items-center">
                  <Button
                    onClick={onSubmit}
                    size="lg"
                    disabled={loading || answer.trim().length < 5}
                    className="h-11 sm:h-12 px-5 sm:px-5 gap-2"
                  >
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
                  {wordCount > 5 && !loading && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                    >
                      <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-sans text-[9px] leading-none text-muted-foreground/90">⌘</kbd>
                      <span className="text-muted-foreground/60">+</span>
                      <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-sans text-[9px] leading-none text-muted-foreground/90">Enter</kbd>
                    </motion.span>
                  )}
                  {isDemo && (
                    <Button
                      onClick={onDemoAnswer}
                      variant="outline"
                      size="lg"
                      disabled={loading}
                      className="h-11 sm:h-12 px-4 sm:px-4 gap-2"
                      title="Press D to use the scripted demo answer"
                    >
                      <Wand2 className="h-4 w-4" />
                      Scripted answer
                      <kbd className="hidden sm:inline-flex items-center justify-center rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[9px] font-mono font-semibold leading-none text-muted-foreground/90">D</kbd>
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
                    className="h-11 sm:h-12 px-4 sm:px-4 text-muted-foreground gap-2"
                  >
                    <SkipForward className="h-4 w-4" /> Skip
                  </Button>
                </div>
              </div>

              {/* Coach column */}
              <div className="lg:col-span-2">
                <AnswerCoach answer={answer} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Past questions summary */}
        {interview.evaluations.length > 0 && (
          <div className="mt-6">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Previous answers</div>
            <div className="space-y-2">
              {interview.evaluations.map((ev, i) => (
                <motion.div
                  key={ev.questionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="hm-elevated rounded-xl p-4"
                >
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
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
