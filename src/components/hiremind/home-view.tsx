"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, Briefcase, Sparkles, ArrowRight, Wand2, ShieldCheck, GitBranch, Upload, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useHireMind } from "@/lib/store";
import { DEMO_RESUME, DEMO_JOB, DEMO_JOB_TITLE } from "@/lib/demo";
import { JOB_TEMPLATES, type JobTemplate } from "@/lib/job-templates";
import { FileUpload } from "./file-upload";
import { SessionHistory } from "./session-history";
import { PipelineProgress } from "./pipeline-progress";
import { AchievementStrip } from "./achievements";
import { JobTemplatePicker } from "./job-template-picker";

/** Animated count-up hook — animates from 0 to `target` over `durationMs` with ease-out. */
function useAnimatedCount(target: number, durationMs = 1500) {
  const [count, setCount] = React.useState(0);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return count;
}

/** Character count progress bar — thin 2px bar that fills based on text length vs optimal length. */
function CharProgressBar({ length, optimal }: { length: number; optimal: number }) {
  const pct = Math.min((length / optimal) * 100, 100);
  const isOptimal = length >= optimal;
  return (
    <div className="mt-1.5 h-[2px] w-full rounded-full bg-border/40 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${
          isOptimal ? "bg-success/60" : "bg-accent-blue/40"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function HomeView() {
  const { resumeText, jobTitle, jobText, setResumeText, setJobTitle, setJobText, analyze, loading, error, sessionId } = useHireMind();

  const animatedCount = useAnimatedCount(1247, 1500);

  const onDemo = () => {
    setResumeText(DEMO_RESUME);
    setJobTitle(DEMO_JOB_TITLE);
    setJobText(DEMO_JOB);
    analyze({ demo: true });
  };

  const onAnalyze = () => analyze({ demo: false });

  // Apply a quick-pick template — pre-fills target role fields and smoothly
  // scrolls the job input card into view so the user can review before analyze.
  const onTemplateSelect = (template: JobTemplate) => {
    setJobTitle(template.jobTitle);
    setJobText(template.jobDescription);
    toast.success("Template applied — review and hit Analyze.");
    if (typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document
          .querySelector('[data-hm="job-input"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  const canAnalyze = resumeText.trim().length > 30 && jobText.trim().length > 30;

  const openShortcuts = () => document.dispatchEvent(new CustomEvent("hm-show-shortcuts"));

  // Optimal character lengths for progress bars
  const RESUME_OPTIMAL = 800;
  const JOB_OPTIMAL = 600;

  return (
    <div className="hm-ambient hm-particles hm-textured-bg">
      <section className="mx-auto max-w-5xl px-4 sm:px-8 pt-12 sm:pt-24 pb-10 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center"
        >
          {/* Subtle animated gradient orb behind hero — atmospheric depth */}
          <div
            aria-hidden
            className="hm-hero-orb absolute -top-12 left-1/2 w-[520px] h-[360px] pointer-events-none"
          />
          {/* Grid texture overlay — premium dotted background that fades at edges */}
          <div
            aria-hidden
            className="hm-grid-fade absolute inset-0 -z-[1] pointer-events-none opacity-60"
          />
          {/* Floating help icon — top-right of hero, opens keyboard shortcuts / how-it-works panel */}
          <button
            type="button"
            onClick={openShortcuts}
            aria-label="How it works & keyboard shortcuts"
            className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <div className="hm-shine-line hm-badge-premium hm-glass-panel relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium mb-6">
            <Sparkles className="h-3 w-3" />
            <span>Evidence-based job readiness · AI-assisted assessment</span>
          </div>
          <h1 className="relative hm-heading-display text-[40px] sm:text-[56px] font-semibold tracking-tight text-balance leading-[1.1] sm:leading-[1.05]">
            Know your job
            <br />
            <span className="hm-text-shimmer">readiness.</span>
          </h1>
          <p className="relative mt-4 mx-auto max-w-xl text-sm sm:text-base text-foreground/70 leading-relaxed sm:leading-normal text-pretty">
            Upload your resume and choose a target role. HireMind finds your strongest evidence, identifies your biggest gap, and tests it in an adaptive AI interview.
          </p>
          <div className="relative hm-shimmer-line mt-4 mx-auto max-w-xs" />
          {/* Trust badge — live system indicator with pulsing green dot + animated counter */}
          <div className="relative mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span><span className="text-foreground font-medium tabular-nums">{animatedCount.toLocaleString()}</span> candidates analyzed today</span>
          </div>
        </motion.div>

        {/* Achievement strip — shows unlocked milestones */}
        <AchievementStrip />

        {/* Quick start templates — pre-fill target role fields in one click */}
        <JobTemplatePicker onSelect={onTemplateSelect} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 sm:mt-8 grid gap-4 md:grid-cols-2 items-stretch"
        >
          {/* Resume input */}
          <div data-hm="resume-input" className={`hm-card hm-card-depth p-4 sm:p-6 flex flex-col transition-[box-shadow] duration-300 ease-out ${resumeText.length > 0 ? "ring-2 ring-accent-blue/20" : ""}`}>
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
              className="hm-input-premium flex-1 min-h-[100px] sm:min-h-[120px] resize-none text-sm leading-relaxed py-4 sm:py-3 placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-accent-blue/30 focus-visible:border-accent-blue/40"
            />
            <div className="mt-3 pb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Never stored beyond this session</span>
              <span>{resumeText.length.toLocaleString()} chars</span>
            </div>
            <CharProgressBar length={resumeText.length} optimal={RESUME_OPTIMAL} />
          </div>

          {/* Target role input */}
          <div data-hm="job-input" className={`hm-card hm-card-depth p-4 sm:p-6 flex flex-col transition-[box-shadow] duration-300 ease-out ${jobText.length > 0 ? "ring-2 ring-accent-blue/20" : ""}`}>
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
              className="mt-3 flex-1 min-h-[120px] sm:min-h-[140px] resize-none text-sm leading-relaxed py-4 sm:py-3 placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-accent-blue/30 focus-visible:border-accent-blue/40"
            />
            <div className="mt-3 pb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Required + preferred skills matter</span>
              <span>{jobText.length.toLocaleString()} chars</span>
            </div>
            <CharProgressBar length={jobText.length} optimal={JOB_OPTIMAL} />
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
          className="mt-8 flex flex-col items-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              data-hm="analyze-btn"
              onClick={onAnalyze}
              disabled={!canAnalyze || loading}
              size="lg"
              className={`h-11 sm:h-12 px-6 sm:px-7 rounded-xl text-sm font-medium gap-2 shadow-sm ${canAnalyze && !loading ? "hm-cta-glow" : ""}`}
            >
              {loading ? "Analyzing…" : "Analyze my readiness"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
            {/* Premium 'or' divider — flanked by 1px lines + subtle pulse */}
            <div className="flex items-center gap-3" aria-hidden>
              <div className="sm:hidden h-px w-6 bg-border/70" />
              <div className="hidden sm:block hm-divider-vertical" />
              <span className="text-[12px] text-muted-foreground/60 animate-pulse [animation-duration:3s]">or</span>
              <div className="sm:hidden h-px w-6 bg-border/70" />
              <div className="hidden sm:block hm-divider-vertical" />
            </div>
            <div className="hm-gradient-border rounded-[calc(var(--radius)+6px)]">
              <Button
                data-hm="demo-btn"
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
          </div>
          <span className="mt-2.5 text-[11px] text-muted-foreground/70">
            ⚡ Takes ~30 seconds
          </span>
        </motion.div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          The demo runs end-to-end: match · biggest gap · adaptive interview · readiness · roadmap.
        </p>

        {/* Pipeline progress — only shown when a session is active */}
        {sessionId && <PipelineProgress />}

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
              borderCls: "border-l-accent-blue",
              gradientCls: "from-accent-blue/5",
              iconCls: "bg-accent-blue/10 text-accent-blue",
            },
            {
              icon: <ShieldCheck className="h-4 w-4" />,
              title: "Honest by design",
              body: "We distinguish known, weak and unknown evidence. Missing resume evidence is never treated as proof of missing skill.",
              borderCls: "border-l-success",
              gradientCls: "from-success/5",
              iconCls: "bg-success/10 text-success",
            },
            {
              icon: <Sparkles className="h-4 w-4" />,
              title: "Explainable scores",
              body: "Every Prototype Job Match Index and Readiness Index is broken down into the factors that actually produced it.",
              borderCls: "border-l-warning",
              gradientCls: "from-warning/5",
              iconCls: "bg-warning/10 text-warning",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03, y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.99 }}
              className={`flex gap-3 cursor-default hm-card-hover rounded-xl p-4 border-l-[3px] ${f.borderCls} bg-gradient-to-br ${f.gradientCls} to-transparent`}
            >
              <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.iconCls}`}>
                {f.icon}
              </span>
              <div className="flex flex-col min-w-0">
                <h4 className="text-[13px] font-semibold">{f.title}</h4>
                <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{f.body}</p>
                <button
                  type="button"
                  onClick={openShortcuts}
                  className="mt-2.5 self-start text-[11px] font-medium text-accent-blue/80 hover:text-accent-blue transition-colors"
                >
                  Learn more →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
