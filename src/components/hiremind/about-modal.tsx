"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─── Intelligence flow steps ─── */
const FLOW_STEPS = [
  { label: "Resume", color: "var(--accent-blue)" },
  { label: "Intelligence", color: "var(--success)" },
  { label: "Match", color: "var(--accent-blue)" },
  { label: "Gaps", color: "var(--warning)" },
  { label: "Interview", color: "var(--success)" },
  { label: "Evaluation", color: "var(--accent-blue)" },
  { label: "Readiness", color: "var(--success)" },
  { label: "Roadmap", color: "var(--accent-blue)" },
] as const;

/* ─── Tech stack badges ─── */
const TECH_STACK = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Prisma",
  "Zustand",
  "Framer Motion",
] as const;

/* ─── Animation variants ─── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.15 } },
};

const flowDotVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

const flowLineVariants = {
  hidden: { scaleX: 0 },
  visible: (i: number) => ({
    scaleX: 1,
    transition: { delay: 0.35 + i * 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg p-0 overflow-hidden border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6 sm:p-8 space-y-6"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header: Logo + Name + Version */}
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                  <BrainCircuit className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight leading-none">
                    HireMind<span className="text-muted-foreground"> AI</span>
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-primary/12 text-primary-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mt-1">
                    v1.0.0
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                HireMind AI is an intelligent hiring assessment platform that transforms resume
                analysis into structured, evidence-based evaluation — from skill-gap identification
                through adaptive interviews to readiness scoring and personalized development roadmaps.
              </p>

              {/* Core Intelligence Loop visualization */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Core Intelligence Loop
                </h3>
                <div className="flex items-center gap-0 overflow-x-auto py-2 no-scrollbar">
                  {FLOW_STEPS.map((step, i) => (
                    <React.Fragment key={step.label}>
                      {/* Dot + label */}
                      <motion.div
                        custom={i}
                        variants={flowDotVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-center gap-1.5 shrink-0"
                      >
                        <span
                          className="h-3 w-3 rounded-full shadow-sm"
                          style={{ backgroundColor: step.color, boxShadow: `0 0 6px color-mix(in oklch, ${step.color} 40%, transparent)` }}
                        />
                        <span className="text-[10px] font-medium text-foreground whitespace-nowrap">
                          {step.label}
                        </span>
                      </motion.div>
                      {/* Connecting line (skip after last) */}
                      {i < FLOW_STEPS.length - 1 && (
                        <motion.div
                          custom={i}
                          variants={flowLineVariants}
                          initial="hidden"
                          animate="visible"
                          className="h-[2px] w-4 sm:w-6 shrink-0 origin-left mt-[-14px]"
                          style={{
                            background: `linear-gradient(90deg, ${FLOW_STEPS[i].color}, ${FLOW_STEPS[i + 1].color})`,
                            opacity: 0.5,
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Tech stack badges */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Built With
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {TECH_STACK.map((tech, i) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="hm-badge-sheen hm-glass-chip inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Philosophy */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Philosophy
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  AI understands; application logic decides. Every score is deterministic — the AI
                  assists interpretation, but never directly produces a numeric result.
                </p>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                Prototype indices — assessment support, not a hiring verdict.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Screen-reader accessible title/description (invisible) */}
        <DialogTitle className="sr-only">About HireMind AI</DialogTitle>
        <DialogDescription className="sr-only">
          Information about HireMind AI, its core intelligence loop, tech stack, and design philosophy.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
