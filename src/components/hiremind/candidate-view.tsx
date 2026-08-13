"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BadgeCheck, FolderGit2, GraduationCap, Briefcase, Quote, AlertCircle, ChevronDown, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useHireMind } from "@/lib/store";
import { toast } from "sonner";
import type { SkillEvidence } from "@/lib/types";
import { ScoreRing } from "./shell";
import { EvidenceGraph } from "./evidence-graph";
import { SkillHeatmap } from "./skill-heatmap";
import { SkillRadar } from "./skill-radar";
import { ResumeStrength } from "./resume-strength";

/** Compute profile completeness as a 0..100 integer. */
function computeCompleteness(c: {
  name: string | null;
  summary: string;
  skills: string[];
  experience: unknown[];
  projects: unknown[];
  education: unknown[];
  certifications: string[];
}): number {
  let pct = 0;
  if (c.name && c.name.trim().length > 0) pct += 10;
  if (c.summary && c.summary.trim().length > 0) pct += 15;
  if (c.skills.length > 5) pct += 20;
  if (c.experience.length > 0) pct += 20;
  if (c.projects.length > 0) pct += 15;
  if (c.education.length > 0) pct += 10;
  if (c.certifications.length > 0) pct += 10;
  return Math.min(100, pct);
}

/** Extract plausible tech terms from a project description. */
function extractTechStack(desc: string): string[] {
  // Common tech keywords to look for (case-insensitive)
  const techKeywords = [
    "react", "next.js", "nextjs", "vue", "angular", "svelte", "typescript", "javascript",
    "python", "java", "go", "rust", "c\\+\\+", "ruby", "php", "swift", "kotlin",
    "node", "nodejs", "deno", "express", "fastapi", "flask", "django", "spring",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "graphql", "rest", "grpc", "websocket", "tailwind", "bootstrap",
    "redux", "mobx", "zustand", "prisma", "drizzle", "supabase",
    "tensorflow", "pytorch", "openai", "langchain", "huggingface",
    "git", "github", "gitlab", "ci/cd", "jenkins", "github actions",
    "figma", "vercel", "netlify", "s3", "lambda",
  ];
  const lower = desc.toLowerCase();
  const found: string[] = [];
  for (const kw of techKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(lower)) {
      // Capitalize nicely
      found.push(kw.replace(/\b\w/g, (c) => c.toUpperCase()).replace("\\+", "+"));
    }
  }
  // Deduplicate and limit
  return [...new Set(found)].slice(0, 8);
}

/** Derive a duration hint from a description string (e.g. "2022 - Present" → "2+ years"). */
function durationHint(desc: string): string | null {
  // Look for year ranges like "2020 - 2023" or "2020–2023" or "2020 - Present"
  const rangeMatch = desc.match(/(\d{4})\s*[-–—]\s*(Present|present|Current|current|\d{4})/);
  if (!rangeMatch) return null;
  const startYear = parseInt(rangeMatch[1], 10);
  const endStr = rangeMatch[2].toLowerCase();
  const currentYear = new Date().getFullYear();
  const endYear = endStr === "present" || endStr === "current" ? currentYear : parseInt(rangeMatch[2], 10);
  if (isNaN(startYear) || isNaN(endYear)) return null;
  const diff = endYear - startYear;
  if (diff <= 0) return "<1 year";
  if (endStr === "present" || endStr === "current") return `${diff}+ years`;
  return `${diff} year${diff > 1 ? "s" : ""}`;
}

export function CandidateView() {
  const { candidate, job, isDemo, meta, setView } = useHireMind();
  const [fallbackExpanded, setFallbackExpanded] = React.useState(false);
  if (!candidate || !job) return null;

  const strongSkills = candidate.evidence.filter((e) => e.level === "strong");
  const moderateSkills = candidate.evidence.filter((e) => e.level === "moderate");
  const weakSkills = candidate.evidence.filter((e) => e.level === "weak");
  const totalSkills = strongSkills.length + moderateSkills.length + weakSkills.length;

  const completeness = computeCompleteness(candidate);
  const completenessTone =
    completeness >= 80 ? "success" : completeness >= 50 ? "warning" : "critical";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Candidate Intelligence</div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Here's what we found.</h1>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    toast("Session link copied to clipboard");
                  });
                }}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span className="text-[11px]">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy link to share this session</TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          We extracted only what's actually in your resume — no invented skills, no inflated evidence.
        </p>
        {isDemo && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warning/15 text-warning-foreground px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3" /> Demo candidate loaded
          </div>
        )}
      </motion.div>

      <div className="mt-6 sm:mt-8 grid gap-4 lg:grid-cols-3">
        {/* Profile summary — premium depth card with avatar glow, top skills, stat tiles */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="hm-card hm-card-hover hm-card-depth p-4 sm:p-6 lg:col-span-1 relative overflow-hidden"
        >
          {/* Subtle accent gradient backdrop in the top-right corner */}
          <div
            aria-hidden
            className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--accent-blue), transparent 70%)" }}
          />
          {/* Premium avatar with gradient ring + breathing glow */}
          <div className="flex items-center gap-3 mb-4 relative">
            <span className="hm-avatar-premium inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/20 to-chart-5/15 text-[18px] font-semibold text-foreground ring-1 ring-accent-blue/20">
              {candidate.name?.[0] ?? "C"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold tracking-tight truncate hm-heading-section">
                {candidate.name ?? "Candidate"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{job.title}</div>
            </div>
            {isDemo && (
              <span className="hm-badge-sheen inline-flex items-center rounded-full bg-warning/15 text-warning-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{candidate.summary}</p>

          {/* Top 3 strong skills as prominent pills */}
          {strongSkills.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top strengths</div>
              <div className="flex flex-wrap gap-1.5">
                {strongSkills.slice(0, 3).map((s) => (
                  <span
                    key={s.competency}
                    className="hm-badge-sheen inline-flex items-center gap-1 rounded-full bg-success/10 text-success-foreground px-2.5 py-1 text-[11px] font-medium"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {s.competency}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Premium stat tiles — 2x2 grid instead of vertical list */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              { label: "Skills", value: candidate.skills.length, icon: BadgeCheck },
              { label: "Evidence", value: candidate.evidence.length, icon: Quote },
              { label: "Experience", value: candidate.experience.length, icon: Briefcase },
              { label: "Projects", value: candidate.projects.length, icon: FolderGit2 },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="hm-stat-tile-premium hm-elevated rounded-lg p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                    <Icon className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums">{stat.value}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Profile completeness ring */}
          <div className="hm-divider-premium my-4" />
          <div className="flex items-center gap-3">
            <ScoreRing value={completeness} size={80} tone={completenessTone} delay={400} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold">Profile completeness</div>
              <div className="text-[11px] text-muted-foreground">{completeness}%</div>
              {completeness < 70 && (
                <div className="mt-1 text-[10px] text-warning-foreground leading-snug">
                  Add more details to your resume for better matching
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Skills with evidence */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hm-card hm-card-hover p-4 sm:p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Demonstrated skills</h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <Legend color="var(--success)" label="Strong" />
              <Legend color="var(--warning)" label="Moderate" />
              <Legend color="var(--muted-foreground)" label="Weak" />
            </div>
          </div>

          <div className="space-y-2">
            {[...strongSkills, ...moderateSkills, ...weakSkills].map((ev, i) => (
              <motion.div
                key={ev.competency}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <SkillRow ev={ev} />
              </motion.div>
            ))}
          </div>

          {/* Skill distribution bar */}
          {totalSkills > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-4"
            >
              <SkillDistributionBar
                strong={strongSkills.length}
                moderate={moderateSkills.length}
                weak={weakSkills.length}
                total={totalSkills}
              />
            </motion.div>
          )}

          {candidate.experience.length > 0 && (
            <>
              <div className="hm-divider my-5" />
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Experience</h4>
              {/* Vertical timeline with connector */}
              <div className="relative pl-5">
                {/* Vertical connector line */}
                {candidate.experience.length > 1 && (
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
                )}
                <div className="space-y-4">
                  {candidate.experience.map((x, i) => {
                    const hint = durationHint(x.description);
                    const dotColor =
                      i === 0 ? "var(--success)" : i === 1 ? "var(--warning)" : "var(--muted-foreground)";
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div
                          className="absolute -left-5 top-1.5 h-2 w-2 rounded-full ring-2 ring-background"
                          style={{ background: dotColor, left: "-17px" }}
                        />
                        <div>
                          <div className="text-sm font-medium line-clamp-1">
                            {x.role}
                            {x.company && <span className="text-muted-foreground"> · {x.company}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {x.description}
                          </div>
                          {hint && (
                            <span className="mt-0.5 inline-block text-[10px] text-muted-foreground/70 bg-secondary/50 rounded px-1.5 py-0.5">
                              {hint}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {candidate.projects.length > 0 && (
            <>
              <div className="hm-divider my-5" />
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Projects</h4>
              <div className="space-y-3">
                {candidate.projects.map((p, i) => {
                  const techStack = extractTechStack(p.description);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      className="flex gap-3"
                    >
                      <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.description}</div>
                        {techStack.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {techStack.map((tech) => (
                              <span
                                key={tech}
                                className="inline-flex items-center rounded-full bg-secondary/60 text-[10px] font-medium text-muted-foreground px-2 py-0.5"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {candidate.education.length > 0 && (
            <>
              <div className="hm-divider my-5" />
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Education</h4>
              <div className="space-y-2">
                {candidate.education.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                    <div className="text-[13px]">
                      <span className="font-medium">{e.degree}</span>
                      {e.institution && <span className="text-muted-foreground"> · {e.institution}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Skill confidence heatmap — at-a-glance visual grid */}
      <SkillHeatmap />

      {/* Skill proficiency radar — average evidence strength by category */}
      <SkillRadar />

      {/* Resume strength score — deterministic signal-richness assessment */}
      <ResumeStrength />

      <EvidenceGraph />

      <div className="mt-8 flex items-center justify-between gap-4">
        {(meta.resumeFallback || meta.jobFallback) && (
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setFallbackExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 text-warning-foreground px-3 py-1.5 text-[11px] hover:bg-warning/15 transition-colors"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="truncate">Some parsing used deterministic fallback (AI was slow/unavailable).</span>
              <ChevronDown
                className="h-3 w-3 shrink-0 transition-transform duration-200"
                style={{ transform: fallbackExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            <AnimatePresence>
              {fallbackExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-md bg-warning/5 border border-warning/15 px-3 py-2.5 text-[11px] text-warning-foreground/90 leading-relaxed">
                    <span className="font-semibold">What this means:</span>{" "}
                    AI parsing was slow or unavailable. Your results are still valid — we used keyword-based extraction instead.
                    Try again later for AI-enhanced parsing.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <Button onClick={() => setView("match")} className="ml-auto gap-2 shrink-0">
          See your job match <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums hm-num-tabular">{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/** Horizontal stacked bar showing strong/moderate/weak skill distribution. */
function SkillDistributionBar({ strong, moderate, weak, total }: { strong: number; moderate: number; weak: number; total: number }) {
  const strongPct = total > 0 ? (strong / total) * 100 : 0;
  const moderatePct = total > 0 ? (moderate / total) * 100 : 0;
  const weakPct = total > 0 ? (weak / total) * 100 : 0;

  return (
    <div>
      <div className="flex h-1 w-full overflow-hidden rounded-full bg-secondary/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${strongPct}%` }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-l-full"
          style={{ background: "var(--success)", minWidth: strong > 0 ? 2 : 0 }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${moderatePct}%` }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "var(--warning)", minWidth: moderate > 0 ? 2 : 0 }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${weakPct}%` }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-r-full"
          style={{ background: "var(--muted-foreground)", minWidth: weak > 0 ? 2 : 0 }}
        />
      </div>
      <div className="mt-1.5 text-[10px] text-muted-foreground text-center">
        {strong} strong · {moderate} moderate · {weak} weak
      </div>
    </div>
  );
}

function SkillRow({ ev }: { ev: SkillEvidence }) {
  const [open, setOpen] = React.useState(false);
  const color =
    ev.level === "strong"
      ? "var(--success)"
      : ev.level === "moderate"
      ? "var(--warning)"
      : "var(--muted-foreground)";
  const strengthPct = Math.round((ev.strength ?? 0) * 100);
  return (
    <div
      className="rounded-lg border border-border/60 bg-card/40 overflow-hidden"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium line-clamp-1">{ev.competency}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Strength bar */}
          <div className="h-1 w-10 rounded-full bg-secondary/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strengthPct}%` }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground capitalize">{ev.level}</span>
          <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div className="px-3 pb-3 pt-1">
          <div className="flex gap-2 text-[12px] text-muted-foreground leading-relaxed bg-secondary/40 rounded-md p-2.5">
            <Quote className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
            <span className="line-clamp-2">{ev.evidence}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
