"use client";

import * as React from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Achievement types
// ---------------------------------------------------------------------------

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  unlockedAt: string | null; // ISO timestamp when unlocked
}

// ---------------------------------------------------------------------------
// Achievement definitions (single source of truth)
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DEFS: Achievement[] = [
  {
    id: "first_analysis",
    label: "First Analysis",
    description: "You analyzed your first resume",
    icon: "Sparkles",
    unlockedAt: null,
  },
  {
    id: "gap_identified",
    label: "Gap Hunter",
    description: "You identified your biggest skill gap",
    icon: "Target",
    unlockedAt: null,
  },
  {
    id: "first_interview",
    label: "Interview Ready",
    description: "You started your first adaptive interview",
    icon: "MessageSquare",
    unlockedAt: null,
  },
  {
    id: "answer_submitted",
    label: "Deep Thinker",
    description: "You submitted your first interview answer",
    icon: "Brain",
    unlockedAt: null,
  },
  {
    id: "interview_complete",
    label: "Interview Complete",
    description: "You completed a full adaptive interview",
    icon: "CheckCircle2",
    unlockedAt: null,
  },
  {
    id: "readiness_calculated",
    label: "Readiness Revealed",
    description: "You computed your job readiness index",
    icon: "Gauge",
    unlockedAt: null,
  },
  {
    id: "roadmap_generated",
    label: "Path Forward",
    description: "You generated your improvement roadmap",
    icon: "Map",
    unlockedAt: null,
  },
  {
    id: "high_score",
    label: "Strong Performer",
    description: "You scored 70+ on an interview answer",
    icon: "Trophy",
    unlockedAt: null,
  },
  {
    id: "demo_complete",
    label: "Demo Explorer",
    description: "You completed the full demo flow",
    icon: "Wand2",
    unlockedAt: null,
  },
];

// ---------------------------------------------------------------------------
// localStorage key
// ---------------------------------------------------------------------------

const LS_KEY = "hiremind-achievements";

interface UnlockedMap {
  [id: string]: string; // id -> ISO timestamp
}

function loadUnlocked(): UnlockedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUnlocked(map: UnlockedMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // localStorage full or unavailable — degrade silently
  }
}

// ---------------------------------------------------------------------------
// Icon resolver — maps string names to Lucide components
// ---------------------------------------------------------------------------

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

export function getAchievementIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] ?? Sparkles;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAchievements() {
  const [unlockedMap, setUnlockedMap] = React.useState<UnlockedMap>({});
  const [recentlyUnlocked, setRecentlyUnlocked] = React.useState<Achievement | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    setUnlockedMap(loadUnlocked());
    setMounted(true);
  }, []);

  // Build the full achievements array with unlock status
  const achievements: Achievement[] = React.useMemo(() => {
    return ACHIEVEMENT_DEFS.map((def) => ({
      ...def,
      unlockedAt: unlockedMap[def.id] ?? null,
    }));
  }, [unlockedMap]);

  const unlock = React.useCallback(
    (id: string) => {
      // Only unlock valid, not-yet-unlocked achievements
      if (!ACHIEVEMENT_DEFS.some((d) => d.id === id)) return;
      if (unlockedMap[id]) return;

      const now = new Date().toISOString();
      setUnlockedMap((prev) => {
        const next = { ...prev, [id]: now };
        saveUnlocked(next);
        return next;
      });

      // Set the recently unlocked for toast
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === id)!;
      const unlocked: Achievement = { ...def, unlockedAt: now };
      setRecentlyUnlocked(unlocked);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setRecentlyUnlocked((prev) => (prev?.id === id ? null : prev));
      }, 4000);

      // Fire the Sonner toast
      const Icon = getAchievementIcon(def.icon);
      toast.custom(
        (t) => (
          <div
            className="hm-achievement-toast"
            onClick={() => toast.dismiss(t)}
          >
            <div className="hm-achievement-toast-glow" />
            <div className="hm-achievement-toast-content">
              <span className="hm-achievement-toast-icon">
                <Icon className="h-4 w-4" />
              </span>
              <div className="hm-achievement-toast-text">
                <span className="hm-achievement-toast-label">{def.label}</span>
                <span className="hm-achievement-toast-desc">{def.description}</span>
              </div>
              <div className="hm-achievement-toast-sparkle">
                <Sparkles className="h-3 w-3" />
              </div>
            </div>
          </div>
        ),
        { duration: 4000, id: `achievement-${id}` }
      );
    },
    [unlockedMap]
  );

  const dismissRecent = React.useCallback(() => {
    setRecentlyUnlocked(null);
  }, []);

  const unlockedCount = React.useMemo(
    () => Object.keys(unlockedMap).length,
    [unlockedMap]
  );

  return {
    achievements,
    unlock,
    recentlyUnlocked,
    dismissRecent,
    unlockedCount,
    mounted,
  };
}
