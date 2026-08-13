"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, Briefcase, Sparkles, ArrowRight, Wand2, ShieldCheck, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useHireMind } from "@/lib/store";
import { DEMO_RESUME, DEMO_JOB, DEMO_JOB_TITLE } from "@/lib/demo";

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
      <section className="mx-auto max-w-5xl px-5 sm:px-8 pt-16 sm:pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3" />
            <span>Evidence-based job readiness · AI-assisted assessment</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-balance leading-[1.05]">
            Know your job
            <br />
            <span className="hm-text-gradient">readiness.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-xl text-[15px] sm:text-base text-muted-foreground leading-relaxed text-pretty">
            Upload your resume and choose a target role. HireMind finds your strongest evidence, identifies your biggest gap, and tests it in an adaptive AI interview.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 grid gap-4 md:grid-cols-2"
        >
          {/* Resume input */}
          <div className="hm-card p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold">Your resume</h3>
                <p className="text-[11px] text-muted-foreground">Paste as plain text</p>
              </div>
            </div>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here — name, experience, skills, projects…"
              className="flex-1 min-h-[180px] resize-none text-[13px] leading-relaxed bg-transparent border-border/60 focus-visible:ring-1 focus-visible:ring-ring/40"
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>Never stored beyond this session</span>
              <span>{resumeText.length.toLocaleString()} chars</span>
            </div>
          </div>

          {/* Target role input */}
          <div className="hm-card p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Briefcase className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold">Target role</h3>
                <p className="text-[11px] text-muted-foreground">The job you want</p>
              </div>
            </div>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. AI/ML Software Engineer"
              className="text-[13px] bg-transparent border-border/60"
            />
            <Textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job description — responsibilities, required skills, preferred qualifications…"
              className="mt-3 flex-1 min-h-[140px] resize-none text-[13px] leading-relaxed bg-transparent border-border/60 focus-visible:ring-1 focus-visible:ring-ring/40"
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>Required + preferred skills matter</span>
              <span>{jobText.length.toLocaleString()} chars</span>
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
            className="h-12 px-7 rounded-xl text-[14px] font-medium gap-2 shadow-sm"
          >
            {loading ? "Analyzing…" : "Analyze my readiness"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
          <span className="text-[12px] text-muted-foreground">or</span>
          <div className="hm-gradient-border rounded-[calc(var(--radius)+6px)]">
            <Button
              onClick={onDemo}
              disabled={loading}
              variant="outline"
              size="lg"
              className="h-12 px-6 rounded-[calc(var(--radius)+5px)] text-[14px] font-medium gap-2 border-0 bg-card hover:bg-secondary/80"
            >
              <Wand2 className="h-4 w-4" />
              Load demo candidate
            </Button>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          The demo runs end-to-end: match · biggest gap · adaptive interview · readiness · roadmap.
        </p>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/60 bg-card/30 relative hm-particles-inner">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 py-10 grid sm:grid-cols-3 gap-6">
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
          ].map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ scale: 1.03, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
