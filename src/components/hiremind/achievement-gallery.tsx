"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Lock,
  X,
  Award,
  Sparkles,
  Target,
  MessageSquare,
  Brain,
  CheckCircle2,
  Gauge,
  Map,
  Wand2,
} from "lucide-react";
import {
  useAchievements,
  getAchievementIcon,
  ACHIEVEMENT_DEFS,
  type Achievement,
} from "@/hooks/use-achievements";
import { Progress } from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// Icon map (re-declared locally to avoid import issues)
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Target,
  MessageSquare,
  Brain,
  CheckCircle2,
  Gauge,
  Map,
  Trophy,
  Wand2,
};

function AchievementIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------------------
// Achievement categories (derived from id prefix)
// ---------------------------------------------------------------------------

type Category = "getting-started" | "interview" | "scoring" | "exploration";

const CATEGORY_MAP: Record<string, Category> = {
  first_analysis: "getting-started",
  gap_identified: "getting-started",
  first_interview: "interview",
  answer_submitted: "interview",
  interview_complete: "interview",
  readiness_calculated: "scoring",
  roadmap_generated: "scoring",
  high_score: "scoring",
  demo_complete: "exploration",
};

const CATEGORY_META: Record<
  Category,
  { label: string; color: string; bgColor: string }
> = {
  "getting-started": {
    label: "Getting Started",
    color: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
  },
  interview: {
    label: "Interview",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  scoring: {
    label: "Scoring",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  exploration: {
    label: "Exploration",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
};

function getCategory(id: string): Category {
  return CATEGORY_MAP[id] ?? "exploration";
}

// ---------------------------------------------------------------------------
// AchievementGallery — full-screen modal with premium glassmorphism cards
// ---------------------------------------------------------------------------

export function AchievementGallery({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { achievements, unlockedCount, mounted } = useAchievements();

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  // Don't render anything until localStorage is hydrated
  if (!mounted) return null;

  const total = achievements.length;
  const progressPct = total > 0 ? (unlockedCount / total) * 100 : 0;

  // Group unlocked vs locked
  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dark overlay with blur */}
          <motion.div
            key="ag-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-foreground/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Gallery panel */}
          <motion.div
            key="ag-panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-3 sm:p-6 pointer-events-none"
          >
            <div className="w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto rounded-2xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* ─── Header ─── */}
              <div className="shrink-0 px-6 pt-6 pb-4 border-b border-white/8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 ring-1 ring-amber-400/30 text-amber-400">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-white tracking-tight">
                        Achievement Gallery
                      </h2>
                      <p className="text-[12px] text-white/50">
                        Track your milestones across HireMind AI
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close achievement gallery"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-white/80">
                      {unlockedCount} of {total} achievements unlocked
                    </span>
                    <span className="text-[12px] tabular-nums text-amber-400 font-semibold">
                      {Math.round(progressPct)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.2,
                      }}
                    />
                  </div>
                  {/* Category legend */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(
                      Object.entries(CATEGORY_META) as [
                        Category,
                        (typeof CATEGORY_META)[Category],
                      ][]
                    ).map(([cat, meta]) => {
                      const catCount = achievements.filter(
                        (a) => getCategory(a.id) === cat
                      ).length;
                      const catUnlocked = achievements.filter(
                        (a) => getCategory(a.id) === cat && a.unlockedAt
                      ).length;
                      return (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.bgColor} ${meta.color}`}
                        >
                          {catUnlocked}/{catCount} {meta.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ─── Achievement grid (scrollable) ─── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain custom-scrollbar-dark">
                {unlocked.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                        Unlocked
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unlocked.map((ach, i) => (
                        <UnlockedCard key={ach.id} achievement={ach} index={i} />
                      ))}
                    </div>
                  </div>
                )}
                {locked.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                        Locked
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {locked.map((ach, i) => (
                        <LockedCard
                          key={ach.id}
                          achievement={ach}
                          index={i}
                          totalUnlocked={unlocked.length}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Footer hint ─── */}
              <div className="shrink-0 px-6 py-3 border-t border-white/8">
                <p className="text-[11px] text-white/30 text-center">
                  Press{" "}
                  <kbd className="inline-flex rounded border border-white/15 bg-white/5 px-1.5 py-0 text-[10px] font-mono text-white/50">
                    A
                  </kbd>{" "}
                  or{" "}
                  <kbd className="inline-flex rounded border border-white/15 bg-white/5 px-1.5 py-0 text-[10px] font-mono text-white/50">
                    Esc
                  </kbd>{" "}
                  to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Unlocked card — full color with shimmer/glow
// ---------------------------------------------------------------------------

function UnlockedCard({
  achievement,
  index,
}: {
  achievement: Achievement;
  index: number;
}) {
  const category = getCategory(achievement.id);
  const catMeta = CATEGORY_META[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative rounded-xl border border-white/12 bg-white/[0.04] backdrop-blur-sm p-4 overflow-hidden"
    >
      {/* Shimmer sweep overlay — premium sheen animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(251,191,36,0.06) 50%, transparent 60%)",
            animation: "hm-shimmer-periodic 6s ease-in-out infinite",
            animationDelay: `${index * 0.3}s`,
          }}
        />
      </div>

      {/* Glow behind icon */}
      <div className="absolute -top-2 -left-2 h-16 w-16 rounded-full bg-amber-400/8 blur-xl pointer-events-none" />

      {/* Category tag */}
      <span
        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${catMeta.bgColor} ${catMeta.color} mb-3`}
      >
        {catMeta.label}
      </span>

      {/* Icon + title */}
      <div className="flex items-start gap-3 mb-2">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 ring-1 ring-amber-400/25 text-amber-400">
          <AchievementIcon name={achievement.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-white leading-tight">
            {achievement.label}
          </h3>
          <p className="text-[11px] text-white/50 mt-0.5 leading-snug">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Unlock date */}
      {achievement.unlockedAt && (
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/6">
          <Sparkles className="h-3 w-3 text-amber-400/60" />
          <span className="text-[10px] text-white/35 tabular-nums">
            Unlocked{" "}
            {new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Locked card — desaturated/dimmed with lock overlay
// ---------------------------------------------------------------------------

function LockedCard({
  achievement,
  index,
  totalUnlocked,
}: {
  achievement: Achievement;
  index: number;
  totalUnlocked: number;
}) {
  const category = getCategory(achievement.id);
  const catMeta = CATEGORY_META[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: (totalUnlocked + index) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative rounded-xl border border-white/6 bg-white/[0.02] backdrop-blur-sm p-4 overflow-hidden"
    >
      {/* Lock overlay — subtle diagonal hatch */}
      <div className="absolute inset-0 bg-white/[0.015] pointer-events-none" />

      {/* Category tag — dimmed */}
      <span
        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${catMeta.bgColor} ${catMeta.color} opacity-40 mb-3`}
      >
        {catMeta.label}
      </span>

      {/* Icon + title with lock overlay */}
      <div className="flex items-start gap-3 mb-2">
        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/20">
          <AchievementIcon name={achievement.icon} className="h-5 w-5" />
          {/* Lock icon overlay */}
          <span className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-white/30 ring-1 ring-white/10">
            <Lock className="h-2.5 w-2.5" />
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-medium text-white/40 leading-tight">
            {achievement.label}
          </h3>
          <p className="text-[11px] text-white/25 mt-0.5 leading-snug">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Teaser */}
      <div className="mt-3 pt-2 border-t border-white/4">
        <span className="text-[10px] text-white/20 italic">
          Keep exploring to unlock
        </span>
      </div>
    </motion.div>
  );
}
