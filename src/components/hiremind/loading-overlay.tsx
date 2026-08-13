"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, LineChart, Target, MessageSquare, CheckCircle2 } from "lucide-react";
import { useHireMind } from "@/lib/store";

const STEPS = [
  { icon: BrainCircuit, label: "Reading your resume", sub: "Extracting skills, evidence and experience" },
  { icon: Target, label: "Mapping the target role", sub: "Required vs. preferred competencies" },
  { icon: LineChart, label: "Computing your match", sub: "Semantic alignment + evidence weighting" },
];

const INTERVIEW_STEPS = [
  { icon: MessageSquare, label: "Generating adaptive question", sub: "Based on your identified gaps" },
  { icon: BrainCircuit, label: "Evaluating your answer", sub: "4-dimension structural analysis" },
  { icon: CheckCircle2, label: "Updating competency state", sub: "Evidence drives the next question" },
];

export function LoadingOverlay() {
  const { loading, loadingStep } = useHireMind();

  // Pick contextually relevant steps based on loadingStep text
  const isInterviewStep = loadingStep?.toLowerCase().includes("interview")
    || loadingStep?.toLowerCase().includes("question")
    || loadingStep?.toLowerCase().includes("answer")
    || loadingStep?.toLowerCase().includes("evaluat");
  const steps = isInterviewStep ? INTERVIEW_STEPS : STEPS;

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <div className="text-center max-w-md px-6">
            <div className="relative inline-flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-accent-blue/10 animate-ping" />
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue-foreground">
                <Sparkles className="h-6 w-6 hm-thinking" />
              </span>
            </div>
            <h2 className="mt-6 text-lg font-semibold tracking-tight">
              {loadingStep || "Working…"}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {isInterviewStep
                ? "Evaluating your response and adapting the next question."
                : "HireMind is processing — this usually takes a few seconds."}
            </p>
            <div className="mt-6 space-y-2.5">
              {steps.map((s, i) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 text-xs text-muted-foreground"
                  style={{ animation: `hm-fade 0.4s ease ${i * 0.1}s both` }}
                >
                  <s.icon className="h-3.5 w-3.5 hm-thinking" style={{ animationDelay: `${i * 0.2}s` }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
