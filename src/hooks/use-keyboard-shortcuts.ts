"use client";

import { useEffect, useCallback, useState } from "react";
import { useHireMind, type View } from "@/lib/store";
import { DEMO_RESUME, DEMO_JOB, DEMO_JOB_TITLE } from "@/lib/demo";

const VIEW_KEYS: Record<string, View> = {
  "1": "home",
  "2": "candidate",
  "3": "match",
  "4": "gaps",
  "5": "interview",
  "6": "readiness",
  "7": "roadmap",
};

/**
 * Keyboard shortcuts hook for power users and demo presenters.
 * - 1-7: Switch to corresponding nav view
 * - d: Load demo candidate (from home view)
 * - p: Toggle presentation mode
 * - t: Toggle theme
 * - Escape: Go back to home view
 * - ?: Show shortcut hint overlay
 */
export function useKeyboardShortcuts() {
  const { view, setView, sessionId, presentationMode, togglePresentationMode, resumeText, jobTitle, jobText, setResumeText, setJobTitle, setJobText, analyze } = useHireMind();
  const [showHints, setShowHints] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el?.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // ? shows hints
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setShowHints((v) => !v);
        return;
      }

      // Escape
      if (key === "escape") {
        e.preventDefault();
        setShowHints(false);
        setView("home");
        return;
      }

      // 1-7: switch views
      if (VIEW_KEYS[key]) {
        const target = VIEW_KEYS[key];
        // Views that need a session should only work if we have one
        const sessionRequired = ["candidate", "match", "gaps", "interview", "readiness", "roadmap"];
        if (sessionRequired.includes(target) && !sessionId) return;
        e.preventDefault();
        setView(target);
        return;
      }

      // d: Load demo candidate
      if (key === "d" && view === "home") {
        e.preventDefault();
        setResumeText(DEMO_RESUME);
        setJobTitle(DEMO_JOB_TITLE);
        setJobText(DEMO_JOB);
        analyze({ demo: true });
        return;
      }

      // p: Toggle presentation mode
      if (key === "p") {
        e.preventDefault();
        togglePresentationMode();
        return;
      }

      // t: Toggle theme
      if (key === "t") {
        e.preventDefault();
        // We'll dispatch a custom event that the theme listener picks up
        document.dispatchEvent(new CustomEvent("hm-toggle-theme"));
        return;
      }
    },
    [view, setView, sessionId, togglePresentationMode, setResumeText, setJobTitle, setJobText, analyze]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { showHints, setShowHints };
}
