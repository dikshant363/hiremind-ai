"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  MessageSquare,
  Brain,
  CheckCircle2,
  Gauge,
  Map,
  Trophy,
  Wand2,
} from "lucide-react";
import {
  useAchievements,
  type Achievement,
} from "@/hooks/use-achievements";

// ---------------------------------------------------------------------------
// AchievementIcon — renders the correct Lucide icon for a given icon name.
// Defined as a stable component to avoid "creating components during render".
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

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------------------
// AchievementStrip — horizontally scrollable badge row for the home view
// Shows unlocked achievements as filled icons, locked as muted/ghosted.
// Positioned between the hero and the input cards.
// ---------------------------------------------------------------------------

export function AchievementStrip() {
  const { achievements, unlockedCount, mounted } = useAchievements();

  // Don't render until mounted (avoid hydration mismatch with localStorage)
  if (!mounted) return null;

  // Only show if at least one achievement is unlocked
  if (unlockedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 sm:mt-8"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Achievements
        </span>
        <span className="text-[11px] tabular-nums text-accent-blue font-semibold">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {/* Horizontally scrollable on mobile, wraps on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {achievements.map((ach) => (
            <AchievementBadge key={ach.id} achievement={ach} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Individual achievement badge
// ---------------------------------------------------------------------------

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const unlocked = !!achievement.unlockedAt;

  return (
    <motion.div
      layout
      initial={unlocked ? { scale: 0 } : undefined}
      animate={{ scale: 1 }}
      transition={
        unlocked
          ? { type: "spring", stiffness: 500, damping: 25 }
          : { duration: 0.2 }
      }
      title={
        unlocked
          ? `${achievement.label} — ${achievement.description}`
          : `${achievement.label} (locked)`
      }
      className={`
        group relative inline-flex items-center justify-center
        h-8 w-8 rounded-full shrink-0
        transition-all duration-200
        ${
          unlocked
            ? "bg-gradient-to-br from-accent-blue/15 to-success/15 ring-2 ring-accent-blue/30 text-accent-blue cursor-default"
            : "bg-muted/50 text-muted-foreground/40 opacity-40 cursor-default"
        }
      `}
    >
      <AchievementIcon name={achievement.icon} className="h-3.5 w-3.5" />
      {/* Sparkle pulse on newly unlocked */}
      {unlocked && (
        <motion.span
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-accent-blue/20 pointer-events-none"
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AchievementInspector — full list view (for future use, e.g. modal/panel)
// ---------------------------------------------------------------------------

export function AchievementInspector() {
  const { achievements, unlockedCount, mounted } = useAchievements();

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Your achievements</h3>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>
      <div className="grid gap-2">
        {achievements.map((ach) => {
          const unlocked = !!ach.unlockedAt;
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                ${
                  unlocked
                    ? "border-accent-blue/20 bg-accent-blue/5"
                    : "border-border/40 bg-muted/20 opacity-50"
                }
              `}
            >
              <span
                className={`
                  inline-flex h-8 w-8 items-center justify-center rounded-full shrink-0
                  ${
                    unlocked
                      ? "bg-gradient-to-br from-accent-blue/20 to-success/20 text-accent-blue"
                      : "bg-muted text-muted-foreground/40"
                  }
                `}
              >
                <AchievementIcon name={ach.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{ach.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {ach.description}
                </div>
              </div>
              {unlocked && (
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {new Date(ach.unlockedAt!).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
