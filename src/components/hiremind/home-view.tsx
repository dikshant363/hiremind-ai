"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, Briefcase, Sparkles, ArrowRight, Wand2, ShieldCheck, GitBranch, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useHireMind } from "@/lib/store";
import { DEMO_RESUME, DEMO_JOB, DEMO_JOB_TITLE } from "@/lib/demo";
import { FileUpload } from "./file-upload";
import { SessionHistory } from "./session-history";

export function HomeView() {
  const { resumeText, jobTitle, jobText, setResumeText, setJobTitle, setJobText, analyze, loading, error } = useHireMind();

  const onDemo = () => {
    setResumeText(DEMO_RESUME);
    setJobTitle(DEMO_JOB_TITLE);
    setJobText(DEMO_JOB);
    analyze({ demo: true });
  };

  const onAnalyze = () => analyze({ demo: false });

  const canAnalyze = resumeText.trim().length > 30 && jobText.trim().length > 30;

  return (
    <div className="hm-ambient hm-particles">
      <section className="mx-auto max-w-5xl px-4 sm:px-8 pt-12 sm:pt-24 pb-10 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="hm-badge-premium inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium mb-6">
            <Sparkles className="h-3 w-3" />
            <span>Evidence-based job readiness · AI-assisted assessment</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-balance leading-[1.05]">
            Know your job
            <br />
            <span className="hm-text-gradient">readiness.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-sm sm:text-base text-foreground/70 leading-relaxed text-pretty">
            Upload your resume and choose a target role. HireMind finds your strongest evidence, identifies your biggest gap, and tests it in an adaptive AI interview.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 sm:mt-12 grid gap-4 md:grid-cols-2 items-stretch"
        >
          {/* Resume input */}
          <div className="hm-card p-4 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Your resume</h3>
                <p className="text-[11px] text-muted-foreground">Paste or upload a file</p>
              </div>
            </div>
            <FileUpload onTextExtracted={setResumeText} className="mb-3" />
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Or paste your resume text here — name, experience, skills, projects…"
              className="hm-input-premium flex-1 min-h-[100px] sm:min-h-[120px] resize-none text-sm leading-relaxed placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-accent-blue/30 focus-visible:border-accent-blue/40"
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>Never stored beyond this session</span>
              <span>{resumeText.length.toLocaleString()} chars</span>
            </div>
          </div>

          {/* Target role input */}
          <div className="hm-card p-4 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Briefcase className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Target role</h3>
                <p className="text-[11px] text-muted-foreground">The job you want</p>
              </div>
            </div>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. AI/ML Software Engineer"
              className="hm-input-premium text-sm placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-accent-blue/30 focus-visible:border-accent-blue/40"
            />
            <Textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job description — responsibilities, required skills, preferred qualifications…"
              className="mt-3 flex-1 min-h-[120px] sm:min-h-[140px] resize-none text-sm leading-relaxed placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-accent-blue/30 focus-visible:border-accent-blue/40"
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>Required + preferred skills matter</span>
              <span>{jobText.length.toLocaleString()} chars</span>
            </div>
            {/* Tips mini-section — balances the height with the Resume card (which has FileUpload) */}
            <div className="mt-3 rounded-lg bg-secondary/40 border border-border/40 px-3 py-2.5 text-[11px] leading-relaxed">
              <span className="font-semibold text-foreground">Tips for best results</span>
              <span className="text-muted-foreground"> — include required + preferred skills, seniority, and team context for sharper matching.</span>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-xl border border-critical/30 bg-critical/5 px-4 py-3 text-[13px] text-critical-foreground"
          >
            {error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            onClick={onAnalyze}
            disabled={!canAnalyze || loading}
            size="lg"
            className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl text-sm font-medium gap-2 shadow-sm"
          >
            {loading ? "Analyzing…" : "Analyze my readiness"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
          {/* Premium 'or' divider — flanked by 1px lines so it reads as a real separator, not floating text */}
          <div className="flex items-center gap-3" aria-hidden>
            <div className="sm:hidden h-px w-6 bg-border/70" />
            <div className="hidden sm:block hm-divider-vertical" />
            <span className="text-[12px] text-muted-foreground/60">or</span>
            <div className="sm:hidden h-px w-6 bg-border/70" />
            <div className="hidden sm:block hm-divider-vertical" />
          </div>
          <div className="hm-gradient-border rounded-[calc(var(--radius)+6px)]">
            <Button
              onClick={onDemo}
              disabled={loading}
              variant="outline"
              size="lg"
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-[calc(var(--radius)+5px)] text-sm font-medium gap-2 border-0 bg-card hover:bg-secondary/80"
            >
              <Wand2 className="h-4 w-4" />
              Load demo candidate
            </Button>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          The demo runs end-to-end: match · biggest gap · adaptive interview · readiness · roadmap.
        </p>

        <SessionHistory />
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/60 bg-card/30 relative hm-particles-inner">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-10 grid sm:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              icon: <GitBranch className="h-4 w-4" />,
              title: "Adaptive, not static",
              body: "Your answer changes the next question. The interview is driven by your identified gap and your demonstrated depth.",
            },
            {
              icon: <ShieldCheck className="h-4 w-4" />,
              title: "Honest by design",
              body: "We distinguish known, weak and unknown evidence. Missing resume evidence is never treated as proof of missing skill.",
            },
            {
              icon: <Sparkles className="h-4 w-4" />,
              title: "Explainable scores",
              body: "Every Prototype Job Match Index and Readiness Index is broken down into the factors that actually produced it.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03, y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.99 }}
              className="flex gap-3 cursor-default"
            >
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                {f.icon}
              </span>
              <div>
                <h4 className="text-[13px] font-semibold">{f.title}</h4>
                <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
