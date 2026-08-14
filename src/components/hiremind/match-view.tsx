"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Info, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useHireMind } from "@/lib/store";
import { toast } from "sonner";
import { ScoreRing, CompetencyBar, StatusPill, AnimatedCounter } from "./shell";
import { JobInsights } from "./job-insights";
import { JobMarketInsights } from "./job-market-insights";
import type { MatchStatus } from "@/lib/types";

export function MatchView() {
  const { match, setView } = useHireMind();
  // Mouse-follow spotlight for the score card — updates --mx/--my CSS vars.
  const handleScoreMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mx", `${x}%`);
    e.currentTarget.style.setProperty("--my", `${y}%`);
  }, []);
  if (!match) return null;

  const tone =
    match.band === "strong"
      ? "success"
      : match.band === "good"
      ? "success"
      : match.band === "fair"
      ? "warning"
      : "critical";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Job Match</div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">How well do you align?</h1>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    toast("Session link copied to clipboard");
                  });
                }}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span className="text-[11px]">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy link to share this session</TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          This is a Prototype Job Match Index — a transparent aggregate of your evidence against the role's required and preferred competencies.
        </p>
      </motion.div>

      <div className="mt-6 sm:mt-8 grid gap-4 lg:grid-cols-5">
        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onMouseMove={handleScoreMouseMove}
          className="hm-card hm-card-hover hm-glass-panel hm-spotlight-card p-5 sm:p-7 lg:col-span-2 flex flex-col items-center justify-center text-center relative"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hm-score-reveal">
              <ScoreRing
                value={match.index}
                label="Prototype Job Match Index"
                caption={match.headline}
                tone={tone as "neutral" | "success" | "warning" | "critical"}
              />
            </div>
          </motion.div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            Deterministic aggregate · AI-assisted interpretation only
          </div>
        </motion.div>

        {/* Components */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hm-card hm-card-hover hm-card-lift p-5 sm:p-7 lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold">Why this score</h3>
            <span className="text-[11px] text-muted-foreground">Weighted contribution</span>
          </div>
          <div className="space-y-4">
            {match.components.map((c, ci) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + ci * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <div>
                    <span className="font-semibold">{c.label}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">weight {Math.round(c.weight * 100)}%</span>
                  </div>
                  <AnimatedCounter value={Math.round(c.score * 100)} delay={0.3 + ci * 0.1} />
                </div>
                <CompetencyBar
                  label=""
                  value={c.score}
                  status={c.score >= 0.7 ? "matched" : c.score >= 0.4 ? "weak" : "gap"}
                  index={ci}
                />
                <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{c.detail}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="hm-divider-soft my-6" />

      {/* Competency comparison */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="hm-card p-4 sm:p-6 mt-4"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[13px] font-semibold">Your profile vs. target role</h3>
          <span className="text-[11px] text-muted-foreground">{match.rows.length} competencies</span>
        </div>
        <div className="hm-stagger-fade grid gap-x-4 sm:gap-x-8 gap-y-3 sm:gap-y-4 md:grid-cols-2">
          {match.rows.map((row, i) => {
            const score =
              row.candidateLevel === "strong"
                ? 1
                : row.candidateLevel === "moderate"
                ? 0.65
                : row.candidateLevel === "weak"
                ? 0.35
                : row.semanticScore > 0.4
                ? 0.2
                : 0.05;
            return (
              <div key={`${row.competency}-${i}`} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold line-clamp-1">{row.competency}</span>
                    {row.required && (
                      <span className="rounded bg-secondary text-secondary-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>
                  <StatusPill status={row.status as MatchStatus} />
                </div>
                <CompetencyBar
                  label=""
                  value={score}
                  status={row.status as MatchStatus}
                  rightLabel={`${row.importance}`}
                />
                {row.evidence && (
                  <div className="hm-evidence-quote italic mt-1 text-[11px] line-clamp-1">
                    “{row.evidence}”
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Job Description Insights — what the AI extracted from the JD */}
      <JobInsights />

      {/* Job market insights — deterministic signals derived from the JD */}
      <JobMarketInsights />

      <div className="mt-8 flex items-center justify-end">
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Button onClick={() => setView("gaps")} className="gap-2">
            See your gaps <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
