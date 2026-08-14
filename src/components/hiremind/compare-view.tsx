"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind, type Comparison, type ComparisonSession } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------------
 * Types & helpers
 * ------------------------------------------------------------------------- */

interface SessionListItem {
  id: string;
  isDemo: boolean;
  status: string;
  createdAt: string;
  jobTitle: string;
  candidateName: string | null;
  matchIndex: number | null;
  readinessIndex: number | null;
}

type MetricKey = "match" | "readiness" | "gaps" | "interview";

interface MetricSpec {
  key: MetricKey;
  label: string;
  /** "higher" is better, or "lower" is better. */
  direction: "higher" | "lower";
  /** Suffix unit, e.g. "/ 100" or "" for counts. */
  unit?: string;
  /** Short helper caption shown under the label. */
  caption: string;
}

const METRICS: MetricSpec[] = [
  {
    key: "match",
    label: "Match Index",
    direction: "higher",
    unit: "",
    caption: "Prototype Job Match Index",
  },
  {
    key: "readiness",
    label: "Readiness Index",
    direction: "higher",
    unit: "",
    caption: "Prototype Job Readiness Index",
  },
  {
    key: "gaps",
    label: "Skill Gaps",
    direction: "lower",
    unit: "",
    caption: "Open competency gaps",
  },
  {
    key: "interview",
    label: "Avg Interview Score",
    direction: "higher",
    unit: "",
    caption: "Average of evaluation.overall",
  },
];

import { formatDeterministicDate } from "@/lib/utils";

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDeterministicDate(iso);
}

function shortDate(iso: string): string {
  return formatDeterministicDate(iso);
}

function valueForMetric(session: ComparisonSession, key: MetricKey): number | null {
  switch (key) {
    case "match":
      return session.matchIndex;
    case "readiness":
      return session.readinessIndex;
    case "gaps":
      return session.gapCount;
    case "interview":
      return session.interviewScore;
  }
}

function deltaForMetric(comparison: Comparison, key: MetricKey): number | null {
  switch (key) {
    case "match":
      return comparison.deltas.matchDelta;
    case "readiness":
      return comparison.deltas.readinessDelta;
    case "gaps":
      // gapDelta is `a.gapCount - b.gapCount` — positive = improvement (fewer in b).
      return comparison.deltas.gapDelta;
    case "interview":
      return comparison.deltas.interviewScoreDelta;
  }
}

/**
 * Returns "a" | "b" | "tie" — which session has the better value for this metric.
 */
function betterSideForMetric(
  a: number | null,
  b: number | null,
  direction: "higher" | "lower"
): "a" | "b" | "tie" {
  if (a === null && b === null) return "tie";
  if (a === null) return "b";
  if (b === null) return "a";
  if (a === b) return "tie";
  if (direction === "higher") return a > b ? "a" : "b";
  return a < b ? "a" : "b";
}

/* ----------------------------------------------------------------------------
 * AnimatedCounter — spring count-up for metric values
 * ------------------------------------------------------------------------- */

function AnimatedCounter({
  value,
  delay = 0,
  duration = 900,
  className,
}: {
  value: number;
  delay?: number;
  duration?: number;
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
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // Ease-out cubic with subtle overshoot near the end
      const eased = p < 0.92 ? 1 - Math.pow(1 - p / 0.92, 3) : 1 + 0.012 * Math.sin(((p - 0.92) / 0.08) * Math.PI);
      setDisplay(Math.round(value * Math.min(1.005, eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, started, duration]);

  return <span className={cn("tabular-nums", className)}>{display}</span>;
}

/* ----------------------------------------------------------------------------
 * DeltaArrow — spring-popped arrow with color-coded direction
 * ------------------------------------------------------------------------- */

function DeltaArrow({
  delta,
  direction,
  delay = 0,
}: {
  delta: number | null;
  direction: "higher" | "lower";
  delay?: number;
}) {
  if (delta === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground/60">
        <Minus className="h-3.5 w-3.5" strokeWidth={2.2} />
        <span className="text-[10px] font-medium tabular-nums">n/a</span>
      </div>
    );
  }

  // A "positive" improvement depends on direction. For "higher is better"
  // metrics, a positive delta = improvement. For "lower is better" metrics
  // (gaps), a positive gapDelta (= fewer gaps in B) is ALSO an improvement,
  // but the visible number on the right went DOWN — so we want a green DOWN arrow.
  const isImprovement = delta > 0;
  const isRegression = delta < 0;

  // For "higher is better": improvement shows ↑, regression shows ↓.
  // For "lower is better" (gaps): improvement shows ↓ (number went down),
  // regression shows ↑ (number went up).
  const arrowUp = direction === "higher" ? isImprovement : isRegression;

  const tone = isImprovement
    ? "text-success-foreground"
    : isRegression
    ? "text-critical-foreground"
    : "text-muted-foreground";

  const arrow = delta === 0 ? <Minus className="h-4 w-4" strokeWidth={2.4} /> : arrowUp ? <ArrowUp className="h-4 w-4" strokeWidth={2.4} /> : <ArrowDown className="h-4 w-4" strokeWidth={2.4} />;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 520,
        damping: 18,
        mass: 0.7,
        delay,
      }}
      className={cn("flex flex-col items-center justify-center gap-0.5", tone)}
    >
      {arrow}
      <span className="text-[11px] font-semibold tabular-nums leading-none">
        {delta > 0 ? "+" : ""}
        {Math.abs(delta) > 0 ? delta : 0}
      </span>
    </motion.div>
  );
}

/* ----------------------------------------------------------------------------
 * SessionPicker — dropdown / list picker for selecting a session
 * ------------------------------------------------------------------------- */

function SessionPicker({
  label,
  sessions,
  selectedId,
  onSelect,
  excludeId,
}: {
  label: string;
  sessions: SessionListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  excludeId?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = sessions.find((s) => s.id === selectedId) || null;
  const available = sessions.filter((s) => s.id !== excludeId);

  return (
    <div ref={ref} className="relative">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
        {label}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full hm-elevated rounded-xl px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors",
          "hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
          selected && "ring-1 ring-accent-blue/30"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            {selected?.isDemo ? <Sparkles className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0">
            {selected ? (
              <>
                <div className="text-[13px] font-medium truncate">{selected.jobTitle}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-2.5 w-2.5" />
                  {shortDate(selected.createdAt)}
                  {selected.matchIndex !== null && (
                    <>
                      <span>·</span>
                      <span className="tabular-nums">Match {selected.matchIndex}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-[13px] text-muted-foreground">Pick a session…</div>
            )}
          </div>
        </div>
        <span className={cn("text-muted-foreground transition-transform", open && "rotate-180")}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full hm-card rounded-xl p-1.5 max-h-72 overflow-y-auto"
          >
            {available.length === 0 ? (
              <div className="px-2.5 py-3 text-[12px] text-muted-foreground text-center">
                No other sessions available.
              </div>
            ) : (
              available.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelect(s.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-2.5 py-2 flex items-center gap-2.5 hover:bg-secondary/70 transition-colors",
                    s.id === selectedId && "bg-secondary/60"
                  )}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    {s.isDemo ? <Sparkles className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium truncate">{s.jobTitle}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {relativeTime(s.createdAt)}
                    </div>
                  </div>
                  {s.matchIndex !== null && (
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      Match {s.matchIndex}
                    </span>
                  )}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Picker state — empty / loading / picker UI
 * ------------------------------------------------------------------------- */

function PickerState({ sessions }: { sessions: SessionListItem[] }) {
  const { loadComparison, loadingComparison } = useHireMind();
  const [aId, setAId] = React.useState<string | null>(null);
  const [bId, setBId] = React.useState<string | null>(null);

  // Pre-select the two most recent sessions for convenience. The list endpoint
  // returns newest-first, so:
  //   - A (Earlier) = sessions[1] (the older of the two)
  //   - B (Later)   = sessions[0] (the newest)
  React.useEffect(() => {
    if (sessions.length >= 2 && !aId && !bId) {
      setAId(sessions[1].id);
      setBId(sessions[0].id);
    }
  }, [sessions, aId, bId]);

  const canCompare = aId && bId && aId !== bId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="hm-card hm-card-hover p-5 sm:p-8"
    >
      <div className="flex items-center gap-2 mb-5">
        <GitCompare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pick two sessions to compare
        </h3>
      </div>
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-3 items-end">
        <SessionPicker
          label="Earlier session (A)"
          sessions={sessions}
          selectedId={aId}
          onSelect={setAId}
          excludeId={bId}
        />
        <div className="hidden md:flex items-center justify-center pb-2.5">
          <GitCompare className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <SessionPicker
          label="Later session (B)"
          sessions={sessions}
          selectedId={bId}
          onSelect={setBId}
          excludeId={aId}
        />
      </div>
      <div className="mt-6 flex items-center justify-end">
        <Button
          onClick={() => canCompare && loadComparison(aId!, bId!)}
          disabled={!canCompare || loadingComparison}
          className="gap-2"
        >
          {loadingComparison ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Comparing…
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4" />
              Compare sessions
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        Tip: pick an older attempt and a newer one to see how you&apos;ve grown over time.
      </p>
    </motion.div>
  );
}

/* ----------------------------------------------------------------------------
 * Metric value cell — left or right side, with optional "better side" tint
 * ------------------------------------------------------------------------- */

function MetricValueCell({
  value,
  unit,
  isBetter,
  delay,
  align,
}: {
  value: number | null;
  unit?: string;
  isBetter: boolean;
  delay: number;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl px-3 py-4 sm:px-4 sm:py-5 transition-colors",
        isBetter && "hm-better-side"
      )}
      style={align === "right" ? { textAlign: "right" } : { textAlign: "left" }}
    >
      {value === null ? (
        <div className="flex flex-col items-center md:items-stretch text-muted-foreground/60">
          <span className="text-3xl sm:text-4xl font-semibold tracking-tight leading-none">—</span>
          <span className="text-[10px] uppercase tracking-wider mt-1">Not available</span>
        </div>
      ) : (
        <div className={cn("flex flex-col", align === "right" ? "items-end" : "items-start")}>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter
              value={value}
              delay={delay}
              className="text-3xl sm:text-4xl font-semibold tracking-tight hm-text-gradient leading-none"
            />
            {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
          </div>
          {isBetter && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/15 text-success-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
              <Trophy className="h-2.5 w-2.5" /> Better
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Metric row (desktop) — [left value | delta arrow | right value]
 * ------------------------------------------------------------------------- */

function MetricRow({
  spec,
  comparison,
  index,
}: {
  spec: MetricSpec;
  comparison: Comparison;
  index: number;
}) {
  const a = valueForMetric(comparison.a, spec.key);
  const b = valueForMetric(comparison.b, spec.key);
  const delta = deltaForMetric(comparison, spec.key);
  const better = betterSideForMetric(a, b, spec.direction);

  const baseDelay = 0.15 + index * 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: baseDelay, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-[1fr_72px_1fr] items-stretch gap-2 sm:gap-3"
    >
      <MetricValueCell
        value={a}
        unit={spec.unit}
        isBetter={better === "a"}
        delay={baseDelay + 0.05}
        align="left"
      />
      <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-secondary/40 px-2 py-2">
        <DeltaArrow delta={delta} direction={spec.direction} delay={baseDelay + 0.1} />
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider text-center leading-tight hidden sm:block">
          {spec.label.split(" ")[0]}
        </div>
      </div>
      <MetricValueCell
        value={b}
        unit={spec.unit}
        isBetter={better === "b"}
        delay={baseDelay + 0.15}
        align="right"
      />
    </motion.div>
  );
}

/* ----------------------------------------------------------------------------
 * Session column header — job title + date + demo badge
 * ------------------------------------------------------------------------- */

function SessionColumnHeader({
  session,
  side,
  delay,
}: {
  session: ComparisonSession;
  side: "a" | "b";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "flex flex-col gap-1 px-3 sm:px-4 py-3 rounded-xl",
        side === "a" ? "items-start" : "items-end"
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-md text-[9px] font-bold",
            side === "a" ? "bg-muted text-muted-foreground" : "bg-accent-blue/15 text-accent-blue-foreground"
          )}
        >
          {side.toUpperCase()}
        </span>
        {session.isDemo && (
          <span className="rounded-full bg-warning/15 text-warning-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase">
            Demo
          </span>
        )}
      </div>
      <div className="text-[14px] sm:text-[15px] font-semibold tracking-tight text-foreground line-clamp-2">
        {session.jobTitle}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Calendar className="h-2.5 w-2.5" />
        {shortDate(session.createdAt)}
        <span>·</span>
        <span>{relativeTime(session.createdAt)}</span>
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------------------------------
 * Top gaps pill chips
 * ------------------------------------------------------------------------- */

function TopGapsChips({
  gaps,
  side,
  delay,
}: {
  gaps: string[];
  side: "a" | "b";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("px-3 sm:px-4 py-3", side === "b" && "text-right")}
    >
      <div
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2",
          side === "b" && "text-right"
        )}
      >
        Top {Math.min(3, gaps.length || 0)} gaps
      </div>
      {gaps.length === 0 ? (
        <div className="text-[12px] text-muted-foreground/70 italic">No gaps recorded.</div>
      ) : (
        <div
          className={cn(
            "flex flex-wrap gap-1.5",
            side === "b" && "md:justify-end"
          )}
        >
          {gaps.map((g, i) => (
            <motion.span
              key={`${g}-${i}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: delay + 0.05 + i * 0.05 }}
              className="inline-flex items-center gap-1 rounded-full bg-critical/10 text-critical-foreground px-2.5 py-1 text-[11px] font-medium"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {g}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ----------------------------------------------------------------------------
 * Growth story callout — summary at the bottom
 * ------------------------------------------------------------------------- */

function GrowthStory({ comparison }: { comparison: Comparison }) {
  const { a, b, deltas } = comparison;

  // Build a natural-language summary of the deltas.
  const segments: string[] = [];

  if (deltas.matchDelta !== null && deltas.matchDelta !== 0) {
    if (deltas.matchDelta > 0) {
      segments.push(`improved your Match Index by ${deltas.matchDelta} points`);
    } else {
      segments.push(`dropped your Match Index by ${Math.abs(deltas.matchDelta)} points`);
    }
  }
  if (deltas.readinessDelta !== null && deltas.readinessDelta !== 0) {
    if (deltas.readinessDelta > 0) {
      segments.push(`lifted your Readiness by ${deltas.readinessDelta} points`);
    } else {
      segments.push(`lost ${Math.abs(deltas.readinessDelta)} Readiness points`);
    }
  }
  if (deltas.gapDelta !== 0) {
    if (deltas.gapDelta > 0) {
      segments.push(`reduced your skill gaps from ${a.gapCount} to ${b.gapCount}`);
    } else {
      segments.push(`saw your skill gaps grow from ${a.gapCount} to ${b.gapCount}`);
    }
  }
  if (
    deltas.interviewScoreDelta !== null &&
    deltas.interviewScoreDelta !== 0
  ) {
    if (deltas.interviewScoreDelta > 0) {
      segments.push(
        `raised your interview score by ${deltas.interviewScoreDelta} points`
      );
    } else {
      segments.push(
        `your interview score dipped by ${Math.abs(deltas.interviewScoreDelta)} points`
      );
    }
  }

  const summary =
    segments.length === 0
      ? "Your two sessions came out about even across every metric — a stable baseline to build from."
      : `You ${segments.join(", ")}.`;

  // Actionable next step from the most pressing top gap in the newer session.
  const nextGap = b.topGaps[0] || a.topGaps[0];
  const nextStep = nextGap
    ? `Keep practicing ${nextGap}.`
    : "No open gaps to drill — try a harder target role next.";

  // Net sentiment: more improvements than regressions?
  const improvements =
    (deltas.matchDelta !== null && deltas.matchDelta > 0 ? 1 : 0) +
    (deltas.readinessDelta !== null && deltas.readinessDelta > 0 ? 1 : 0) +
    (deltas.gapDelta > 0 ? 1 : 0) +
    (deltas.interviewScoreDelta !== null && deltas.interviewScoreDelta > 0 ? 1 : 0);
  const regressions =
    (deltas.matchDelta !== null && deltas.matchDelta < 0 ? 1 : 0) +
    (deltas.readinessDelta !== null && deltas.readinessDelta < 0 ? 1 : 0) +
    (deltas.gapDelta < 0 ? 1 : 0) +
    (deltas.interviewScoreDelta !== null && deltas.interviewScoreDelta < 0 ? 1 : 0);

  const sentiment: "up" | "down" | "flat" =
    improvements > regressions ? "up" : regressions > improvements ? "down" : "flat";

  const Icon = sentiment === "up" ? TrendingUp : sentiment === "down" ? ArrowDown : Minus;
  const accent =
    sentiment === "up"
      ? "text-success-foreground"
      : sentiment === "down"
      ? "text-critical-foreground"
      : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="hm-card hm-card-hover mt-6 p-5 sm:p-7 relative overflow-hidden"
    >
      <div
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.08] pointer-events-none"
        style={{
          background:
            sentiment === "down"
              ? "radial-gradient(circle, var(--critical), transparent 70%)"
              : "radial-gradient(circle, var(--accent-blue), transparent 70%)",
        }}
      />
      <div className="flex items-start gap-3">
        <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Icon className={cn("h-4 w-4", accent)} />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Growth story
          </div>
          <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
            {summary}{" "}
            <span className="text-muted-foreground">{nextStep}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------------------------------
 * ComparisonView — the loaded side-by-side comparison
 * ------------------------------------------------------------------------- */

function ComparisonView({ comparison }: { comparison: Comparison }) {
  const { clearComparison, loadingComparison } = useHireMind();

  return (
    <>
      {/* Top action bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center justify-end mb-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={clearComparison}
          disabled={loadingComparison}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          Pick different sessions
        </Button>
      </motion.div>

      {/* Desktop: 3-column metric grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hm-card p-4 sm:p-6 hidden md:block"
      >
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_72px_1fr] gap-2 sm:gap-3 mb-3">
          <SessionColumnHeader session={comparison.a} side="a" delay={0.1} />
          <div className="flex items-center justify-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 rotate-0">
              Δ
            </div>
          </div>
          <SessionColumnHeader session={comparison.b} side="b" delay={0.15} />
        </div>

        <div className="hm-divider-soft my-2" />

        {/* Metric rows */}
        <div className="space-y-2.5">
          {METRICS.map((spec, i) => (
            <div key={spec.key}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-center mb-1.5">
                {spec.label}
                <span className="ml-1.5 text-muted-foreground/50 normal-case font-normal">· {spec.caption}</span>
              </div>
              <MetricRow spec={spec} comparison={comparison} index={i} />
            </div>
          ))}
        </div>

        <div className="hm-divider-soft my-3" />

        {/* Top gaps */}
        <div className="grid grid-cols-[1fr_72px_1fr] gap-2 sm:gap-3">
          <TopGapsChips gaps={comparison.a.topGaps} side="a" delay={0.55} />
          <div className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            gaps
          </div>
          <TopGapsChips gaps={comparison.b.topGaps} side="b" delay={0.6} />
        </div>
      </motion.div>

      {/* Mobile: vertical stack — A on top, deltas in middle, B on bottom */}
      <div className="md:hidden space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hm-card p-4"
        >
          <SessionColumnHeader session={comparison.a} side="a" delay={0.1} />
          <div className="hm-divider-soft my-2" />
          <div className="space-y-2.5">
            {METRICS.map((spec, i) => {
              const a = valueForMetric(comparison.a, spec.key);
              const b = valueForMetric(comparison.b, spec.key);
              const delta = deltaForMetric(comparison, spec.key);
              const better = betterSideForMetric(a, b, spec.direction);
              const d = 0.15 + i * 0.06;
              return (
                <motion.div
                  key={spec.key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: d }}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-secondary/30 px-2 py-2"
                >
                  <div className="text-left">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">{spec.label.split(" ")[0]}</div>
                    <MetricValueCell value={a} isBetter={better === "a"} delay={d + 0.05} align="left" />
                  </div>
                  <div className="px-1">
                    <DeltaArrow delta={delta} direction={spec.direction} delay={d + 0.1} />
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mb-0.5 text-right">{spec.label.split(" ")[0]}</div>
                    <MetricValueCell value={b} isBetter={better === "b"} delay={d + 0.15} align="right" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="hm-divider-soft my-2" />
          <TopGapsChips gaps={comparison.a.topGaps} side="a" delay={0.55} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hm-card p-4"
        >
          <SessionColumnHeader session={comparison.b} side="b" delay={0.4} />
          <div className="hm-divider-soft my-2" />
          <TopGapsChips gaps={comparison.b.topGaps} side="b" delay={0.6} />
        </motion.div>
      </div>

      <GrowthStory comparison={comparison} />
    </>
  );
}

/* ----------------------------------------------------------------------------
 * CompareView — main exported component
 * ------------------------------------------------------------------------- */

export function CompareView() {
  const { comparison, loadingComparison } = useHireMind();
  const [sessions, setSessions] = React.useState<SessionListItem[]>([]);
  const [listLoading, setListLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session?list=true");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSessions(data.sessions || []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Header (always rendered)
  const header = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        <GitCompare className="h-3.5 w-3.5" />
        Session Comparison
      </div>
      <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">
        Compare sessions.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xl">
        See how you&apos;ve grown between attempts.
      </p>
    </motion.div>
  );

  // No sessions in DB → empty state
  if (!listLoading && sessions.length < 2) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
        {header}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hm-card p-8 sm:p-12 mt-6 sm:mt-8 text-center"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
            <GitCompare className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">
            You need at least two sessions to compare.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Run a candidate analysis twice — for the same role or a different one — then come back here to see your growth side-by-side.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      {header}

      <div className="mt-6 sm:mt-8">
        {listLoading ? (
          <div className="hm-card p-8 sm:p-12 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading past sessions…</span>
          </div>
        ) : comparison ? (
          <ComparisonView comparison={comparison} />
        ) : (
          <PickerState sessions={sessions} />
        )}
      </div>

      {/* Loading overlay when comparison is being fetched */}
      <AnimatePresence>
        {loadingComparison && !comparison && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-background/40 backdrop-blur-sm"
          >
            <div className="hm-card p-5 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
              <span className="text-sm">Comparing your sessions…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
