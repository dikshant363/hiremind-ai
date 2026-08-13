"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// Onboarding step definition
// ---------------------------------------------------------------------------

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

// ---------------------------------------------------------------------------
// Step definitions — order matters
// ---------------------------------------------------------------------------

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "resume-input",
    target: '[data-hm="resume-input"]',
    title: "Your Resume",
    description:
      "Paste your resume or upload a file. We'll extract your skills and evidence.",
    position: "bottom",
  },
  {
    id: "job-input",
    target: '[data-hm="job-input"]',
    title: "Target Role",
    description:
      "Describe the job you want. Include required and preferred skills for best matching.",
    position: "bottom",
  },
  {
    id: "analyze-btn",
    target: '[data-hm="analyze-btn"]',
    title: "Analyze",
    description:
      "We'll parse both inputs, find your match, and identify your biggest gap.",
    position: "top",
  },
  {
    id: "demo-btn",
    target: '[data-hm="demo-btn"]',
    title: "Demo",
    description:
      "Try the full flow with a sample ML engineer resume and AI/ML job.",
    position: "top",
  },
];

// ---------------------------------------------------------------------------
// localStorage
// ---------------------------------------------------------------------------

const LS_KEY = "hiremind-onboarding-complete";

function isCompleteInStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LS_KEY) === "true";
  } catch {
    return false;
  }
}

function markCompleteInStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, "true");
  } catch {
    // localStorage unavailable — degrade silently
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboarding() {
  const [step, setStep] = React.useState<number | null>(null);
  const [isComplete, setIsComplete] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Load state from localStorage on mount
  React.useEffect(() => {
    const complete = isCompleteInStorage();
    setIsComplete(complete);
    // Auto-start onboarding on first visit
    if (!complete) {
      setStep(0);
    }
    setMounted(true);
  }, []);

  const next = React.useCallback(() => {
    setStep((prev) => {
      if (prev === null) return null;
      const nextStep = prev + 1;
      if (nextStep >= ONBOARDING_STEPS.length) {
        // Onboarding complete
        markCompleteInStorage();
        setIsComplete(true);
        return null;
      }
      return nextStep;
    });
  }, []);

  const skip = React.useCallback(() => {
    setStep(null);
    markCompleteInStorage();
    setIsComplete(true);
  }, []);

  const restart = React.useCallback(() => {
    setStep(0);
    setIsComplete(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const currentStep = step !== null ? ONBOARDING_STEPS[step] : null;

  return {
    step,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    next,
    skip,
    restart,
    isComplete,
    mounted,
  };
}
