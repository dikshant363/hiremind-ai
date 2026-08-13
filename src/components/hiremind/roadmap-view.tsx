"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Repeat, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import type { RoadmapStep } from "@/lib/types";

const PHASE_META: Record<RoadmapStep["phase"], { label: string; tone: string }> = {
  TODAY: { label: "Today", tone: "var(--accent-blue)" },
  NEXT: { label: "Next", tone: "var(--success)" },
  THEN: { label: "Then", tone: "var(--warning)" },
  REASSESS: { label: "Reassess", tone: "var(--chart-5)" },
};

export function RoadmapView() {
  const { roadmap, readiness, reset, setView } = useHireMind();
  if (!roadmap) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Improvement Roadmap</div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Your improvement path.</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Every step is generated directly from your detected gaps and interview weaknesses. No generic filler.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="hm-card mt-6 sm:mt-8 p-4 sm:p-6"
      >
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Your current gap</div>
        <div className="text-2xl font-semibold tracking-tight">{roadmap.currentGap}</div>
      </motion.div>

      {/* Timeline */}
      <div className="mt-6 relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border hm-timeline-draw hidden sm:block" />
        <div className="space-y-4">
          {roadmap.steps.map((step, i) => {
            const meta = PHASE_META[step.phase];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12, rotate: -1.5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative pl-12"
              >
                <span
                  className="absolute left-0 top-1 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card"
                  style={{ borderColor: meta.tone }}
                >
                  <Calendar className="h-4 w-4" style={{ color: meta.tone }} />
                </span>
                <div className="hm-card p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: `color-mix(in oklch, ${meta.tone} 12%, transparent)`, color: meta.tone }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{step.competency}</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">{step.focus}</div>
                  <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.reason}</div>
                  {step.practice.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {step.practice.map((p, j) => (
                        <li key={j} className="text-[12px] text-muted-foreground flex gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60 hm-check-pop" style={{ animationDelay: `${0.5 + i * 0.1 + j * 0.06}s` }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Close the loop */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="hm-card mt-6 sm:mt-8 p-5 sm:p-8 text-center"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue-foreground mx-auto">
          <Repeat className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-sm font-semibold">Close the loop.</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Practice, then re-run the adaptive interview. Your roadmap should be re-driven by new evidence — not a static to-do list.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => setView("interview")} className="gap-2">
            Retake the interview <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={reset} className="gap-2">Start a new analysis</Button>
        </div>
        {readiness && (
          <div className="mt-5 text-[11px] text-muted-foreground">
            Current readiness: <span className="font-semibold text-foreground">{readiness.index}/100</span> · {readiness.band}
          </div>
        )}
      </motion.div>
    </div>
  );
}
