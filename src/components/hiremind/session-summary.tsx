"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, GitBranch, ArrowRight } from "lucide-react";
import { useHireMind } from "@/lib/store";
import type { AnswerEvaluation, InterviewQuestion } from "@/lib/types";

function MiniBar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 0.7 ? "var(--success)" : value >= 0.4 ? "var(--warning)" : "var(--critical)";
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(4, value * 100)}%`, background: color }}
        />
      </div>
      <span className="tabular-nums font-medium w-7 text-right" style={{ color }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

function TimelineItem({
  index,
  question,
  answer,
  evaluation,
  nextReason,
}: {
  index: number;
  question: InterviewQuestion;
  answer: string;
  evaluation: AnswerEvaluation;
  nextReason?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative pl-8 pb-5"
    >
      {/* Timeline dot + line */}
      <div className="absolute left-0 top-1.5 flex flex-col items-center">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-[10px] font-semibold tabular-nums text-muted-foreground">
          {index + 1}
        </span>
        <div className="w-px flex-1 bg-border/60 mt-1 min-h-[20px]" />
      </div>

      <div className="rounded-lg border border-border/60 bg-card/40 p-3">
        {/* Question */}
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-accent-blue/10 text-accent-blue-foreground px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
            {question.competency}
          </span>
          <span className="text-[9px] text-muted-foreground capitalize">{question.difficulty}</span>
        </div>
        <p className="text-[12px] text-foreground font-medium leading-snug">
          {question.text.length > 120 ? question.text.slice(0, 120) + "…" : question.text}
        </p>

        {/* Answer */}
        <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed bg-secondary/40 rounded-md p-2">
          {answer.length > 150 ? answer.slice(0, 150) + "…" : answer}
        </div>

        {/* Evaluation mini bars */}
        <div className="mt-2 space-y-1">
          <MiniBar value={evaluation.technicalAccuracy} label="Technical" />
          <MiniBar value={evaluation.relevance} label="Relevance" />
          <MiniBar value={evaluation.depth} label="Depth" />
          <MiniBar value={evaluation.communication} label="Communication" />
        </div>

        {/* Adaptive reason */}
        {nextReason && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-accent-blue-foreground">
            <GitBranch className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="italic">{nextReason}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const LEVEL_ORDER: Record<string, number> = {
  unknown: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
};

function BeforeAfterTable() {
  const { interview } = useHireMind();
  if (!interview) return null;

  const changed = interview.competencyStates.filter(
    (c) => c.resumeLevel !== c.interviewLevel && c.interviewLevel !== "unknown"
  );

  if (changed.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Before → After competency state
      </h4>
      <div className="space-y-1.5">
        {changed.map((c) => {
          const wentUp = (LEVEL_ORDER[c.interviewLevel] ?? 0) > (LEVEL_ORDER[c.resumeLevel] ?? 0);
          const wentDown = (LEVEL_ORDER[c.interviewLevel] ?? 0) < (LEVEL_ORDER[c.resumeLevel] ?? 0);
          return (
            <div key={c.competency} className="flex items-center gap-2 text-[12px]">
              <span className="font-medium w-36 truncate">{c.competency}</span>
              <span className="text-muted-foreground capitalize">{c.resumeLevel}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span
                className={cn(
                  "capitalize font-medium",
                  wentUp && "text-success-foreground",
                  wentDown && "text-critical-foreground"
                )}
              >
                {c.interviewLevel}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                  wentUp && "bg-success/15 text-success-foreground",
                  wentDown && "bg-critical/15 text-critical-foreground"
                )}
              >
                {wentUp ? "↑" : "↓"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cn(...inputs: (string | false | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function SessionSummary() {
  const { interview } = useHireMind();
  const [open, setOpen] = React.useState(false);

  if (!interview || interview.evaluations.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-accent-blue-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Hide session summary" : "View session summary"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="hm-card p-5 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Clock className="h-3 w-3" />
                </span>
                <h3 className="text-[13px] font-semibold">
                  Interview session — {interview.evaluations.length} questions answered
                </h3>
              </div>

              {/* Timeline */}
              <div>
                {interview.evaluations.map((ev, i) => {
                  const question = interview.questions.find((q) => q.id === ev.questionId);
                  const answer = interview.answers.find((a) => a.questionId === ev.questionId);
                  const nextQuestion = interview.questions[i + 1];
                  if (!question || !answer) return null;

                  return (
                    <TimelineItem
                      key={ev.questionId}
                      index={i}
                      question={question}
                      answer={answer.text}
                      evaluation={ev}
                      nextReason={nextQuestion?.reason}
                    />
                  );
                })}
              </div>

              {/* Before/After comparison */}
              <BeforeAfterTable />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
