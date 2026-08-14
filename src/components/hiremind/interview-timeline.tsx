"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ArrowRight,
  Clock,
  Target,
  ChevronDown,
  GitBranch,
  ListChecks,
  TrendingUp,
  Layers,
} from "lucide-react";
import { useHireMind } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  AnswerEvaluation,
  InterviewQuestion,
  InterviewState,
} from "@/lib/types";

/* ============================================================================
 * InterviewTimeline — premium vertical timeline of the adaptive interview.
 *
 * Renders a storytelling view of every Q&A pair from the interview:
 *   • Header ("Interview journey" / "How your interview adapted")
 *   • Stats summary (4 tiles: questions, avg score, total time, competencies)
 *   • Vertical timeline with one entry per evaluation
 *
 * Each entry shows: question number badge, question text, competency badge,
 * difficulty badge, expandable answer, evaluation score, detected gap (with
 * an "adapted to →" pill connecting it to the next question).
 *
 * Per-question elapsed time is derived from `interview.history` timestamps
 * (interview_start + evaluation_applied entries) — best-effort, since the
 * interview state itself doesn't persist per-question wall-clock time.
 * ==========================================================================*/

const DIFFICULTY_TONE: Record<string, { bg: string; text: string }> = {
  easy: { bg: "bg-success/15", text: "text-success-foreground" },
  medium: { bg: "bg-accent-blue/15", text: "text-accent-blue-foreground" },
  hard: { bg: "bg-critical/15", text: "text-critical-foreground" },
};

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Pad a number to 2 digits (used for MM:SS formatting). */
function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

/** Convert raw seconds to "MM:SS" (or "M:SS:SS" → capped at 99 minutes). */
function formatMMSS(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const capped = Math.min(seconds, 99 * 60 + 59);
  const m = Math.floor(capped / 60);
  const s = capped % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

/** Score-based color tokens for the overall % badge. */
function scoreTone(pct: number): {
  bg: string;
  text: string;
  ring: string;
} {
  if (pct >= 70) {
    return {
      bg: "bg-success/15",
      text: "text-success-foreground",
      ring: "ring-success/30",
    };
  }
  if (pct >= 50) {
    return {
      bg: "bg-warning/15",
      text: "text-warning-foreground",
      ring: "ring-warning/30",
    };
  }
  return {
    bg: "bg-critical/15",
    text: "text-critical-foreground",
    ring: "ring-critical/30",
  };
}

/** Derive per-question elapsed seconds from interview history timestamps.
 *  Returns an array aligned with `evaluations` (one elapsed value per Q). */
function derivePerQuestionSeconds(
  interview: InterviewState
): number[] {
  type Ev = { at: number };
  const evalTs: Ev[] = interview.history
    .filter((h) => h.step === "evaluation_applied")
    .map((h) => ({ at: new Date(h.at).getTime() }));

  const startTs = interview.history.find((h) => h.step === "interview_start");
  const startAt = startTs ? new Date(startTs.at).getTime() : (evalTs[0]?.at ?? 0);

  const result: number[] = [];
  let prevAt = startAt;
  for (const ev of evalTs) {
    const delta = Math.max(0, Math.round((ev.at - prevAt) / 1000));
    result.push(delta);
    prevAt = ev.at;
  }
  return result;
}

/* ---------------------------------------------------------------------------
 * Timeline entry row — one Q&A pair
 * ------------------------------------------------------------------------- */

interface TimelineEntry {
  index: number; // 0-based evaluation index
  question: InterviewQuestion;
  answer: string | null;
  evaluation: AnswerEvaluation;
  elapsedSeconds: number | null;
  /** Competency the next question adapted to (driven by detectedGap). */
  adaptsTo: string | null;
}

function buildEntries(interview: InterviewState): TimelineEntry[] {
  const perQ = derivePerQuestionSeconds(interview);
  const entries: TimelineEntry[] = [];

  for (let i = 0; i < interview.evaluations.length; i++) {
    const ev = interview.evaluations[i];
    const question =
      interview.questions.find((q) => q.id === ev.questionId) ?? null;
    if (!question) continue;
    const ans = interview.answers.find((a) => a.questionId === ev.questionId);
    // adaptsTo = this evaluation's detectedGap, if any (that's what the
    // NEXT question was chosen to target).
    const adaptsTo = ev.detectedGap ?? null;
    entries.push({
      index: i,
      question,
      answer: ans?.text ?? null,
      evaluation: ev,
      elapsedSeconds: perQ[i] ?? null,
      adaptsTo,
    });
  }
  return entries;
}

/* ---------------------------------------------------------------------------
 * StatsSummary — 4 small tiles
 * ------------------------------------------------------------------------- */

function StatsSummary({
  totalQuestions,
  avgScore,
  totalSeconds,
  competenciesCovered,
}: {
  totalQuestions: number;
  avgScore: number; // 0..100
  totalSeconds: number | null;
  competenciesCovered: number;
}) {
  const tiles = [
    {
      icon: ListChecks,
      label: "Questions",
      value: String(totalQuestions),
      sub: "answered",
      tone: "text-accent-blue-foreground",
      bg: "bg-accent-blue/10",
    },
    {
      icon: TrendingUp,
      label: "Avg score",
      value: `${Math.round(avgScore)}%`,
      sub: avgScore >= 70 ? "strong" : avgScore >= 50 ? "developing" : "needs work",
      tone:
        avgScore >= 70
          ? "text-success-foreground"
          : avgScore >= 50
          ? "text-warning-foreground"
          : "text-critical-foreground",
      bg:
        avgScore >= 70
          ? "bg-success/10"
          : avgScore >= 50
          ? "bg-warning/10"
          : "bg-critical/10",
    },
    {
      icon: Clock,
      label: "Total time",
      value: totalSeconds != null ? formatMMSS(totalSeconds) : "—",
      sub: totalSeconds != null ? "elapsed" : "n/a",
      tone: "text-foreground/80",
      bg: "bg-secondary",
    },
    {
      icon: Layers,
      label: "Competencies",
      value: String(competenciesCovered),
      sub: "covered",
      tone: "text-accent-blue-foreground",
      bg: "bg-accent-blue/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {tiles.map((t, i) => {
        const Icon = t.icon;
        return (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="hm-card p-3 flex items-center gap-2.5"
          >
            <span
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                t.bg,
                t.tone
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-none">
                {t.label}
              </div>
              <div className="mt-1 text-[15px] font-semibold tabular-nums leading-none">
                {t.value}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground/80 leading-none">
                {t.sub}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * NumberBadge — circular Q1, Q2, ... badge centered on the timeline line.
 * ------------------------------------------------------------------------- */

function NumberBadge({
  index,
  pct,
  isLast,
}: {
  index: number;
  pct: number;
  isLast: boolean;
}) {
  // Color the ring by score tone so the line itself tells the story.
  const tone =
    pct >= 70
      ? "border-success text-success-foreground"
      : pct >= 50
      ? "border-warning text-warning-foreground"
      : "border-critical text-critical-foreground";

  return (
    <div className="relative z-10 flex items-center justify-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.35,
          delay: 0.1 + index * 0.12,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full bg-card border-2 text-sm font-semibold tabular-nums shadow-sm",
          tone,
          isLast && "ring-2 ring-offset-2 ring-offset-background ring-accent-blue/40"
        )}
      >
        Q{index + 1}
      </motion.span>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * AdaptationIndicator — pill that connects an entry to the next, showing
 * "adapted to → [competency]". Sits between two timeline entries.
 * ------------------------------------------------------------------------- */

function AdaptationIndicator({
  competency,
  index,
}: {
  competency: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.12 + 0.06 }}
      className="relative flex items-center justify-start pl-5"
    >
      {/* small curved-arrow svg hinting the adaptation path */}
      <svg
        width="20"
        height="36"
        viewBox="0 0 20 36"
        className="absolute -left-2 top-0 text-accent-blue/50"
        aria-hidden
      >
        <path
          d="M 10 0 C 10 12, 18 16, 18 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <polygon points="14,28 18,32 22,28" fill="currentColor" />
      </svg>
      <span className="inline-flex items-center gap-1 rounded-full border border-accent-blue/25 bg-accent-blue/8 px-2 py-0.5 text-[10px] font-medium text-accent-blue-foreground">
        <GitBranch className="h-3 w-3" />
        Adapted to
        <ArrowRight className="h-3 w-3" />
        <span className="font-semibold">{competency}</span>
      </span>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * TimelineEntryCard — the right-hand card for one Q&A pair.
 * ------------------------------------------------------------------------- */

function TimelineEntryCard({
  entry,
  isLast,
}: {
  entry: TimelineEntry;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const ev = entry.evaluation;
  const pct = Math.round(ev.overall * 100);
  const tone = scoreTone(pct);
  const diffTone = DIFFICULTY_TONE[entry.question.difficulty] ?? DIFFICULTY_TONE.medium;
  const hasAnswer = !!entry.answer && entry.answer.trim().length > 0;
  const isSkipped = hasAnswer && entry.answer!.trim().toLowerCase().startsWith("i'd like to skip");

  const baseDelay = 0.1 + entry.index * 0.12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: baseDelay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("hm-card hm-card-hover p-4", isLast && "ring-1 ring-accent-blue/20")}
    >
      {/* Header row: badges + score */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/10 text-accent-blue-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            <Target className="h-3 w-3" />
            {entry.question.competency}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider capitalize",
              diffTone.bg,
              diffTone.text
            )}
          >
            {entry.question.difficulty}
          </span>
          {entry.question.mode === "hr" && (
            <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              HR
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entry.elapsedSeconds != null && entry.elapsedSeconds > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
              <Clock className="h-3 w-3" />
              {formatMMSS(entry.elapsedSeconds)}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ring-1",
              tone.bg,
              tone.text,
              tone.ring
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Question text */}
      <div className="mt-2.5 text-[13.5px] font-medium leading-relaxed text-foreground">
        {entry.question.text}
      </div>

      {/* Answer block — expandable */}
      {hasAnswer ? (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            Your answer
            {isSkipped && (
              <span className="ml-1 inline-flex items-center rounded bg-muted px-1 py-0.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground">
                skipped
              </span>
            )}
          </div>
          <div
            className={cn(
              "mt-1.5 text-[12.5px] text-foreground/85 leading-relaxed",
              !expanded && "line-clamp-2"
            )}
          >
            {entry.answer}
          </div>
          {entry.answer!.length > 110 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-accent-blue-foreground hover:underline"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
              {expanded ? "Show less" : "Show full answer"}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 text-[12px] text-muted-foreground italic">
          No answer recorded.
        </div>
      )}

      {/* Evaluation summary — detected gap + first weakness (the human-readable hook) */}
      <div className="mt-3 flex flex-col gap-1.5">
        {ev.detectedGap && (
          <div className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground leading-relaxed">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-accent-blue-foreground" />
            <span>
              Detected gap:{" "}
              <span className="font-semibold text-foreground">{ev.detectedGap}</span>
              {ev.nextFocus && (
                <span className="text-muted-foreground/80"> — {ev.nextFocus}</span>
              )}
            </span>
          </div>
        )}
        {ev.weaknesses[0] && (
          <div className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground leading-relaxed">
            <span className="mt-0.5 inline-block h-1 w-1 shrink-0 rounded-full bg-warning" />
            <span>{ev.weaknesses[0]}</span>
          </div>
        )}
        {ev.strengths[0] && !ev.detectedGap && (
          <div className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground leading-relaxed">
            <span className="mt-0.5 inline-block h-1 w-1 shrink-0 rounded-full bg-success" />
            <span>{ev.strengths[0]}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * Main exported component
 * ------------------------------------------------------------------------- */

export function InterviewTimeline() {
  const { interview } = useHireMind();

  if (!interview || interview.evaluations.length === 0) {
    return null;
  }

  const entries = buildEntries(interview);
  if (entries.length === 0) return null;

  // Stats
  const totalQuestions = entries.length;
  const avgScore =
    entries.reduce((acc, e) => acc + e.evaluation.overall * 100, 0) /
    Math.max(1, totalQuestions);
  const perQ = derivePerQuestionSeconds(interview);
  const totalSeconds = perQ.length > 0 ? perQ.reduce((a, b) => a + b, 0) : null;
  const competenciesCovered = new Set(
    entries.map((e) => e.evaluation.competency)
  ).size;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="hm-card hm-card-hover mt-4 p-4 sm:p-6 overflow-visible"
      aria-label="Interview timeline"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue-foreground">
          <GitBranch className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold leading-tight">Interview journey</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
            How your interview adapted — each question was chosen from the
            previous answer&rsquo;s detected gap.
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <StatsSummary
        totalQuestions={totalQuestions}
        avgScore={avgScore}
        totalSeconds={totalSeconds}
        competenciesCovered={competenciesCovered}
      />

      {/* Timeline */}
      <div className="relative mt-6">
        {/* Vertical gradient line — sits behind the badges.
            Inset on the left so it lines up with the center of the Q badges. */}
        <div
          aria-hidden
          className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent-blue via-accent-blue/60 to-success rounded-full"
        />

        <ol className="space-y-0">
          {entries.map((entry, i) => {
            const isLast = i === entries.length - 1;
            const pct = Math.round(entry.evaluation.overall * 100);
            return (
              <li
                key={entry.evaluation.questionId}
                className="relative grid grid-cols-[2.5rem_1fr] gap-3 pb-5 last:pb-0"
              >
                {/* Left: number badge centered on the line */}
                <div className="flex justify-center pt-1">
                  <NumberBadge
                    index={entry.index}
                    pct={pct}
                    isLast={isLast}
                  />
                </div>

                {/* Right: card + (between-entries) adaptation indicator */}
                <div className="min-w-0 flex flex-col gap-2">
                  <TimelineEntryCard entry={entry} isLast={isLast} />

                  <AnimatePresence>
                    {!isLast && entry.adaptsTo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="overflow-hidden"
                      >
                        <AdaptationIndicator
                          competency={entry.adaptsTo}
                          index={entry.index}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </motion.section>
  );
}
