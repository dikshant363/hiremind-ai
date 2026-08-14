"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useHireMind, parseHash } from "@/lib/store";
import { SiteHeader, SiteFooter } from "@/components/hiremind/shell";
import { HomeView } from "@/components/hiremind/home-view";
import { LoadingOverlay } from "@/components/hiremind/loading-overlay";
import { ShortcutHint } from "@/components/hiremind/shortcut-hint";
import { FlowProgress } from "@/components/hiremind/flow-progress";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAchievements } from "@/hooks/use-achievements";
import { useTheme } from "next-themes";

// Code splitting: dynamically import non-home views
const CandidateView = dynamic(() => import("@/components/hiremind/candidate-view").then((m) => m.CandidateView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading candidate profile…</div>,
});
const MatchView = dynamic(() => import("@/components/hiremind/match-view").then((m) => m.MatchView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading semantic match…</div>,
});
const GapsView = dynamic(() => import("@/components/hiremind/gaps-view").then((m) => m.GapsView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading skill gaps…</div>,
});
const InterviewView = dynamic(() => import("@/components/hiremind/interview-view").then((m) => m.InterviewView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading interview simulator…</div>,
});
const EvaluationView = dynamic(() => import("@/components/hiremind/evaluation-view").then((m) => m.EvaluationView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading evaluation…</div>,
});
const ReadinessView = dynamic(() => import("@/components/hiremind/readiness-view").then((m) => m.ReadinessView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading readiness report…</div>,
});
const RoadmapView = dynamic(() => import("@/components/hiremind/roadmap-view").then((m) => m.RoadmapView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading roadmap…</div>,
});
const CompareView = dynamic(() => import("@/components/hiremind/compare-view").then((m) => m.CompareView), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground">Loading comparison…</div>,
});

// Code splitting: dynamically import heavy modals
const CommandPalette = dynamic(() => import("@/components/hiremind/command-palette").then((m) => m.CommandPalette), { ssr: false });
const OnboardingTooltip = dynamic(() => import("@/components/hiremind/onboarding-tooltip").then((m) => m.OnboardingTooltip), { ssr: false });
const AchievementGallery = dynamic(() => import("@/components/hiremind/achievement-gallery").then((m) => m.AchievementGallery), { ssr: false });
const AboutModal = dynamic(() => import("@/components/hiremind/about-modal").then((m) => m.AboutModal), { ssr: false });
const QuestionBankModal = dynamic(() => import("@/components/hiremind/question-bank-modal").then((m) => m.QuestionBankModal), { ssr: false });
const ControlCenter = dynamic(() => import("@/components/hiremind/control-center").then((m) => m.ControlCenter), { ssr: false });
const AuthModal = dynamic(() => import("@/components/hiremind/auth-modal").then((m) => m.AuthModal), { ssr: false });

export default function Home() {
  const {
    view,
    error,
    presentationMode,
    sessionId,
    hydrateSession,
    candidate,
    gaps,
    interview,
    readiness,
    roadmap,
    lastEvaluation,
    isDemo,
    fetchCurrentUser,
    fetchSystemConfig,
    fetchStats,
  } = useHireMind();
  const { showHints, setShowHints } = useKeyboardShortcuts();
  const { unlock, mounted: achievementsMounted } = useAchievements();
  const { setTheme, theme } = useTheme();

  // Modal states
  const [showAchievements, setShowAchievements] = React.useState(false);
  const [showAbout, setShowAbout] = React.useState(false);
  const [showQuestionBank, setShowQuestionBank] = React.useState(false);
  const [showControlCenter, setShowControlCenter] = React.useState(false);
  const [showAuth, setShowAuth] = React.useState(false);

  // Initial load: fetch user profile, system configuration, and stats
  useEffect(() => {
    fetchCurrentUser();
    fetchSystemConfig();
    fetchStats();
  }, [fetchCurrentUser, fetchSystemConfig, fetchStats]);

  // Hydrate from URL hash on initial mount
  const hydratedRef = React.useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const { view: hashView, sessionId: hashSession } = parseHash();
    if (hashSession && hashView !== "home") {
      hydrateSession(hashSession, hashView);
    } else if (hashView !== "home" && !hashSession) {
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

  // Listen for shortcut overlays & modals
  useEffect(() => {
    const handler = () => setShowHints(true);
    document.addEventListener("hm-show-shortcuts", handler);
    return () => document.removeEventListener("hm-show-shortcuts", handler);
  }, [setShowHints]);

  useEffect(() => {
    const handler = () => setShowAchievements((v) => !v);
    document.addEventListener("hm-show-achievements", handler);
    return () => document.removeEventListener("hm-show-achievements", handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowAbout(true);
    document.addEventListener("hm-show-about", handler);
    return () => document.removeEventListener("hm-show-about", handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowQuestionBank(true);
    document.addEventListener("hm-show-question-bank", handler);
    return () => document.removeEventListener("hm-show-question-bank", handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowControlCenter(true);
    document.addEventListener("hm-open-control-center", handler);
    return () => document.removeEventListener("hm-open-control-center", handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowAuth(true);
    document.addEventListener("hm-open-auth", handler);
    return () => document.removeEventListener("hm-open-auth", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setShowQuestionBank(false);
      useHireMind.getState().setView("interview");
    };
    document.addEventListener("hm-navigate-interview", handler);
    return () => document.removeEventListener("hm-navigate-interview", handler);
  }, []);

  // ─── Achievement detection ───
  const prevCandidate = React.useRef(candidate);
  const prevGaps = React.useRef(gaps);
  const prevInterview = React.useRef(interview);
  const prevReadiness = React.useRef(readiness);
  const prevRoadmap = React.useRef(roadmap);
  const prevEval = React.useRef(lastEvaluation);
  const isHydrating = React.useRef(false);

  useEffect(() => {
    if (hydratedRef.current && typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("session=") && hash.includes("view=")) {
        isHydrating.current = true;
      }
    }
  }, [candidate, gaps, interview, readiness, roadmap]);

  useEffect(() => {
    if (!achievementsMounted) return;

    if (isHydrating.current) {
      prevCandidate.current = candidate;
      prevGaps.current = gaps;
      prevInterview.current = interview;
      prevReadiness.current = readiness;
      prevRoadmap.current = roadmap;
      prevEval.current = lastEvaluation;
      isHydrating.current = false;
      return;
    }

    if (candidate && !prevCandidate.current) {
      unlock("first_analysis");
    }

    if (gaps && gaps.length > 0 && (!prevGaps.current || prevGaps.current.length === 0)) {
      unlock("gap_identified");
    }

    if (interview?.status === "asking" && prevInterview.current?.status !== "asking") {
      unlock("first_interview");
    }

    if (
      interview &&
      interview.answers.length > 0 &&
      (!prevInterview.current || prevInterview.current.answers.length === 0)
    ) {
      unlock("answer_submitted");
    }

    if (interview?.status === "complete" && prevInterview.current?.status !== "complete") {
      unlock("interview_complete");
    }

    if (readiness && !prevReadiness.current) {
      unlock("readiness_calculated");
    }

    if (roadmap && !prevRoadmap.current) {
      unlock("roadmap_generated");
    }

    if (lastEvaluation && lastEvaluation.overall >= 0.7 && (!prevEval.current || prevEval.current.overall < 0.7)) {
      unlock("high_score");
    }

    if (isDemo && roadmap && !prevRoadmap.current) {
      unlock("demo_complete");
    }

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
          transition={{ duration: 0.2 }}
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
      <ControlCenter open={showControlCenter} onClose={() => setShowControlCenter(false)} />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      {view === "home" && <OnboardingTooltip />}
    </>
  );
}
