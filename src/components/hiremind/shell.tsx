"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon, BrainCircuit, RotateCcw, Monitor, HelpCircle, GitCompare, Search, Trophy, Sliders, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind, type View } from "@/lib/store";
import { cn } from "@/lib/utils";

type NavItem = {
  id: View;
  label: string;
  shortLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { id: "home", label: "Overview" },
  { id: "candidate", label: "Candidate" },
  { id: "match", label: "Job Match" },
  { id: "gaps", label: "Skill Gaps", shortLabel: "Gaps" },
  { id: "interview", label: "Interview" },
  { id: "readiness", label: "Readiness" },
  { id: "roadmap", label: "Roadmap" },
  { id: "compare", label: "Compare", shortLabel: "Compare", icon: GitCompare },
];

const NAV_REQUIRES_SESSION: View[] = ["candidate", "match", "gaps", "interview", "readiness", "roadmap"];
/** Compare is gated separately — it needs at least 2 sessions in the DB. */

export function SiteHeader() {
  const { view, setView, sessionId, isDemo, reset, presentationMode, togglePresentationMode, systemConfig, currentUser } = useHireMind();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Platform detection for the ⌘K / Ctrl K hint — only meaningful after mount
  // to avoid SSR/hydration mismatch.
  const isMac = mounted && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

  // Track how many past sessions exist so we can enable the "Compare" nav
  // item only when there are at least two. Re-fetch whenever the active
  // session changes (analyze creates a new one) or the view flips back home.
  const [sessionCount, setSessionCount] = React.useState(0);
  const refreshCount = React.useCallback(async () => {
    try {
      const res = await fetch("/api/session?list=true");
      if (!res.ok) return;
      const data = await res.json();
      setSessionCount(Array.isArray(data.sessions) ? data.sessions.length : 0);
    } catch {
      /* ignore — nav item just stays disabled */
    }
  }, []);
  React.useEffect(() => {
    refreshCount();
  }, [refreshCount, sessionId, view]);

  const brandName = systemConfig?.brandName || "HireMind AI";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/70 border-b border-border/60 pt-safe">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 group"
          aria-label="HireMind AI home"
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            {brandName}
          </span>
          {isDemo && (
            <span className="ml-1 rounded-full bg-warning/15 text-warning-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Demo
            </span>
          )}
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => {
            const requiresSession = NAV_REQUIRES_SESSION.includes(item.id);
            const needsTwoSessions = item.id === "compare";
            const disabled =
              (requiresSession && !sessionId) || (needsTwoSessions && sessionCount < 2);
            const active = view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                disabled={disabled}
                onClick={() => setView(item.id)}
                title={
                  needsTwoSessions && sessionCount < 2
                    ? "Run at least two analyses to unlock Compare"
                    : undefined
                }
                className={cn(
                  "hm-nav-item px-3 py-1.5 rounded-md text-[13px] font-medium transition-all relative inline-flex items-center gap-1.5",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {item.label}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-3 rounded-full bg-accent-blue transition-all duration-300" />}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {presentationMode && (
            <span className="rounded-full bg-accent-blue/12 text-accent-blue-foreground px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest">
              Presentation Mode
            </span>
          )}
          {sessionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden 2xl:inline">Start over</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle presentation mode"
            onClick={togglePresentationMode}
            className={cn("h-8 w-8", presentationMode && "bg-accent-blue/15 text-accent-blue-foreground")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Open command palette"
            onClick={() => document.dispatchEvent(new CustomEvent("hm-open-command-palette"))}
            className="h-8 gap-2 border-border/60 px-2.5 text-muted-foreground hover:text-foreground"
            title="Search commands (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden text-[12px] font-medium 2xl:inline">Search commands…</span>
            <kbd className="hidden items-center rounded border border-border bg-muted px-1 py-0 text-[9px] font-mono font-medium text-muted-foreground 2xl:inline-flex">
              {mounted && !isMac ? "Ctrl K" : "⌘K"}
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show achievements gallery"
            onClick={() => document.dispatchEvent(new CustomEvent("hm-show-achievements"))}
            className="h-8 w-8 relative group"
          >
            <Trophy className="h-4 w-4" />
            {/* Subtle pulse dot to hint at discoverability */}
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 opacity-60 group-hover:opacity-0 transition-opacity" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show keyboard shortcuts"
            onClick={() => document.dispatchEvent(new CustomEvent("hm-show-shortcuts"))}
            className="h-8 w-8 relative group"
          >
            <HelpCircle className="h-4 w-4" />
            {/* Subtle pulse dot to hint at discoverability */}
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent-blue opacity-60 group-hover:opacity-0 transition-opacity" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Control Center"
            title="Open Control Center (Admin)"
            onClick={() => document.dispatchEvent(new CustomEvent("hm-open-control-center"))}
            className="h-8 w-8 relative group"
          >
            <Sliders className="h-4 w-4" />
          </Button>
          <Button
            variant={currentUser ? "secondary" : "ghost"}
            size="sm"
            aria-label="User account"
            onClick={() => document.dispatchEvent(new CustomEvent("hm-open-auth"))}
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-medium">
              {currentUser ? (currentUser.name || currentUser.email.split("@")[0]) : "Sign In"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile nav — gap-0 + flex-1 distributes tabs evenly; whitespace-nowrap
          keeps each label on one line. 'Gaps' shortLabel prevents "Skill Gaps"
          from wrapping/clipping at 375px width. px-0.5 keeps all 7 tabs visible
          inside the 375px viewport without horizontal scroll. */}
      <nav className="lg:hidden flex items-center gap-0 overflow-x-auto px-2 pb-2 -mt-1 no-scrollbar pl-safe pr-safe">
        {NAV.map((item) => {
          const requiresSession = NAV_REQUIRES_SESSION.includes(item.id);
          const needsTwoSessions = item.id === "compare";
          const disabled =
            (requiresSession && !sessionId) || (needsTwoSessions && sessionCount < 2);
          const active = view === item.id;
          return (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => setView(item.id)}
              className={cn(
                "flex-1 min-w-0 whitespace-nowrap px-0.5 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all relative text-center inline-flex items-center justify-center gap-0.5",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground",
                disabled && "opacity-40"
              )}
            >
              {item.shortLabel ?? item.label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-accent-blue" />}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="hm-footer-hide mt-auto bg-background/50 pb-safe relative overflow-hidden">
      {/* Animated gradient line at the top */}
      <div className="hm-footer-gradient-line" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-4 sm:py-5 flex flex-col gap-3 text-[13px] text-muted-foreground">
        {/* Top row: brand + version + pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BrainCircuit className="h-3 w-3" />
            </span>
            <span className="text-foreground font-medium">HireMind AI</span>
            <span className="inline-flex items-center rounded-full bg-primary/12 text-primary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              v1.0
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="hm-glass-chip inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium">
              Adaptive Interview
            </span>
            <span className="hm-glass-chip inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium">
              Deterministic Scoring
            </span>
            <span className="hm-glass-chip inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium">
              Evidence-Based
            </span>
          </div>
        </div>

        {/* Bottom row: disclaimer + links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border/40 pt-3">
          <span>
            Assessment support, not an unquestionable hiring verdict. Prototype indices · AI-assisted evaluation.
          </span>
          <div className="flex items-center gap-3 text-[12px]">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("hm-show-about"))}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("hm-show-shortcuts"))}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
            >
              Keyboard shortcuts
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Premium score ring — animated count-up with glow + shimmer. */
export function ScoreRing({
  value,
  size = 168,
  label,
  caption,
  tone = "neutral",
  delay = 0,
  labelExtra,
}: {
  value: number;
  size?: number;
  label?: string;
  caption?: string;
  tone?: "neutral" | "success" | "warning" | "critical";
  delay?: number;
  labelExtra?: React.ReactNode;
}) {
  const [display, setDisplay] = React.useState(0);
  const [shimmerActive, setShimmerActive] = React.useState(false);

  React.useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Math.max(0, Math.min(100, value));
    const dur = 1100; // slightly longer for smoother feel
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // Overshoot easing: cubic with slight spring past target
      const eased = p < 0.85
        ? 1 - Math.pow(1 - p / 0.85, 3) * 1
        : 1 + 0.02 * Math.sin(((p - 0.85) / 0.15) * Math.PI);
      setDisplay(Math.round(from + (to - from) * Math.min(1.01, eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setDisplay(to);
        // Trigger shimmer after animation completes
        setTimeout(() => setShimmerActive(true), 200);
      }
    };
    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [value, delay]);

  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (display / 100) * c;

  // Use a stable, unique gradient id so multiple ScoreRings on a page don't clash
  const gradientId = React.useId().replace(/:/g, "");

  const toneColor =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
      ? "var(--warning)"
      : tone === "critical"
      ? "var(--critical)"
      : "var(--accent-blue)";

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow layer behind ring — plays a 1.4s entrance radiance, then
            settles into a subtle 4s breathing pulse so the ring always
            feels "alive" even when idle. Uses the .hm-ring-glow-breathe
            utility class which chains both animations. */}
        <div
          className="hm-ring-glow-breathe"
          style={{
            background: `radial-gradient(circle, color-mix(in oklch, ${toneColor} 12%, transparent), transparent 70%)`,
          }}
        />
        <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
          <defs>
            {/* Gradient fade — full color at the arc start, fading to a softer
                tone toward the arc end so the transition into the muted track
                feels continuous (no hard "Pac-Man" gap). */}
            <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={toneColor} stopOpacity={1} />
              <stop offset="55%" stopColor={toneColor} stopOpacity={0.92} />
              <stop offset="100%" stopColor={toneColor} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          {/* Track — full closed circle, slightly muted */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
            opacity={0.55}
          />
          {/* Progress arc — uses gradient stroke + rounded linecap for soft ends */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>
        {/* Shimmer sweep overlay — first sweep fires ~200ms after the count-up
            completes, then repeats on a 5s cycle using hm-shimmer-periodic
            (1.6s sweep + 3.4s idle). Adds premium "alive" sheen. */}
        {shimmerActive && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(105deg, transparent 40%, color-mix(in oklch, ${toneColor} 10%, var(--card)) 50%, transparent 60%)`,
                animation: "hm-shimmer-periodic 5s ease-in-out infinite",
              }}
            />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
          <span className="text-5xl font-semibold tracking-tight tabular-nums hm-text-gradient leading-none">
            {display}
          </span>
          <span className="text-xs text-muted-foreground leading-none mt-1">/ 100</span>
        </div>
      </div>
      {label && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center justify-center gap-2 flex-wrap">
            <div className="text-sm font-medium text-foreground">{label}</div>
            {labelExtra}
          </div>
          {caption && <div className="text-xs text-muted-foreground mt-0.5">{caption}</div>}
        </div>
      )}
    </div>
  );
}

/** Premium horizontal competency bar with gradient fill + micro-shine. */
export function CompetencyBar({
  label,
  value,
  status,
  rightLabel,
  index = 0,
}: {
  label: string;
  value: number; // 0..1
  status: "matched" | "weak" | "unknown" | "gap" | "accent";
  rightLabel?: string;
  index?: number;
}) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    // Staggered entrance: each bar appears 50ms after the previous
    const t = setTimeout(() => setW(Math.max(0.04, Math.min(1, value))), 60 + index * 50);
    return () => clearTimeout(t);
  }, [value, index]);

  const color =
    status === "matched"
      ? "var(--success)"
      : status === "weak"
      ? "var(--warning)"
      : status === "gap"
      ? "var(--critical)"
      : status === "accent"
      ? "var(--accent-blue)"
      : "var(--muted-foreground)";

  // Gradient fill for matched/weak/accent bars
  const background =
    status === "matched"
      ? "linear-gradient(90deg, color-mix(in oklch, var(--success) 85%, var(--accent-blue)), var(--success))"
      : status === "weak"
      ? "linear-gradient(90deg, color-mix(in oklch, var(--warning) 85%, var(--accent-blue)), var(--warning))"
      : status === "accent"
      ? "linear-gradient(90deg, color-mix(in oklch, var(--accent-blue) 80%, var(--success)), var(--accent-blue))"
      : color;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium text-foreground">{label}</span>
          {rightLabel && <span className="text-muted-foreground tabular-nums">{rightLabel}</span>}
        </div>
      )}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden hm-bar-shine">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${w * 100}%`, background, opacity: status === "unknown" ? 0.5 : 1 }}
        />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: "matched" | "weak" | "unknown" | "gap" }) {
  const map = {
    matched: { label: "Matched", className: "bg-success/15 text-success-foreground" },
    weak: { label: "Weak", className: "bg-warning/15 text-warning-foreground" },
    unknown: { label: "Unknown", className: "bg-muted text-muted-foreground" },
    gap: { label: "Gap", className: "bg-critical/15 text-critical-foreground" },
  } as const;
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", s.className)}>
      {s.label}
    </span>
  );
}

/* ----------------------------------------------------------------------------
 * AnimatedCounter — spring count-up for numeric score displays.
 * Cubic ease-out with a subtle sine overshoot near the end. Delayed start so
 * multiple counters on the same view can stagger. Supports an optional suffix
 * (e.g. "%" or "/100") and an optional className for typography styling.
 * ------------------------------------------------------------------------- */
export function AnimatedCounter({
  value,
  delay = 0,
  duration = 900,
  className,
}: {
  value: number;
  delay?: number; // seconds before animation starts
  duration?: number; // milliseconds
  className?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  React.useEffect(() => {
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const to = Math.max(0, Math.min(1000, value));
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // Cubic ease-out + tiny sine overshoot at the very end for a springy feel
      const eased =
        p < 0.92
          ? 1 - Math.pow(1 - p / 0.92, 3)
          : 1 + 0.012 * Math.sin(((p - 0.92) / 0.08) * Math.PI);
      setDisplay(Math.round(to * Math.min(1.005, eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration]);

  return <span className={cn("font-semibold tabular-nums hm-num-tabular", className)}>{display}</span>;
}

export function PriorityPill({ priority }: { priority: "critical" | "high" | "medium" | "low" }) {
  const map = {
    critical: { label: "Critical", className: "bg-critical/15 text-critical-foreground" },
    high: { label: "High", className: "bg-warning/20 text-warning-foreground" },
    medium: { label: "Medium", className: "bg-muted text-muted-foreground" },
    low: { label: "Low", className: "bg-muted text-muted-foreground" },
  } as const;
  const s = map[priority];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
      s.className,
      priority === "critical" && "hm-pulse-critical"
    )}>
      {s.label}
    </span>
  );
}
