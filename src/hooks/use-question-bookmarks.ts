"use client";

import * as React from "react";
import type { CompetencyCategory } from "@/lib/types";

/**
 * A bookmarked interview question, persisted to localStorage so the user can
 * review starred questions across sessions, tabs, and refreshes.
 */
export interface BookmarkedQuestion {
  questionId: string;
  competency: string;
  category: CompetencyCategory;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  /** ISO date string — when the bookmark was created. */
  bookmarkedAt: string;
  /** Optional session ID for context (which interview session bookmarked it). */
  sessionId?: string;
  /** Snapshot of the user's answer at the time of bookmarking, if any. */
  answerText?: string;
}

const STORAGE_KEY = "hiremind-bookmarks";

/** Stable empty array used for SSR snapshots and empty reads. */
const EMPTY: BookmarkedQuestion[] = [];

/* ---------------------------------------------------------------------------
 * Module-level store — shared across every component that uses the hook.
 *
 * We use the `useSyncExternalStore` pattern: a single source of truth in the
 * module scope (a versioned cache + listener Set) that any number of
 * components subscribe to. Toggling a bookmark in one component instantly
 * re-renders every other subscribed component, even on different routes.
 *
 * The cache is versioned so `getSnapshot` is referentially stable between
 * emits (otherwise `useSyncExternalStore` would loop infinitely). The cache
 * is only re-read from localStorage when `version` increments.
 * ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();
let snapshot: BookmarkedQuestion[] = EMPTY;
let version = 0;
let lastReadVersion = -1;
/** Guards against our own writes triggering the cross-tab `storage` event. */
let isWriting = false;
/** Whether the cross-tab `storage` listener has been attached. */
let storageListenerAttached = false;

function isValidBookmark(b: unknown): b is BookmarkedQuestion {
  if (!b || typeof b !== "object") return false;
  const v = b as Record<string, unknown>;
  return (
    typeof v.questionId === "string" &&
    typeof v.competency === "string" &&
    typeof v.text === "string" &&
    typeof v.difficulty === "string"
  );
}

function readFromStorage(): BookmarkedQuestion[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(isValidBookmark);
    return valid.length === parsed.length ? (valid as BookmarkedQuestion[]) : valid;
  } catch {
    return EMPTY;
  }
}

function persist(list: BookmarkedQuestion[]): void {
  if (typeof window === "undefined") return;
  try {
    isWriting = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Quota exceeded or storage disabled — fail silently. The in-memory
    // cache still updates so the UI reflects the change for this session.
  } finally {
    isWriting = false;
  }
}

function emit(): void {
  version++;
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* listener threw — ignore so other listeners still fire */
    }
  });
}

function getSnapshot(): BookmarkedQuestion[] {
  if (lastReadVersion !== version) {
    snapshot = readFromStorage();
    lastReadVersion = version;
  }
  return snapshot;
}

function getServerSnapshot(): BookmarkedQuestion[] {
  return EMPTY;
}

function onStorageEvent(e: StorageEvent): void {
  if (e.key !== STORAGE_KEY) return;
  if (isWriting) return; // our own write — already emitted
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined" && !storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener("storage", onStorageEvent);
  }
  return () => {
    listeners.delete(listener);
  };
}

function setBookmarks(
  updater: (prev: BookmarkedQuestion[]) => BookmarkedQuestion[]
): void {
  const prev = getSnapshot();
  const next = updater(prev);
  persist(next);
  emit();
}

/* ---------------------------------------------------------------------------
 * Public hook
 * ------------------------------------------------------------------------- */

export interface UseQuestionBookmarksResult {
  /** Bookmarks sorted by `bookmarkedAt` desc (newest first). */
  bookmarks: BookmarkedQuestion[];
  /** Returns true if the given question ID is currently bookmarked. */
  isBookmarked: (questionId: string) => boolean;
  /** Adds the question if not bookmarked, removes it if it is. */
  toggleBookmark: (question: BookmarkedQuestion) => void;
  /** Removes a single bookmark by question ID. */
  removeBookmark: (questionId: string) => void;
  /** Removes every bookmark. */
  clearAll: () => void;
}

/**
 * Shared, SSR-safe hook for persisting bookmarked interview questions to
 * localStorage. The state is shared across every component using the hook —
 * writing from one component immediately re-renders all subscribers.
 *
 * Uses `useSyncExternalStore` so React 18+ concurrent rendering is safe and
 * the snapshot stays referentially stable between emits.
 */
export function useQuestionBookmarks(): UseQuestionBookmarksResult {
  const bookmarks = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Sort newest-first. The cached snapshot is unsorted (preserves write order)
  // so this useMemo produces a fresh sorted array only when bookmarks change.
  const sorted = React.useMemo<BookmarkedQuestion[]>(
    () =>
      bookmarks.length === 0
        ? EMPTY
        : [...bookmarks].sort((a, b) => {
            const at = new Date(a.bookmarkedAt).getTime();
            const bt = new Date(b.bookmarkedAt).getTime();
            // Treat invalid dates as "now" so they sort to the top.
            const aT = Number.isFinite(at) ? at : Date.now();
            const bT = Number.isFinite(bt) ? bt : Date.now();
            return bT - aT;
          }),
    [bookmarks]
  );

  const isBookmarked = React.useCallback(
    (questionId: string) =>
      bookmarks.some((b) => b.questionId === questionId),
    [bookmarks]
  );

  const toggleBookmark = React.useCallback((question: BookmarkedQuestion) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.questionId === question.questionId);
      if (exists) {
        return prev.filter((b) => b.questionId !== question.questionId);
      }
      return [
        ...prev,
        {
          ...question,
          bookmarkedAt:
            question.bookmarkedAt || new Date().toISOString(),
        },
      ];
    });
  }, []);

  const removeBookmark = React.useCallback((questionId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.questionId !== questionId));
  }, []);

  const clearAll = React.useCallback(() => {
    setBookmarks(() => []);
  }, []);

  return {
    bookmarks: sorted,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearAll,
  };
}
