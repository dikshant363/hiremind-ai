"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useHireMind, type View } from "@/lib/store";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Flow Progress Indicator — horizontal stepper bar shown below the header.
 *
 * Maps the current `view` to one of 6 logical steps in the HireMind flow.
 * NOT shown on "home" or "compare" views.
 *
 * Premium Apple-inspired design:
 *   - Glassmorphism container with backdrop-blur
 *   - Completed steps: success-green checkmark circle
 *   - Current step: accent-blue highlighted circle with glow
 *   - Future steps: dimmed/muted circle
 *   - Connectors: solid line for completed, dashed for upcoming
 *   - Mobile: dots only (no labels) to save space
 *   - Framer Motion smooth step transitions
 * ------------------------------------------------------------------------- */

interface FlowStep {
  id: string;
  label: string;
  shortLabel: string;
}

const FLOW_STEPS: FlowStep[] = [
  { id: "resume", label: "Resume", shortLabel: "Resume" },
  { id: "match", label: "Match", shortLabel: "Match" },
  { id: "gaps", label: "Gaps", shortLabel: "Gaps" },
  { id: "interview", label: "Interview", shortLabel: "Interview" },
  { id: "readiness", label: "Readiness", shortLabel: "Ready" },
  { id: "roadmap", label: "Roadmap", shortLabel: "Roadmap" },
];

/**
 * Maps a View to a 1-based step index, or 0 if the indicator
 * should not be shown.
 */
function viewToStep(view: View): number {
  switch (view) {
    case "candidate":
      return 1;
    case "match":
      return 2;
    case "gaps":
      return 3;
    case "interview":
    case "evaluation":
      return 4;
    case "readiness":
      return 5;
    case "roadmap":
      return 6;
    default:
      return 0; // home, compare → hidden
  }
}

export function FlowProgress() {
  const { view } = useHireMind();
  const currentStep = viewToStep(view);

  // Don't render on home or compare views
  if (currentStep === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="flow-progress"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full border-b border-border/40"
      >
        {/* Glassmorphism bar */}
        <div className="backdrop-blur-xl bg-background/60">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-2 sm:py-2.5">
            {/* Desktop: full stepper with labels */}
            <div className="hidden sm:flex items-center justify-between">
              {FLOW_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                const isFuture = stepNum > currentStep;
                const isLast = i === FLOW_STEPS.length - 1;

                return (
                  <React.Fragment key={step.id}>
                    {/* Step node */}
                    <div className="flex flex-col items-center gap-1">
                      <StepCircle
                        stepNum={stepNum}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        isFuture={isFuture}
                      />
                      {/* Label */}
                      <motion.span
                        key={`label-${stepNum}-${isCurrent ? "active" : isCompleted ? "done" : "future"}`}
                        initial={false}
                        animate={{ opacity: isFuture ? 0.4 : 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={cn(
                          "text-[11px] font-medium leading-tight",
                          isCurrent && "text-accent-blue-foreground",
                          isCompleted && "text-success-foreground",
                          isFuture && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </motion.span>
                    </div>

                    {/* Connector line between steps */}
                    {!isLast && (
                      <ConnectorLine
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        index={i}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile: dots only, no labels */}
            <div className="flex sm:hidden items-center justify-between">
              {FLOW_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                const isFuture = stepNum > currentStep;
                const isLast = i === FLOW_STEPS.length - 1;

                return (
                  <React.Fragment key={`mobile-${step.id}`}>
                    <MobileStepDot
                      stepNum={stepNum}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isFuture={isFuture}
                    />
                    {!isLast && (
                      <ConnectorLine
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        index={i}
                        mobile
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Step Circle (Desktop) ─── */

function StepCircle({
  stepNum,
  isCompleted,
  isCurrent,
  isFuture,
}: {
  stepNum: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}) {
  return (
    <div className="relative">
      {/* Glow for current step */}
      {isCurrent && (
        <motion.div
          layoutId="flow-glow"
          className="absolute -inset-2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--accent-blue) 18%, transparent), transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}

      <motion.div
        key={`circle-${stepNum}-${isCurrent ? "active" : isCompleted ? "done" : "future"}`}
        initial={false}
        animate={{
          scale: isCurrent ? 1.1 : 1,
          borderColor: isCurrent
            ? "var(--accent-blue)"
            : isCompleted
            ? "var(--success)"
            : "var(--border)",
          backgroundColor: isCurrent
            ? "color-mix(in oklch, var(--accent-blue) 12%, var(--background))"
            : isCompleted
            ? "color-mix(in oklch, var(--success) 15%, var(--background))"
            : "transparent",
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2",
          isFuture && "opacity-40"
        )}
      >
        {isCompleted && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
          >
            <Check className="h-3.5 w-3.5 text-success-foreground" strokeWidth={3} />
          </motion.span>
        )}
        {isCurrent && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25,
            }}
            className="h-2.5 w-2.5 rounded-full bg-accent-blue"
          />
        )}
        {isFuture && (
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
        )}
      </motion.div>
    </div>
  );
}

/* ─── Mobile Step Dot ─── */

function MobileStepDot({
  stepNum,
  isCompleted,
  isCurrent,
  isFuture,
}: {
  stepNum: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}) {
  return (
    <div className="relative">
      {/* Glow for current step on mobile */}
      {isCurrent && (
        <motion.div
          layoutId="flow-glow-mobile"
          className="absolute -inset-1.5 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--accent-blue) 20%, transparent), transparent 70%)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      )}

      <motion.div
        key={`dot-${stepNum}-${isCurrent ? "active" : isCompleted ? "done" : "future"}`}
        initial={false}
        animate={{
          scale: isCurrent ? 1.25 : 1,
          backgroundColor: isCurrent
            ? "var(--accent-blue)"
            : isCompleted
            ? "var(--success)"
            : "var(--muted)",
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          isFuture && "opacity-40"
        )}
      />
    </div>
  );
}

/* ─── Connector Line ─── */

function ConnectorLine({
  isCompleted,
  isCurrent,
  index,
  mobile = false,
}: {
  isCompleted: boolean;
  isCurrent: boolean;
  index: number;
  mobile?: boolean;
}) {
  // Completed connector: solid filled line
  // Current connector (from completed to current): partially filled
  // Future connector: dashed muted line
  const filled = isCompleted;
  const active = isCurrent; // connector leading INTO the current step

  return (
    <div
      className={cn(
        "flex-1 min-w-4 mx-1",
        mobile ? "h-0.5" : "h-[2px]",
        "rounded-full overflow-hidden",
        !filled && !active && "border-t-2 border-dashed border-muted/60 bg-transparent"
      )}
      style={
        !filled && !active
          ? { background: "transparent" }
          : undefined
      }
    >
      {(filled || active) && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: filled ? "100%" : "50%" }}
          transition={{
            duration: 0.5,
            delay: index * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            "h-full rounded-full",
            filled
              ? "bg-gradient-to-r from-success to-accent-blue"
              : "bg-gradient-to-r from-accent-blue to-accent-blue/40"
          )}
        />
      )}
    </div>
  );
}
