"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { useHireMind } from "@/lib/store";

/* ============================================================================
 * Interview Timer — premium elapsed-time display for the adaptive interview.
 *
 * Tracks two counters:
 *   • questionTime — seconds since the current question appeared (resets on
 *     question index change)
 *   • totalTime — cumulative seconds for the entire interview session
 *
 * Both counters pause when the interview status is "evaluating" (i.e. the
 * answer is being scored). This keeps timing honest — only "thinking + typing"
 * time counts.
 *
 * Exports:
 *   - useInterviewTimer hook (returns InterviewTimerState)
 *   - InterviewTimer component (compact, renders the two MM:SS displays)
 * ==========================================================================*/

export interface InterviewTimerState {
  /** Seconds elapsed for the current question. */
  questionTime: number;
  /** Total seconds elapsed in the interview. */
  totalTime: number;
  /** Per-question time formatted as "MM:SS". */
  formattedQuestion: string;
  /** Total interview time formatted as "MM:SS". */
  formattedTotal: string;
}

/** Pad a number to 2 digits. */
function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, "0");
}

/** Convert raw seconds to "MM:SS". */
function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

export function useInterviewTimer(): InterviewTimerState {
  const { interview, loading } = useHireMind();

  const currentIndex = interview?.currentIndex ?? 0;
  const interviewStatus = interview?.status ?? "idle";
  const isActive = interviewStatus === "asking" && !loading;

  const [questionTime, setQuestionTime] = React.useState(0);
  const [totalTime, setTotalTime] = React.useState(0);

  // Track the previous question index so we can reset questionTime on change.
  const prevIndexRef = React.useRef(currentIndex);

  // Reset question timer when the question index changes.
  React.useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      setQuestionTime(0);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  // Tick every second while the interview is active.
  React.useEffect(() => {
    if (!isActive) return;

    const id = setInterval(() => {
      setQuestionTime((t) => t + 1);
      setTotalTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isActive]);

  // Reset everything when a new interview starts (status goes from idle → asking).
  const prevStatusRef = React.useRef(interviewStatus);
  React.useEffect(() => {
    if (
      interviewStatus === "asking" &&
      prevStatusRef.current === "idle"
    ) {
      setQuestionTime(0);
      setTotalTime(0);
    }
    prevStatusRef.current = interviewStatus;
  }, [interviewStatus]);

  return {
    questionTime,
    totalTime,
    formattedQuestion: formatMMSS(questionTime),
    formattedTotal: formatMMSS(totalTime),
  };
}

/* ---------------------------------------------------------------------------
 * InterviewTimer component — compact dual-display that sits in the question
 * card header area. Shows per-question time on the left, total on the right,
 * separated by a subtle dot.
 *
 * Usage:
 *   <InterviewTimer />
 *
 * Reads state from the store internally via useInterviewTimer.
 * ------------------------------------------------------------------------- */

export function InterviewTimer() {
  const { formattedQuestion, formattedTotal, questionTime, totalTime } =
    useInterviewTimer();

  const { interview, loading } = useHireMind();
  const interviewStatus = interview?.status ?? "idle";

  // Don't render anything if the interview hasn't started.
  if (interviewStatus === "idle" || !interview) {
    return null;
  }

  // Subtle pulse when timer is actively ticking.
  const isTicking = interviewStatus === "asking" && !loading;

  return (
    <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums select-none">
      <Clock
        className={`h-3.5 w-3.5 ${isTicking ? "text-accent-blue-foreground/70" : ""}`}
      />
      <span className="flex items-center gap-1.5">
        <span className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
            Q
          </span>
          <span
            className={`font-mono ${questionTime > 0 ? "text-foreground/80" : "text-muted-foreground"}`}
          >
            {formattedQuestion}
          </span>
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
            Total
          </span>
          <span
            className={`font-mono ${totalTime > 0 ? "text-foreground/80" : "text-muted-foreground"}`}
          >
            {formattedTotal}
          </span>
        </span>
      </span>
    </div>
  );
}
