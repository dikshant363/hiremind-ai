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
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTheme } from "next-themes";

export default function Home() {
  const { view, error, presentationMode, sessionId, hydrateSession } = useHireMind();
  const { showHints, setShowHints } = useKeyboardShortcuts();
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
    </>
  );
}
