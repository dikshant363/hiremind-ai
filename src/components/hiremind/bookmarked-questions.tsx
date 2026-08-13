"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, ChevronDown, RotateCcw, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import {
  useQuestionBookmarks,
  type BookmarkedQuestion,
} from "@/hooks/use-question-bookmarks";
import { cn } from "@/lib/utils";

/* ============================================================================
 * BookmarkedQuestions — review panel for starred interview questions.
 *
 * Two variants:
 *   • "full"    — collapsible card with one entry per bookmark, shown on the
 *                 readiness view between the InterviewTimeline and SessionSummary.
 *   • "compact" — horizontal scrollable row of competency pills, shown on the
 *                 interview complete state.
 *
 * State is shared via the module-level `useQuestionBookmarks` store, so a
 * bookmark added during the interview instantly appears in the readiness view
 * (and vice versa for removal).
 * ==========================================================================*/

const DIFFICULTY_TONE: Record<string, { bg: string; text: string }> = {
  easy: { bg: "bg-success/15", text: "text-success-foreground" },
  medium: { bg: "bg-accent-blue/15", text: "text-accent-blue-foreground" },
  hard: { bg: "bg-critical/15", text: "text-critical-foreground" },
};

const TRUNCATE_LENGTH = 200;

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Format an ISO date as a short, friendly timestamp (e.g. "Mar 14, 3:45 PM"). */
function formatBookmarkDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* ---------------------------------------------------------------------------
 * AnswerText — collapsible snapshot of the user's answer at bookmark time.
 * Truncates to 200 chars with a "Show more" toggle.
 * ------------------------------------------------------------------------- */

function AnswerText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > TRUNCATE_LENGTH;
  const display =
    isLong && !expanded
      ? text.slice(0, TRUNCATE_LENGTH).trimEnd() + "…"
      : text;

  return (
    <div className="mt-2.5 rounded-lg border border-border/50 bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquareQuote className="h-3 w-3" />
        Your answer
      </div>
      <div className="mt-1 text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
        {display}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent-blue-foreground hover:underline"
        >
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * BookmarkedCard — single bookmark row in the full variant.
 * ------------------------------------------------------------------------- */

function BookmarkedCard({
  bookmark,
  onRemove,
  onPracticeAgain,
}: {
  bookmark: BookmarkedQuestion;
  onRemove: () => void;
  onPracticeAgain: () => void;
}) {
  const diffTone =
    DIFFICULTY_TONE[bookmark.difficulty] ?? DIFFICULTY_TONE.medium;
  const hasAnswer =
    !!bookmark.answerText && bookmark.answerText.trim().length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="hm-card hm-card-hover p-4"
    >
      {/* Header row — competency, difficulty, date */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="inline-flex items-center rounded-full bg-accent-blue/10 text-accent-blue-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {bookmark.competency}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider capitalize",
              diffTone.bg,
              diffTone.text
            )}
          >
            {bookmark.difficulty}
          </span>
        </div>
        {bookmark.bookmarkedAt && (
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {formatBookmarkDate(bookmark.bookmarkedAt)}
          </span>
        )}
      </div>

      {/* Question text */}
      <div className="mt-2 text-[13px] font-medium leading-relaxed text-foreground">
        {bookmark.text}
      </div>

      {/* Answer snapshot */}
      {hasAnswer && <AnswerText text={bookmark.answerText!} />}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={onPracticeAgain}
          title="Start a new interview to practice this question again"
        >
          <RotateCcw className="h-3 w-3" />
          Practice again
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-critical-foreground"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </Button>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * Main exported component
 * ------------------------------------------------------------------------- */

export interface BookmarkedQuestionsProps {
  className?: string;
  variant?: "full" | "compact";
}

export function BookmarkedQuestions({
  className,
  variant = "full",
}: BookmarkedQuestionsProps) {
  const { bookmarks, removeBookmark, clearAll } = useQuestionBookmarks();
  const { startInterview } = useHireMind();

  // Collapsible state for the full variant. Hooks must be called before any
  // early return, so we keep them up here unconditionally.
  const [collapsed, setCollapsed] = React.useState(bookmarks.length === 0);
  React.useEffect(() => {
    setCollapsed(bookmarks.length === 0);
  }, [bookmarks.length]);

  /* -----------------------------------------------------------------------
   * Compact variant — horizontal scrollable row of pills.
   * Used on the interview complete state. Hidden when empty.
   * --------------------------------------------------------------------- */
  if (variant === "compact") {
    if (bookmarks.length === 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "mt-3 flex items-center gap-2 rounded-lg bg-warning/5 border border-warning/15 px-3 py-2",
          className
        )}
      >
        <Star className="h-3.5 w-3.5 shrink-0 text-warning fill-warning" />
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
          Bookmarked ({bookmarks.length}):
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar min-w-0">
          {bookmarks.map((b) => (
            <span
              key={b.questionId}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/10 text-warning-foreground px-2 py-0.5 text-[10px] font-medium"
              title={b.text}
            >
              <Star className="h-2.5 w-2.5 fill-warning" />
              {b.competency}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  /* -----------------------------------------------------------------------
   * Full variant — collapsible panel.
   * Used on the readiness view. Starts expanded if there are bookmarks,
   * collapsed otherwise — but the empty state always shows.
   * --------------------------------------------------------------------- */

  const isEmpty = bookmarks.length === 0;
  const hasToggle = !isEmpty;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "hm-card hm-card-hover mt-4 p-4 sm:p-6 overflow-visible",
        className
      )}
      aria-label="Bookmarked questions"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning-foreground">
          <Star className="h-5 w-5 fill-warning" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-[13px] font-semibold leading-tight truncate">
                Bookmarked questions
              </h3>
              {!isEmpty && (
                <span className="inline-flex items-center rounded-full bg-warning/15 text-warning-foreground px-1.5 py-0.5 text-[10px] font-semibold tabular-nums shrink-0">
                  {bookmarks.length}
                </span>
              )}
            </div>
            {!isEmpty && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-critical-foreground"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.confirm(
                        "Remove all bookmarked questions? This cannot be undone."
                      )
                    ) {
                      clearAll();
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setCollapsed((v) => !v)}
                  aria-label={collapsed ? "Expand" : "Collapse"}
                  aria-expanded={!collapsed}
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      !collapsed && "rotate-180"
                    )}
                  />
                </Button>
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
            Questions you starred during interviews — saved for review.
          </p>
        </div>
      </div>

      {/* Empty state — always visible when there are no bookmarks */}
      {isEmpty && (
        <div className="mt-4 flex flex-col items-center justify-center text-center py-8 px-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning-foreground mb-2.5">
            <Star className="h-5 w-5" />
          </span>
          <p className="text-[12px] text-muted-foreground max-w-xs leading-relaxed">
            No bookmarked questions yet. Star a question during your interview
            to save it for review.
          </p>
        </div>
      )}

      {/* Collapsible list (only when non-empty) */}
      {hasToggle && (
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-2.5 max-h-[28rem] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {bookmarks.map((b) => (
                    <BookmarkedCard
                      key={b.questionId}
                      bookmark={b}
                      onRemove={() => removeBookmark(b.questionId)}
                      onPracticeAgain={() => startInterview()}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.section>
  );
}
