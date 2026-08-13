/**
 * HIREMIND AI — Client store (Zustand).
 *
 * Holds the single-page app's view state + session data, and orchestrates
 * the API calls that drive the core intelligence loop:
 *
 *   analyze -> startInterview -> submitAnswer (loop) -> computeReadiness
 */

"use client";

import { create } from "zustand";
import type {
  CandidateProfile,
  JobProfile,
  MatchResult,
  SkillGap,
  InterviewState,
  AnswerEvaluation,
  ReadinessResult,
  Roadmap,
} from "@/lib/types";

export type View =
  | "home"
  | "candidate"
  | "match"
  | "gaps"
  | "interview"
  | "evaluation"
  | "readiness"
  | "roadmap";

interface AnalyzeMeta {
  resumeFallback?: boolean;
  jobFallback?: boolean;
  evalFallback?: boolean;
}

interface StoreState {
  view: View;
  setView: (v: View) => void;

  // Presentation mode
  presentationMode: boolean;
  togglePresentationMode: () => void;

  // Session
  sessionId: string | null;
  isDemo: boolean;

  // Inputs
  resumeText: string;
  jobTitle: string;
  jobText: string;
  setResumeText: (t: string) => void;
  setJobTitle: (t: string) => void;
  setJobText: (t: string) => void;

  // Results
  candidate: CandidateProfile | null;
  job: JobProfile | null;
  match: MatchResult | null;
  gaps: SkillGap[] | null;
  interview: InterviewState | null;
  readiness: ReadinessResult | null;
  roadmap: Roadmap | null;

  // The latest evaluation (drives the evaluation reveal view)
  lastEvaluation: AnswerEvaluation | null;

  // Loading / error
  loading: boolean;
  loadingStep: string;
  error: string | null;
  meta: AnalyzeMeta;

  // Actions
  analyze: (opts?: { demo?: boolean }) => Promise<void>;
  startInterview: () => Promise<void>;
  submitAnswer: (questionId: string, answer: string, opts?: { useDemoAnswer?: boolean }) => Promise<void>;
  computeReadiness: () => Promise<void>;
  reset: () => void;
}

const LOADING_STEPS: Record<string, string> = {
  analyze: "Understanding your resume and the target role…",
  interview_start: "Designing your adaptive interview…",
  answer: "Understanding your answer…",
  readiness: "Calculating your job readiness…",
};

export const useHireMind = create<StoreState>((set, get) => ({
  view: "home",
  setView: (v) => set({ view: v }),

  presentationMode: false,
  togglePresentationMode: () => set((s) => ({ presentationMode: !s.presentationMode })),

  sessionId: null,
  isDemo: false,

  resumeText: "",
  jobTitle: "",
  jobText: "",
  setResumeText: (t) => set({ resumeText: t }),
  setJobTitle: (t) => set({ jobTitle: t }),
  setJobText: (t) => set({ jobText: t }),

  candidate: null,
  job: null,
  match: null,
  gaps: null,
  interview: null,
  readiness: null,
  roadmap: null,
  lastEvaluation: null,

  loading: false,
  loadingStep: "",
  error: null,
  meta: {},

  analyze: async (opts) => {
    set({ loading: true, loadingStep: LOADING_STEPS.analyze, error: null });
    try {
      const { resumeText, jobTitle, jobText } = get();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobTitle,
          jobText,
          isDemo: opts?.demo ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      set({
        sessionId: data.id,
        isDemo: data.isDemo,
        candidate: data.candidate,
        job: data.job,
        match: data.match,
        gaps: data.gaps,
        interview: null,
        readiness: null,
        roadmap: null,
        lastEvaluation: null,
        meta: { resumeFallback: data.meta?.resumeFallback, jobFallback: data.meta?.jobFallback },
        view: "candidate",
      });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  startInterview: async () => {
    const { sessionId } = get();
    if (!sessionId) {
      set({ error: "Run an analysis first." });
      return;
    }
    set({ loading: true, loadingStep: LOADING_STEPS.interview_start, error: null });
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start interview.");
      set({ interview: data.interview, view: "interview" });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  submitAnswer: async (questionId, answer, opts) => {
    const { sessionId } = get();
    if (!sessionId) {
      set({ error: "Run an analysis first." });
      return;
    }
    set({ loading: true, loadingStep: LOADING_STEPS.answer, error: null });
    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId, answer, useDemoAnswer: opts?.useDemoAnswer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't evaluate answer.");
      set({
        interview: data.interview,
        lastEvaluation: data.evaluation,
        meta: { ...get().meta, evalFallback: data.meta?.evalFallback },
        view: "evaluation",
      });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  computeReadiness: async () => {
    const { sessionId } = get();
    if (!sessionId) {
      set({ error: "Run an analysis first." });
      return;
    }
    set({ loading: true, loadingStep: LOADING_STEPS.readiness, error: null });
    try {
      const res = await fetch("/api/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't compute readiness.");
      set({ readiness: data.readiness, roadmap: data.roadmap, view: "readiness" });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  reset: () =>
    set({
      view: "home",
      presentationMode: false,
      sessionId: null,
      isDemo: false,
      resumeText: "",
      jobTitle: "",
      jobText: "",
      candidate: null,
      job: null,
      match: null,
      gaps: null,
      interview: null,
      readiness: null,
      roadmap: null,
      lastEvaluation: null,
      loading: false,
      loadingStep: "",
      error: null,
      meta: {},
    }),
}));
