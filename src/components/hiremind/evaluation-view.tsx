"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TrendingDown, Lightbulb, CheckCircle2, AlertTriangle, Sparkles, MessageSquareQuote, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import { CompetencyBar, AnimatedCounter, ScoreRing } from "./shell";
import { InterviewInsights } from "./interview-insights";
import { InterviewInsightsPanel } from "./interview-insights-panel";
import { useInterviewTimer } from "./interview-timer";
import type { AnswerEvaluation } from "@/lib/types";

export function EvaluationView() {
  const { lastEvaluation, interview, setView, isDemo, startInterview, loading } = useHireMind();
  const { formattedQuestion, formattedTotal, questionTime, totalTime } = useInterviewTimer();

  const effectiveEvaluation =
    lastEvaluation ||
    (interview?.evaluations?.length
      ? interview.evaluations[interview.evaluations.length - 1]
      : null);

  // Empty state — only when there is truly no interview or no evaluations at all
  if (!effectiveEvaluation || !interview) {
    const isComplete = interview?.status === "complete";
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 sm:py-14 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue-foreground">
            <MessageSquareQuote className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight">
            {isComplete ? "Your interview is complete." : "Pick up where you left off."}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            {isComplete
              ? "Head to your readiness report to see the full picture, or retake the interview to practice more."
              : "Continue your adaptive interview — each question adapts based on your previous answer."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            {isComplete ? (
              <>
                <Button size="lg" className="h-12 px-7 gap-2" onClick={() => setView("readiness")}>
                  See your readiness <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-6 gap-2" onClick={() => startInterview()} disabled={loading}>
                  {loading ? <Sparkles className="h-4 w-4 hm-thinking" /> : <RotateCcw className="h-4 w-4" />}
                  Retake interview
                </Button>
              </>
            ) : (
              <Button size="lg" className="h-12 px-7 gap-2" onClick={() => setView("interview")}>
                Continue interview <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="lg" className="h-12 px-7" onClick={() => setView("candidate")}>
              Back to candidate
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const ev: AnswerEvaluation = effectiveEvaluation;
  const isComplete = interview.status === "complete";
  const nextQ = interview.questions[interview.currentIndex];
  const overallPct = Math.round(ev.overall * 100);
  const tone: "neutral" | "success" | "warning" | "critical" =
    overallPct >= 70 ? "success" : overallPct >= 50 ? "warning" : "critical";
  const showConfetti = overallPct >= 75;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Answer Evaluation</div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Here's what we learned.</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          We evaluated your answer along four dimensions. The overall score is computed by application logic — never raw model output.
        </p>
      </motion.div>

      {/* Dimensions + Overall Score Ring */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="hm-card hm-card-hover mt-6 sm:mt-8 p-5 sm:p-8 relative"
      >
        <div className="grid sm:grid-cols-[1fr_auto] gap-6 sm:gap-8 items-center">
          {/* Dimensions */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <DimensionBar label="Technical Accuracy" value={ev.technicalAccuracy} delay={0.15} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
              <DimensionBar label="Relevance" value={ev.relevance} delay={0.22} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.26 }}>
              <DimensionBar label="Depth" value={ev.depth} delay={0.29} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.34 }}>
              <DimensionBar label="Communication" value={ev.communication} delay={0.36} />
            </motion.div>
          </div>

          {/* Overall Score Ring */}
          <div className="flex flex-col items-center justify-center sm:justify-self-center relative">
            <ConfettiBurst trigger={showConfetti} />
            <ScoreRing
              value={overallPct}
              size={148}
              label="Overall"
              caption="Weighted aggregate"
              tone={tone}
              delay={300}
            />
            {/* Time taken badge — subtle contextual metric beneath the ring */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
              <Clock className="h-3 w-3 text-muted-foreground/60" />
              <span>Time: {formattedQuestion}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>Total: {formattedTotal}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strengths & weaknesses */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hm-card hm-card-hover p-4 sm:p-6"
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
                <li key={`str-${i}-${s.slice(0, 10)}`} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
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
          className="hm-card hm-card-hover p-4 sm:p-6"
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
                <li key={`weak-${i}-${s.slice(0, 10)}`} className="text-[13px] text-muted-foreground leading-relaxed flex gap-2">
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

      {/* INTERVIEW INSIGHTS — premium post-answer visual breakdown */}
      <InterviewInsights />

      {/* INTERVIEW INSIGHTS PANEL — comprehensive post-interview analytics (only when complete) */}
      {isComplete && <InterviewInsightsPanel />}

      {/* THE WOW MOMENT — what happens next */}
      <AnimatePresence>
        {!isComplete && ev.detectedGap && nextQ && (
          <motion.div
            key="wow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hm-card hm-insight-callout mt-5 sm:mt-6 p-6 sm:p-10 relative overflow-hidden hm-radial-glow"
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
      <div className="mt-8 flex items-center justify-end gap-3 flex-wrap">
        {isComplete && (
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-6 gap-2"
            onClick={() => startInterview()}
            disabled={loading}
          >
            {loading ? (
              <Sparkles className="h-4 w-4 hm-thinking" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Retake interview
          </Button>
        )}
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

/** Subtle particle burst — Apple-like. 10 small dots that radiate outward from
 *  the score ring center and fade out. Only renders when trigger=true. */
function ConfettiBurst({ trigger }: { trigger: boolean }) {
  // Pre-compute random directions on mount so they don't change between renders.
  const particles = React.useMemo(() => {
    if (!trigger) return [];
    const count = 10;
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (((i * 7) % 5) - 2) * 0.08;
      const distance = 70 + ((i * 13) % 7) * 5;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 4 + ((i * 3) % 4),
        delay: ((i * 5) % 6) * 0.02,
        color: i % 2 === 0 ? "var(--accent-blue)" : "var(--success)",
      };
    });
  }, [trigger]);

  if (!trigger) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0, 1, 0.4],
          }}
          transition={{
            duration: 1.0,
            delay: 0.4 + p.delay,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.25, 1],
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "9999px",
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

function DimensionBar({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums">
          <AnimatedCounter value={pct} delay={delay} duration={800} />
          <span className="text-muted-foreground">%</span>
        </span>
      </div>
      <CompetencyBar
        label=""
        value={value}
        status={value >= 0.7 ? "matched" : value >= 0.4 ? "weak" : "gap"}
      />
    </div>
  );
}
