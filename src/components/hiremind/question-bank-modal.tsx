"use client";

/**
 * HIREMIND AI — Interview Question Bank Modal
 *
 * Lets users browse ALL possible interview questions grouped by competency,
 * filter by difficulty / category, and free-text search — BEFORE starting the
 * interview. Builds confidence and transparency.
 *
 * Data source: QUESTION_BANK from @/lib/engine (static, deterministic).
 * No AI calls.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Library,
  Sparkles,
  ArrowRight,
  FilterX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QUESTION_BANK } from "@/lib/engine";
import type { CompetencyCategory, InterviewQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
type DifficultyFilter = "all" | InterviewQuestion["difficulty"];
type CategoryFilter = "all" | CompetencyCategory;

interface BankEntry {
  competency: string;
  category: CompetencyCategory;
  text: string;
  difficulty: InterviewQuestion["difficulty"];
  mode: InterviewQuestion["mode"];
}

/* ─── Filter options ─── */
const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "system_design", label: "Systems" },
  { value: "backend", label: "Backend" },
  { value: "ml", label: "ML" },
  { value: "devops", label: "DevOps" },
  { value: "cloud", label: "Cloud" },
  { value: "communication", label: "Communication" },
];

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

/* ─── Badges (kept local so the modal is portable / decoupled) ─── */
const DIFFICULTY_BADGE: Record<
  InterviewQuestion["difficulty"],
  { label: string; cls: string }
> = {
  easy: { label: "Easy", cls: "bg-success/15 text-success-foreground" },
  medium: { label: "Medium", cls: "bg-warning/15 text-warning-foreground" },
  hard: { label: "Hard", cls: "bg-critical/15 text-critical-foreground" },
};

const CATEGORY_BADGE: Record<CompetencyCategory, { label: string; cls: string }> = {
  system_design: { label: "Systems", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  backend: { label: "Backend", cls: "bg-success/15 text-success-foreground" },
  frontend: { label: "Frontend", cls: "bg-chart-3/15 text-chart-3" },
  data: { label: "Data", cls: "bg-warning/15 text-warning-foreground" },
  ml: { label: "ML", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  cloud: { label: "Cloud", cls: "bg-chart-4/15 text-chart-4" },
  devops: { label: "DevOps", cls: "bg-chart-5/15 text-chart-5" },
  languages: { label: "Lang", cls: "bg-chart-2/15 text-chart-2" },
  communication: { label: "Comm", cls: "bg-success/15 text-success-foreground" },
  domain: { label: "Domain", cls: "bg-muted text-muted-foreground" },
};

function CategoryBadge({ category }: { category: CompetencyCategory }) {
  const cfg = CATEGORY_BADGE[category] ?? CATEGORY_BADGE.domain;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
        cfg.cls
      )}
    >
      {cfg.label}
    </span>
  );
}

import type { Variants } from "framer-motion";

/* ─── Animation variants ─── */
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.04, 0.4), duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ─── Flatten QUESTION_BANK into a single list (module-level memo) ─── */
const ALL_ENTRIES: BankEntry[] = Object.entries(QUESTION_BANK).flatMap(
  ([competency, qs]) =>
    qs.map((q) => ({
      competency,
      category: q.category,
      text: q.text,
      difficulty: q.difficulty,
      mode: q.mode,
    }))
);

const TOTAL_QUESTIONS = ALL_ENTRIES.length;
const TOTAL_COMPETENCIES = Object.keys(QUESTION_BANK).length;

/* ─── Component ─── */
export function QuestionBankModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<DifficultyFilter>("all");

  // Reset filters when modal closes (after the close transition)
  React.useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setSearch("");
      setCategoryFilter("all");
      setDifficultyFilter("all");
    }, 250);
    return () => clearTimeout(t);
  }, [open]);

  // Filtered entries
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_ENTRIES.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (difficultyFilter !== "all" && e.difficulty !== difficultyFilter) return false;
      if (q && !`${e.text} ${e.competency}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, categoryFilter, difficultyFilter]);

  // Group by competency, preserving QUESTION_BANK order
  const grouped = React.useMemo(() => {
    const map = new Map<string, BankEntry[]>();
    for (const e of filtered) {
      const arr = map.get(e.competency) ?? [];
      arr.push(e);
      map.set(e.competency, arr);
    }
    const orderedKeys = Object.keys(QUESTION_BANK).filter((k) => map.has(k));
    return orderedKeys.map((k) => ({
      competency: k,
      items: map.get(k) as BankEntry[],
    }));
  }, [filtered]);

  const visibleQuestions = filtered.length;
  const visibleCompetencies = grouped.length;
  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== "all" ||
    difficultyFilter !== "all";

  const handleStartInterview = () => {
    onClose();
    // Defer to allow the close transition to start before navigating
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("hm-navigate-interview"));
    }, 0);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setDifficultyFilter("all");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 p-0 overflow-hidden max-h-[85vh] w-full max-w-[calc(100%-1rem)] sm:max-w-3xl lg:max-w-4xl rounded-xl border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl"
      >
        <DialogDescription className="sr-only">
          Browse all questions HireMind may ask. Filter by skill, difficulty, or category to prepare with confidence.
        </DialogDescription>

        {/* ─── Header ─── */}
        <DialogHeader className="shrink-0 p-5 sm:p-6 pb-4 border-b border-border/60 space-y-2 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Library className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight leading-tight">
                  Interview Question Bank
                </DialogTitle>
                <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5 leading-snug">
                  Browse all questions HireMind may ask. Filter by skill, difficulty, or category to prepare with confidence.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Close question bank"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* ─── Scrollable body (filter bar sticky at top) ─── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Sticky filter bar */}
          <div className="sticky top-0 z-10 px-5 sm:px-6 py-3 border-b border-border/60 backdrop-blur-xl bg-background/80 space-y-2.5">
            {/* Search + difficulty row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions or competencies…"
                  className="pl-8 h-9 text-[13px]"
                  aria-label="Search questions"
                />
              </div>
              {/* Difficulty filter */}
              <div
                className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5"
                role="group"
                aria-label="Filter by difficulty"
              >
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const isActive = difficultyFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDifficultyFilter(opt.value)}
                      className={cn(
                        "h-7 px-2.5 rounded text-[11px] font-medium transition-colors",
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={isActive}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category pills */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1"
              role="group"
              aria-label="Filter by category"
            >
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = categoryFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategoryFilter(opt.value)}
                    className={cn(
                      "shrink-0 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-colors",
                      isActive
                        ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                    aria-pressed={isActive}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>
                <span className="text-foreground font-medium tabular-nums">
                  {visibleQuestions}
                </span>
                {visibleQuestions !== TOTAL_QUESTIONS && (
                  <span className="text-muted-foreground/70">
                    {" of "}
                    <span className="tabular-nums">{TOTAL_QUESTIONS}</span>
                  </span>
                )}
                {" questions across "}
                <span className="text-foreground font-medium tabular-nums">
                  {visibleCompetencies}
                </span>
                {visibleCompetencies !== TOTAL_COMPETENCIES && (
                  <span className="text-muted-foreground/70">
                    {" of "}
                    <span className="tabular-nums">{TOTAL_COMPETENCIES}</span>
                  </span>
                )}
                {" skills"}
              </span>
            </div>
          </div>

          {/* Question list / empty state */}
          <div className="px-5 sm:px-6 py-4">
            {grouped.length === 0 ? (
              <EmptyState hasSearch={search.trim().length > 0} onReset={handleResetFilters} />
            ) : (
              <div className="space-y-5">
                {grouped.map((group, i) => (
                  <motion.section
                    key={group.competency}
                    custom={i}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-1.5"
                  >
                    {/* Section header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
                        {group.competency}
                      </h3>
                      <CategoryBadge category={group.items[0].category} />
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "question" : "questions"}
                      </span>
                    </div>

                    {/* Questions */}
                    <ul className="space-y-0.5">
                      {group.items.map((entry, j) => {
                        const diff = DIFFICULTY_BADGE[entry.difficulty];
                        return (
                          <li
                            key={`${group.competency}-${j}`}
                            className="group flex items-start gap-2 rounded-md p-2 hover:bg-secondary/40 transition-colors"
                          >
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                            <p className="flex-1 text-[12.5px] leading-relaxed text-foreground/90">
                              {entry.text}
                            </p>
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                  diff.cls
                                )}
                              >
                                {diff.label}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                  entry.mode === "technical"
                                    ? "bg-accent-blue/10 text-accent-blue-foreground"
                                    : "bg-warning/10 text-warning-foreground"
                                )}
                              >
                                {entry.mode === "technical" ? "Tech" : "HR"}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.section>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-border/60 bg-background/95 backdrop-blur-xl space-y-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Questions adapt to your gaps and answers. Your actual interview picks from this bank based on your identified skill gaps.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-10 px-4 text-muted-foreground hover:text-foreground gap-1.5"
              >
                <FilterX className="h-3.5 w-3.5" />
                Reset filters
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
            <Button onClick={handleStartInterview} className="h-10 px-5 gap-1.5">
              <ArrowRight className="h-4 w-4" />
              Start interview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Empty state ─── */
function EmptyState({
  hasSearch,
  onReset,
}: {
  hasSearch: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground mb-3">
        <FilterX className="h-5 w-5" />
      </span>
      <p className="text-[13px] font-medium text-foreground">
        No questions match your filters
      </p>
      <p className="text-[11px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
        {hasSearch
          ? "Try a different search term, or clear your filters to see the full question bank."
          : "Try adjusting or clearing your filters to see more questions."}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="mt-4 h-8 gap-1.5 text-[12px]"
      >
        <FilterX className="h-3.5 w-3.5" />
        Clear all filters
      </Button>
    </div>
  );
}
