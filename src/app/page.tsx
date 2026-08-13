"use client";

import * as React from "react";
import { useHireMind } from "@/lib/store";
import { SiteHeader, SiteFooter } from "@/components/hiremind/shell";
import { HomeView } from "@/components/hiremind/home-view";
import { CandidateView } from "@/components/hiremind/candidate-view";
import { MatchView } from "@/components/hiremind/match-view";
import { GapsView } from "@/components/hiremind/gaps-view";
import { InterviewView } from "@/components/hiremind/interview-view";
import { EvaluationView } from "@/components/hiremind/evaluation-view";
import { ReadinessView } from "@/components/hiremind/readiness-view";
import { RoadmapView } from "@/components/hiremind/roadmap-view";
import { LoadingOverlay } from "@/components/hiremind/loading-overlay";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Home() {
  const { view, error } = useHireMind();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {view === "home" && <HomeView />}
            {view === "candidate" && <CandidateView />}
            {view === "match" && <MatchView />}
            {view === "gaps" && <GapsView />}
            {view === "interview" && <InterviewView />}
            {view === "evaluation" && <EvaluationView />}
            {view === "readiness" && <ReadinessView />}
            {view === "roadmap" && <RoadmapView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
      <LoadingOverlay />
    </>
  );
}
