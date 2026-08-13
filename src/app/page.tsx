"use client";

import * as React from "react";
import { useHireMind, parseHash } from "@/lib/store";
import { SiteHeader, SiteFooter } from "@/components/hiremind/shell";
import { HomeView } from "@/components/hiremind/home-view";
import { CandidateView } from "@/components/hiremind/candidate-view";
import { MatchView } from "@/components/hiremind/match-view";
import { GapsView } from "@/components/hiremind/gaps-view";
import { InterviewView } from "@/components/hiremind/interview-view";
import { EvaluationView } from "@/components/hiremind/evaluation-view";
import { ReadinessView } from "@/components/hiremind/readiness-view";
import { RoadmapView } from "@/components/hiremind/roadmap-view";
import { CompareView } from "@/components/hiremind/compare-view";
import { LoadingOverlay } from "@/components/hiremind/loading-overlay";
import { ShortcutHint } from "@/components/hiremind/shortcut-hint";
import { OnboardingTooltip } from "@/components/hiremind/onboarding-tooltip";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAchievements } from "@/hooks/use-achievements";
import { useTheme } from "next-themes";

export default function Home() {
  const { view, error, presentationMode, sessionId, hydrateSession, candidate, gaps, interview, readiness, roadmap, lastEvaluation, isDemo } = useHireMind();
  const { showHints, setShowHints } = useKeyboardShortcuts();
  const { unlock, mounted: achievementsMounted } = useAchievements();
  const { setTheme, theme } = useTheme();

  // Hydrate from URL hash on initial mount
  const hydratedRef = React.useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const { view: hashView, sessionId: hashSession } = parseHash();
    if (hashSession && hashView !== "home") {
      hydrateSession(hashSession, hashView);
    } else if (hashView !== "home" && !hashSession) {
      // Views that don't need an active session (e.g. "compare") can be
      // deep-linked directly — just flip the view, no hydration required.
      useHireMind.getState().setView(hashView);
    }
  }, [hydrateSession]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    document.documentElement.setAttribute("data-presentation", presentationMode ? "true" : "false");
    return () => { document.documentElement.removeAttribute("data-presentation"); };
  }, [presentationMode]);

  // Listen for custom theme toggle event from keyboard shortcuts
  useEffect(() => {
    const handler = () => setTheme(theme === "dark" ? "light" : "dark");
    document.addEventListener("hm-toggle-theme", handler);
    return () => document.removeEventListener("hm-toggle-theme", handler);
  }, [setTheme, theme]);

  // Listen for help button click from header (opens shortcut hint overlay)
  useEffect(() => {
    const handler = () => setShowHints(true);
    document.addEventListener("hm-show-shortcuts", handler);
    return () => document.removeEventListener("hm-show-shortcuts", handler);
  }, [setShowHints]);

  // ─── Achievement detection ───
  // Watch store state and unlock achievements as milestones are reached.
  // Uses refs to avoid re-running on every render; only fires when the
  // relevant piece of state actually transitions to a truthy value.
  const prevCandidate = React.useRef(candidate);
  const prevGaps = React.useRef(gaps);
  const prevInterview = React.useRef(interview);
  const prevReadiness = React.useRef(readiness);
  const prevRoadmap = React.useRef(roadmap);
  const prevEval = React.useRef(lastEvaluation);

  useEffect(() => {
    if (!achievementsMounted) return;

    // first_analysis: candidate just became non-null
    if (candidate && !prevCandidate.current) {
      unlock("first_analysis");
    }

    // gap_identified: gaps just became non-null with items
    if (gaps && gaps.length > 0 && (!prevGaps.current || prevGaps.current.length === 0)) {
      unlock("gap_identified");
    }

    // first_interview: interview status just became "asking"
    if (interview?.status === "asking" && prevInterview.current?.status !== "asking") {
      unlock("first_interview");
    }

    // answer_submitted: interview just got its first answer
    if (
      interview &&
      interview.answers.length > 0 &&
      (!prevInterview.current || prevInterview.current.answers.length === 0)
    ) {
      unlock("answer_submitted");
    }

    // interview_complete: interview status just became "complete"
    if (interview?.status === "complete" && prevInterview.current?.status !== "complete") {
      unlock("interview_complete");
    }

    // readiness_calculated: readiness just became non-null
    if (readiness && !prevReadiness.current) {
      unlock("readiness_calculated");
    }

    // roadmap_generated: roadmap just became non-null
    if (roadmap && !prevRoadmap.current) {
      unlock("roadmap_generated");
    }

    // high_score: latest evaluation has overall >= 0.7
    if (lastEvaluation && lastEvaluation.overall >= 0.7 && (!prevEval.current || prevEval.current.overall < 0.7)) {
      unlock("high_score");
    }

    // demo_complete: demo mode + roadmap generated = end of demo flow
    if (isDemo && roadmap && !prevRoadmap.current) {
      unlock("demo_complete");
    }

    // Update refs
    prevCandidate.current = candidate;
    prevGaps.current = gaps;
    prevInterview.current = interview;
    prevReadiness.current = readiness;
    prevRoadmap.current = roadmap;
    prevEval.current = lastEvaluation;
  }, [candidate, gaps, interview, readiness, roadmap, lastEvaluation, isDemo, achievementsMounted, unlock]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === "home" && <HomeView />}
          {view === "candidate" && <CandidateView />}
          {view === "match" && <MatchView />}
          {view === "gaps" && <GapsView />}
          {view === "interview" && <InterviewView />}
          {view === "evaluation" && <EvaluationView />}
          {view === "readiness" && <ReadinessView />}
          {view === "roadmap" && <RoadmapView />}
          {view === "compare" && <CompareView />}
        </motion.div>
      </main>
      <SiteFooter />
      <LoadingOverlay />
      <ShortcutHint open={showHints} onClose={() => setShowHints(false)} />
      {view === "home" && <OnboardingTooltip />}
    </>
  );
}
