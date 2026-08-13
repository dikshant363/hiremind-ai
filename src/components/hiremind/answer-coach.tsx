"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  Lightbulb,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useHireMind } from "@/lib/store";
import { getCoachTips, answerReadiness } from "@/lib/coach-tips";
import { cn } from "@/lib/utils";

/**
 * Interactive Answer Coach — a live coaching panel that sits beside the
 * answer textarea on the interview view. Shows:
 *  - Real-time answer readiness score (0..100)
 *  - 5 quality signals (substance, structure, quantified, tradeoff, concrete)
 *  - Competency-specific "what great answers include"
 *  - Structure template
 *  - Common pitfalls
 *
 * Premium Apple-inspired design — collapsible on mobile, docked on desktop.
 */
export function AnswerCoach({ answer }: { answer: string }) {
  const { interview } = useHireMind();
  const [collapsed, setCollapsed] = React.useState(false);

  if (!interview) return null;
  const current = interview.questions[interview.currentIndex];
  if (!current) return null;

  const tips = getCoachTips(current.competency);
  const { score, signals } = answerReadiness(answer);
  const readinessPct = Math.round(score * 100);
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  const readinessTone =
    readinessPct >= 80
      ? "text-success-foreground"
      : readinessPct >= 50
      ? "text-warning-foreground"
      : "text-muted-foreground";

  const readinessBar =
    readinessPct >= 80
      ? "bg-success"
      : readinessPct >= 50
      ? "bg-warning"
      : "bg-muted-foreground/50";

  return (
    <div className="hm-card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          <div className="text-left">
            <div className="text-[13px] font-semibold">Answer Coach</div>
            <div className="text-[10px] text-muted-foreground">
              Live guidance for {current.competency}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Readiness
            </div>
            <div className={cn("text-sm font-semibold tabular-nums", readinessTone)}>
              {readinessPct}%
            </div>
          </div>
          {collapsed ? (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Readiness bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Answer readiness</span>
                  <span className="tabular-nums">{wordCount} words</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", readinessBar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${readinessPct}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* Quality signals */}
              <div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Quality signals
                </div>
                <div className="space-y-1.5">
                  {signals.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      {s.ok ? (
                        <CheckCircle2 className="h-3 w-3 text-success-foreground shrink-0" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={cn(s.ok ? "text-foreground" : "text-muted-foreground")}>
                        {s.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* What great answers include */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3 w-3 text-accent-blue-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    What great answers include
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {tips.greatIncludes.map((g, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.1 + i * 0.04 }}
                      className="flex gap-2 text-[11px] text-foreground/80 leading-relaxed"
                    >
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-accent-blue/60 shrink-0" />
                      <span>{g}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Structure template */}
              <div className="rounded-lg bg-accent-blue/8 border border-accent-blue/15 p-2.5">
                <div className="text-[10px] font-semibold text-accent-blue-foreground uppercase tracking-wider mb-1">
                  Structure
                </div>
                <div className="text-[11px] text-foreground/85 font-medium leading-relaxed">
                  {tips.structure}
                </div>
              </div>

              {/* Pitfalls */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3 w-3 text-warning-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Avoid
                  </span>
                </div>
                <ul className="space-y-1">
                  {tips.avoid.map((a, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[11px] text-muted-foreground leading-relaxed"
                    >
                      <span className="text-warning-foreground/60 shrink-0">·</span>
                      <span className="line-through decoration-warning/30">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Length guidance */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                <Clock className="h-3 w-3" />
                <span>{tips.length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
