"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, LineChart, Target } from "lucide-react";
import { useHireMind } from "@/lib/store";

const STEPS = [
  { icon: BrainCircuit, label: "Reading your resume", sub: "Extracting skills, evidence and experience" },
  { icon: Target, label: "Mapping the target role", sub: "Required vs. preferred competencies" },
  { icon: LineChart, label: "Computing your match", sub: "Semantic alignment + evidence weighting" },
];

export function LoadingOverlay() {
  const { loading, loadingStep } = useHireMind();
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
            <h2 className="mt-6 text-[18px] font-semibold tracking-tight">
              {loadingStep || "Working…"}
            </h2>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              HireMind is processing — this usually takes a few seconds.
            </p>
            <div className="mt-6 space-y-2.5">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-[12px] text-muted-foreground"
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
