"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Target, Sparkles, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import { PriorityPill } from "./shell";

export function GapsView() {
  const { gaps, candidate, job, setView, startInterview, loading, loadingStep } = useHireMind();
  if (!gaps) return null;

  const top = gaps[0];
  const others = gaps.slice(1, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Skill Gaps</div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Your biggest opportunity.</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          We prioritized every gap by job importance, candidate evidence and semantic alignment. The first one is where your time will matter most.
        </p>
      </motion.div>

      {/* Hero gap */}
      {top && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="hm-gradient-border-critical mt-6 sm:mt-8 p-6 sm:p-10 relative overflow-hidden"
        >
          <div
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, var(--accent-blue), transparent 70%)" }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-critical/10 text-critical-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
              <Target className="h-3 w-3" /> Highest-impact gap
            </span>
            <PriorityPill priority={top.priority} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">{top.competency}</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">{top.reason}</p>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[12px]">
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Why it matters</div>
              <div className="text-foreground">
                Marked <span className="font-medium">{top.importance}</span> for {job?.title ?? "this role"}.
              </div>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5">Your evidence</div>
              {top.candidateLevel === "unknown" ? (
                <div
                  className="hm-void-box flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium"
                  title="Add evidence"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add evidence</span>
                </div>
              ) : (
                <div className="text-foreground capitalize">{top.candidateLevel} · {top.status}</div>
              )}
            </div>
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1.5">Priority</div>
              <div className="flex items-center">
                <PriorityPill priority={top.priority} />
              </div>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Next step</div>
              <div className="text-foreground">Test it in the adaptive interview.</div>
            </div>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Button onClick={startInterview} size="lg" className="h-12 px-6 gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 hm-thinking" /> {loadingStep || "Working…"}
                  </>
                ) : (
                  <>
                    Test this skill <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
            <Button variant="ghost" onClick={() => setView("interview")} className="text-muted-foreground">
              Resume interview →
            </Button>
          </div>
        </motion.div>
      )}

      {/* Other gaps */}
      {others.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Other open gaps</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {others.map((g) => (
              <div key={g.competency} className="hm-elevated rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium">{g.competency}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {g.candidateLevel} · {g.importance}
                  </div>
                </div>
                <PriorityPill priority={g.priority} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
