"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  Target,
  ListChecks,
  MessageSquare,
  Gauge,
  Map,
  Check,
} from "lucide-react";
import { useHireMind, type View } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Stage {
  id: View;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Returns true if this stage's data is present in the store. */
  isDone: (s: StageState) => boolean;
}

interface StageState {
  hasCandidate: boolean;
  hasMatch: boolean;
  hasGaps: boolean;
  hasInterview: boolean;
  hasReadiness: boolean;
  hasRoadmap: boolean;
}

const STAGES: Stage[] = [
  { id: "candidate", label: "Candidate", shortLabel: "Candidate", icon: FileText, isDone: (s) => s.hasCandidate },
  { id: "match", label: "Job Match", shortLabel: "Match", icon: Target, isDone: (s) => s.hasMatch },
  { id: "gaps", label: "Skill Gaps", shortLabel: "Gaps", icon: ListChecks, isDone: (s) => s.hasGaps },
  { id: "interview", label: "Interview", shortLabel: "Interview", icon: MessageSquare, isDone: (s) => s.hasInterview },
  { id: "readiness", label: "Readiness", shortLabel: "Readiness", icon: Gauge, isDone: (s) => s.hasReadiness },
  { id: "roadmap", label: "Roadmap", shortLabel: "Roadmap", icon: Map, isDone: (s) => s.hasRoadmap },
];

/**
 * Pipeline Progress Indicator — visual representation of the candidate's
 * journey through the HireMind intelligence loop.
 *
 * Shows up to 6 stages with completed/done styling. Clicking a completed
 * stage navigates to that view. Lives on the Home view (only shown after
 * the first analysis is run, so the user sees their progress).
 */
export function PipelineProgress() {
  const {
    sessionId,
    candidate,
    match,
    gaps,
    interview,
    readiness,
    roadmap,
    view,
    setView,
    reset,
  } = useHireMind();

  // Don't render until there's at least one stage complete.
  if (!sessionId || !candidate) return null;

  const state: StageState = {
    hasCandidate: !!candidate,
    hasMatch: !!match,
    hasGaps: !!gaps,
    hasInterview: !!interview,
    hasReadiness: !!readiness,
    hasRoadmap: !!roadmap,
  };

  const completedCount = STAGES.filter((s) => s.isDone(state)).length;
  const progress = (completedCount / STAGES.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-10 sm:mt-12"
    >
      <div className="hm-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Your readiness pipeline</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedCount} of {STAGES.length} stages complete · click any stage to jump back
            </p>
          </div>
          <button
            onClick={reset}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Start over
          </button>
        </div>

        {/* Stage row */}
        <div className="relative">
          {/* Progress track (background) */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted rounded-full overflow-hidden hidden sm:block">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-gradient-to-r from-accent-blue to-success rounded-full"
            />
          </div>

          {/* Stage nodes */}
          <div className="relative grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-2">
            {STAGES.map((stage, i) => {
              const done = stage.isDone(state);
              const isActive = view === stage.id;
              const Icon = stage.icon;
              return (
                <motion.button
                  key={stage.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                  whileHover={done ? { scale: 1.05, y: -2 } : undefined}
                  whileTap={done ? { scale: 0.97 } : undefined}
                  disabled={!done}
                  onClick={() => done && setView(stage.id)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                    done ? "cursor-pointer hover:bg-secondary/50" : "cursor-default opacity-50",
                    isActive && "bg-secondary/60"
                  )}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                      done
                        ? "border-transparent bg-gradient-to-br from-accent-blue to-success text-white shadow-sm"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.4 + i * 0.06 }}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </motion.span>
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {isActive && done && (
                      <motion.span
                        layoutId="pipeline-active"
                        className="absolute -inset-1 rounded-full ring-2 ring-accent-blue/40"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight text-center",
                      done ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {stage.shortLabel}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Bottom hint */}
        {completedCount < STAGES.length && (
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span>
              {completedCount === 1 && "Resume analyzed — see your candidate profile or jump to your job match."}
              {completedCount === 2 && "Match computed — review your gaps next."}
              {completedCount === 3 && "Gaps identified — start the adaptive interview."}
              {completedCount === 4 && "Interview done — calculate your readiness index."}
              {completedCount === 5 && "Readiness computed — open your personalized roadmap."}
            </span>
          </div>
        )}
        {completedCount === STAGES.length && (
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-[11px] text-success-foreground">
            <Check className="h-3 w-3 shrink-0" />
            <span>Pipeline complete — your full readiness picture is ready.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
