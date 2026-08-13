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
  InterviewDifficulty,
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
  | "roadmap"
  | "compare";

/** Lightweight comparison summary returned by /api/session/compare. */
export interface ComparisonSession {
  id: string;
  jobTitle: string;
  createdAt: string;
  isDemo: boolean;
  matchIndex: number | null;
  readinessIndex: number | null;
  gapCount: number;
  topGaps: string[];
  interviewScore: number | null;
}

export interface ComparisonDeltas {
  matchDelta: number | null;
  readinessDelta: number | null;
  gapDelta: number;
  interviewScoreDelta: number | null;
}

export interface Comparison {
  a: ComparisonSession;
  b: ComparisonSession;
  deltas: ComparisonDeltas;
}

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

  // Session comparison
  comparison: Comparison | null;
  loadingComparison: boolean;
  loadComparison: (aId: string, bId: string) => Promise<void>;
  clearComparison: () => void;

  // Actions
  analyze: (opts?: { demo?: boolean }) => Promise<void>;
  startInterview: (opts?: { difficulty?: InterviewDifficulty }) => Promise<void>;
  submitAnswer: (questionId: string, answer: string, opts?: { useDemoAnswer?: boolean }) => Promise<void>;
  computeReadiness: () => Promise<void>;
  hydrateSession: (sessionId: string, view?: View) => Promise<void>;
  reset: () => void;
}

const LOADING_STEPS: Record<string, string> = {
  analyze: "Understanding your resume and the target role…",
  interview_start: "Designing your adaptive interview…",
  answer: "Understanding your answer…",
  readiness: "Calculating your job readiness…",
};

const VALID_VIEWS: View[] = ["home", "candidate", "match", "gaps", "interview", "evaluation", "readiness", "roadmap", "compare"];

export function parseHash(): { view: View; sessionId: string | null } {
  if (typeof window === "undefined") return { view: "home", sessionId: null };
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return { view: "home", sessionId: null };
  const params = new URLSearchParams(hash);
  const v = params.get("view");
  const view: View = v && VALID_VIEWS.includes(v as View) ? (v as View) : "home";
  const sessionId = params.get("session");
  return { view, sessionId };
}

export function syncHash(view: View, sessionId: string | null) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (view !== "home") params.set("view", view);
  if (sessionId) params.set("session", sessionId);
  const str = params.toString();
  const newHash = str ? `#${str}` : "";
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, "", newHash || window.location.pathname);
  }
}

export const useHireMind = create<StoreState>((set, get) => ({
  view: "home",
  setView: (v) => {
    set({ view: v });
    syncHash(v, get().sessionId);
  },

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

  comparison: null,
  loadingComparison: false,

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
      syncHash("candidate", data.id);
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  startInterview: async (opts) => {
    const { sessionId } = get();
    if (!sessionId) {
      set({ error: "Run an analysis first." });
      return;
    }
    const difficulty = opts?.difficulty ?? "auto";
    set({ loading: true, loadingStep: LOADING_STEPS.interview_start, error: null });
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, difficultyPreference: difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start interview.");
      set({ interview: data.interview, view: "interview" });
      syncHash("interview", get().sessionId);
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
      syncHash("evaluation", get().sessionId);
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
      syncHash("readiness", get().sessionId);
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  hydrateSession: async (sid, targetView) => {
    set({ loading: true, loadingStep: "Restoring your session…", error: null });
    try {
      const res = await fetch(`/api/session?id=${encodeURIComponent(sid)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Session not found.");
      set({
        sessionId: data.id,
        isDemo: data.isDemo,
        resumeText: data.resume?.lines ? "" : "", // Don't need raw text after hydration
        jobTitle: data.job?.title || "",
        jobText: "",
        candidate: data.candidate,
        job: data.jobProfile,
        match: data.match,
        gaps: data.gaps,
        interview: data.interview,
        readiness: data.readiness,
        roadmap: data.roadmap,
        lastEvaluation: null,
        view: targetView || (data.readiness ? "readiness" : data.interview ? "interview" : data.match ? "match" : "candidate"),
      });
      syncHash(get().view, data.id);
    } catch (err) {
      set({ error: (err as Error).message, view: "home" });
      syncHash("home", null);
    } finally {
      set({ loading: false, loadingStep: "" });
    }
  },

  reset: () => {
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
      comparison: null,
      loadingComparison: false,
    });
    syncHash("home", null);
  },

  loadComparison: async (aId, bId) => {
    if (!aId || !bId || aId === bId) {
      set({ error: "Pick two different sessions to compare." });
      return;
    }
    set({ loadingComparison: true, error: null });
    try {
      const res = await fetch(
        `/api/session/compare?a=${encodeURIComponent(aId)}&b=${encodeURIComponent(bId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load comparison.");
      set({ comparison: data as Comparison, view: "compare" });
      // Compare view doesn't need a session id in the URL — it operates on
      // any two past sessions, so we clear the session param intentionally.
      syncHash("compare", null);
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loadingComparison: false });
    }
  },

  clearComparison: () => {
    set({ comparison: null });
  },
}));
