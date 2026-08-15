"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useOnboarding, ONBOARDING_STEPS } from "@/hooks/use-onboarding";
import { useIsMobile } from "@/hooks/use-mobile";

// ---------------------------------------------------------------------------
// Position calculation helpers
// ---------------------------------------------------------------------------

interface TooltipPosition {
  top: number;
  left: number;
  arrowStyle: React.CSSProperties;
}

const GAP = 12; // px between target and tooltip
const TOOLTIP_MAX_W = 280; // px

function computePosition(
  rect: DOMRect,
  position: "top" | "bottom" | "left" | "right",
  tooltipW: number,
  tooltipH: number,
  isMobile: boolean
): TooltipPosition {
  // On mobile, always position at the bottom of the screen
  if (isMobile) {
    return {
      top: window.innerHeight - tooltipH - 16,
      left: Math.max(8, (window.innerWidth - tooltipW) / 2),
      arrowStyle: { display: "none" },
    };
  }

  let top = 0;
  let left = 0;
  const arrowStyle: React.CSSProperties = {};

  switch (position) {
    case "top":
      top = rect.top - tooltipH - GAP;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowStyle.bottom = -6;
      arrowStyle.left = tooltipW / 2 - 6;
      break;
    case "bottom":
      top = rect.bottom + GAP;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowStyle.top = -6;
      arrowStyle.left = tooltipW / 2 - 6;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - GAP;
      arrowStyle.right = -6;
      arrowStyle.top = tooltipH / 2 - 6;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + GAP;
      arrowStyle.left = -6;
      arrowStyle.top = tooltipH / 2 - 6;
      break;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - tooltipH - 8));

  return { top, left, arrowStyle };
}

// ---------------------------------------------------------------------------
// Spotlight overlay — semi-transparent overlay with a "hole" around the target
// ---------------------------------------------------------------------------

function Spotlight({ rect }: { rect: DOMRect }) {
  // We use a single div with a large box-shadow inset to create the "hole" effect.
  // The box-shadow spread covers the entire viewport, leaving the rect area clear.
  const padding = 6; // extra padding around target for visual breathing room
  const r = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  // Use a combination of radial gradient and box-shadow for the spotlight effect
  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        // Create a "hole" using a very large spread box-shadow on a positioned element
        boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`,
        borderRadius: 8,
        position: "fixed",
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        zIndex: 40,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// OnboardingTooltip — main component
// ---------------------------------------------------------------------------

export function OnboardingTooltip() {
  const { step, currentStep, totalSteps, next, skip, mounted } = useOnboarding();
  const isMobile = useIsMobile();

  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [tooltipSize, setTooltipSize] = React.useState({ w: TOOLTIP_MAX_W, h: 160 });
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Observe the target element and update its bounding rect
  React.useEffect(() => {
    if (step === null || !currentStep) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector<HTMLElement>(currentStep.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    updateRect();

    // Re-measure on resize / scroll
    const onResize = () => updateRect();
    const onScroll = () => updateRect();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });

    let ro: ResizeObserver | null = null;
    const targetEl = document.querySelector<HTMLElement>(currentStep.target);
    if (typeof ResizeObserver !== "undefined" && targetEl) {
      ro = new ResizeObserver(() => updateRect());
      ro.observe(targetEl);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      if (ro) ro.disconnect();
    };
  }, [step, currentStep]);

  // Measure tooltip dimensions after render
  React.useEffect(() => {
    if (tooltipRef.current) {
      const { width, height } = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ w: width, h: height });
    }
  }, [step]);

  // Scroll target into view if it's off-screen
  React.useEffect(() => {
    if (step === null || !currentStep) return;
    const el = document.querySelector<HTMLElement>(currentStep.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [step, currentStep]);

  // Don't render until mounted (after localStorage check)
  if (!mounted || step === null || !currentStep || !targetRect) return null;

  const pos = computePosition(
    targetRect,
    currentStep.position,
    tooltipSize.w,
    tooltipSize.h,
    isMobile
  );

  const isLast = step === totalSteps - 1;

  return (
    <AnimatePresence>
      {/* Spotlight overlay */}
      <Spotlight rect={targetRect} />

      {/* Tooltip */}
      <motion.div
        key={`onboarding-${currentStep.id}`}
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-50 rounded-xl bg-card/95 backdrop-blur-lg border border-accent-blue/30 shadow-xl"
        style={{
          top: pos.top,
          left: pos.left,
          width: isMobile ? Math.min(window.innerWidth - 32, TOOLTIP_MAX_W) : TOOLTIP_MAX_W,
        }}
      >
        {/* Arrow pointer */}
        {!isMobile && (
          <div
            className="absolute w-3 h-3 bg-card/95 rotate-45 border-t border-l border-accent-blue/30"
            style={pos.arrowStyle}
          />
        )}

        <div className="relative p-4">
          {/* Close button */}
          <button
            type="button"
            onClick={skip}
            className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            aria-label="Skip onboarding"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Step indicator + title */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-white text-[11px] font-semibold">
              {step + 1}
            </span>
            <span className="text-sm font-semibold">{currentStep.title}</span>
          </div>

          {/* Description */}
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3 pr-4">
            {currentStep.description}
          </p>

          {/* Step progress dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-4 bg-accent-blue"
                    : i < step
                    ? "w-1.5 bg-accent-blue/40"
                    : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={skip}
              className="text-[12px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Skip tour
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex h-7 items-center justify-center rounded-lg bg-accent-blue px-3 text-[12px] font-medium text-white hover:bg-accent-blue/90 transition-colors"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
