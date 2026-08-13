"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon, BrainCircuit, RotateCcw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind, type View } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV: { id: View; label: string }[] = [
  { id: "home", label: "Overview" },
  { id: "candidate", label: "Candidate" },
  { id: "match", label: "Job Match" },
  { id: "gaps", label: "Skill Gaps" },
  { id: "interview", label: "Interview" },
  { id: "readiness", label: "Readiness" },
  { id: "roadmap", label: "Roadmap" },
];

const NAV_REQUIRES_SESSION: View[] = ["candidate", "match", "gaps", "interview", "readiness", "roadmap"];

export function SiteHeader() {
  const { view, setView, sessionId, isDemo, reset, presentationMode, togglePresentationMode } = useHireMind();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/70 border-b border-border/60 pt-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 group"
          aria-label="HireMind AI home"
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            HireMind<span className="text-muted-foreground"> AI</span>
          </span>
          {isDemo && (
            <span className="ml-1 rounded-full bg-warning/15 text-warning-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Demo
            </span>
          )}
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const disabled = NAV_REQUIRES_SESSION.includes(item.id) && !sessionId;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                disabled={disabled}
                onClick={() => setView(item.id)}
                className={cn(
                  "hm-nav-item px-3 py-1.5 rounded-md text-[13px] font-medium transition-all relative",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                )}
              >
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
              <span className="hidden sm:inline">Start over</span>
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

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 -mt-1 no-scrollbar pl-safe pr-safe">
        {NAV.map((item) => {
          const disabled = NAV_REQUIRES_SESSION.includes(item.id) && !sessionId;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => setView(item.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all relative",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground",
                disabled && "opacity-40"
              )}
            >
              {item.label}
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
    <footer className="hm-footer-hide mt-auto border-t border-border/60 bg-background/50 pb-safe">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BrainCircuit className="h-3 w-3" />
          </span>
          <span>
            <span className="text-foreground font-medium">HireMind AI</span> — Assessment support, not an unquestionable hiring verdict.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Prototype indices · AI-assisted evaluation</span>
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
}: {
  value: number;
  size?: number;
  label?: string;
  caption?: string;
  tone?: "neutral" | "success" | "warning" | "critical";
  delay?: number;
}) {
  const [display, setDisplay] = React.useState(0);
  const [glowActive, setGlowActive] = React.useState(true);
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

  // Fade out glow after entrance
  React.useEffect(() => {
    const t = setTimeout(() => setGlowActive(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (display / 100) * c;

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
        {/* Glow layer behind ring */}
        {glowActive && (
          <div
            className="hm-ring-glow"
            style={{
              background: `radial-gradient(circle, color-mix(in oklch, ${toneColor} 12%, transparent), transparent 70%)`,
            }}
          />
        )}
        <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
            opacity={0.6}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={toneColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>
        {/* Shimmer sweep overlay */}
        {shimmerActive && (
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(105deg, transparent 40%, color-mix(in oklch, ${toneColor} 10%, var(--card)) 50%, transparent 60%)`,
                animation: "hm-shimmer 1.6s ease-in-out 1 both",
              }}
            />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold tracking-tight tabular-nums hm-text-gradient">
            {display}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
      {label && (
        <div className="mt-3 text-center">
          <div className="text-sm font-medium text-foreground">{label}</div>
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
  status: "matched" | "weak" | "unknown" | "gap";
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
      : "var(--muted-foreground)";

  // Gradient fill for matched/weak bars
  const background =
    status === "matched"
      ? "linear-gradient(90deg, color-mix(in oklch, var(--success) 85%, var(--accent-blue)), var(--success))"
      : status === "weak"
      ? "linear-gradient(90deg, color-mix(in oklch, var(--warning) 85%, var(--accent-blue)), var(--warning))"
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
