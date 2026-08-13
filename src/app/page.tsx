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
import { CommandPalette } from "@/components/hiremind/command-palette";
import { OnboardingTooltip } from "@/components/hiremind/onboarding-tooltip";
import { AchievementGallery } from "@/components/hiremind/achievement-gallery";
import { AboutModal } from "@/components/hiremind/about-modal";
import { QuestionBankModal } from "@/components/hiremind/question-bank-modal";
import { FlowProgress } from "@/components/hiremind/flow-progress";
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

  // Achievement gallery state
  const [showAchievements, setShowAchievements] = React.useState(false);

  // About modal state
  const [showAbout, setShowAbout] = React.useState(false);

  // Question bank modal state
  const [showQuestionBank, setShowQuestionBank] = React.useState(false);

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

  // Listen for achievement gallery toggle event (from header button + keyboard shortcut)
  useEffect(() => {
    const handler = () => setShowAchievements((v) => !v);
    document.addEventListener("hm-show-achievements", handler);
    return () => document.removeEventListener("hm-show-achievements", handler);
  }, []);

  // Listen for about modal toggle event (from footer link + keyboard shortcut)
  useEffect(() => {
    const handler = () => setShowAbout(true);
    document.addEventListener("hm-show-about", handler);
    return () => document.removeEventListener("hm-show-about", handler);
  }, []);

  // Listen for question bank modal open event (from interview-view button + 'q' keyboard shortcut)
  useEffect(() => {
    const handler = () => setShowQuestionBank(true);
    document.addEventListener("hm-show-question-bank", handler);
    return () => document.removeEventListener("hm-show-question-bank", handler);
  }, []);

  // Listen for "Start interview" CTA from question bank modal — navigate to
  // interview view AND close the question bank modal so the user lands on a
  // clean interview screen.
  useEffect(() => {
    const handler = () => {
      setShowQuestionBank(false);
      useHireMind.getState().setView("interview");
    };
    document.addEventListener("hm-navigate-interview", handler);
    return () => document.removeEventListener("hm-navigate-interview", handler);
  }, []);

  // ─── Achievement detection ───
  // Watch store state and unlock achievements as milestones are reached.
  // Uses refs to avoid re-running on every render; only fires when the
  // relevant piece of state actually transitions to a truthy value.
  //
  // IMPORTANT: We track an `isHydrating` flag. When a session is hydrated
  // (from URL hash or recent-sessions click), all state pieces transition
  // from null → non-null in a single batch. That would otherwise fire 6-7
  // achievement toasts at once. Instead, during hydration we silently
  // sync the "previous" refs to current state without unlocking anything.
  // Only *new* actions taken during the live session unlock achievements.
  const prevCandidate = React.useRef(candidate);
  const prevGaps = React.useRef(gaps);
  const prevInterview = React.useRef(interview);
  const prevReadiness = React.useRef(readiness);
  const prevRoadmap = React.useRef(roadmap);
  const prevEval = React.useRef(lastEvaluation);
  const isHydrating = React.useRef(false);

  // Detect hydration calls (hydrateSession sets loading + view transitions)
  const prevLoading = React.useRef(false);
  useEffect(() => {
    const { loading } = useHireMind.getState();
    // If we just landed on a non-home view via hydration (URL hash present),
    // mark hydrating so the achievement effect skips the initial batch.
    if (hydratedRef.current && typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("session=") && hash.includes("view=")) {
        isHydrating.current = true;
      }
    }
    prevLoading.current = loading;
  }, [candidate, gaps, interview, readiness, roadmap]);

  useEffect(() => {
    if (!achievementsMounted) return;

    // If we're in hydration mode, just sync refs without unlocking.
    // The first time loading flips back to false AFTER hydration, we clear
    // the hydrating flag so subsequent real user actions unlock normally.
    if (isHydrating.current) {
      prevCandidate.current = candidate;
      prevGaps.current = gaps;
      prevInterview.current = interview;
      prevReadiness.current = readiness;
      prevRoadmap.current = roadmap;
      prevEval.current = lastEvaluation;
      // Clear hydrating flag once we've synced once
      isHydrating.current = false;
      return;
    }

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
      <FlowProgress />
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
      <CommandPalette />
      <AchievementGallery open={showAchievements} onClose={() => setShowAchievements(false)} />
      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
      <QuestionBankModal open={showQuestionBank} onClose={() => setShowQuestionBank(false)} />
      {view === "home" && <OnboardingTooltip />}
    </>
  );
}
