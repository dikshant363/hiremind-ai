"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, FolderGit2, GraduationCap, Briefcase, Quote, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireMind } from "@/lib/store";
import type { SkillEvidence } from "@/lib/types";
import { EvidenceGraph } from "./evidence-graph";
import { SkillHeatmap } from "./skill-heatmap";

export function CandidateView() {
  const { candidate, job, isDemo, meta, setView } = useHireMind();
  if (!candidate || !job) return null;

  const strongSkills = candidate.evidence.filter((e) => e.level === "strong");
  const moderateSkills = candidate.evidence.filter((e) => e.level === "moderate");
  const weakSkills = candidate.evidence.filter((e) => e.level === "weak");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Candidate Intelligence</div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Here's what we found.</h1>
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
        {/* Profile summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="hm-card p-4 sm:p-6 lg:col-span-1"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[12px] font-semibold">
              {candidate.name?.[0] ?? "C"}
            </span>
            <div>
              <div className="text-sm font-semibold">{candidate.name ?? "Candidate"}</div>
              <div className="text-[11px] text-muted-foreground">{job.title}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{candidate.summary}</p>

          <div className="mt-5 space-y-3 text-[12px]">
            <Stat label="Skills detected" value={candidate.skills.length} />
            <Stat label="Evidence snippets" value={candidate.evidence.length} />
            <Stat label="Experience entries" value={candidate.experience.length} />
            <Stat label="Projects" value={candidate.projects.length} />
            <Stat label="Education" value={candidate.education.length} />
          </div>
        </motion.div>

        {/* Skills with evidence */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hm-card p-4 sm:p-6 lg:col-span-2"
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

          {candidate.experience.length > 0 && (
            <>
              <div className="hm-divider my-5" />
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Experience</h4>
              <div className="space-y-3">
                {candidate.experience.map((x, i) => (
                  <div key={i} className="flex gap-3">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <div className="text-sm font-medium line-clamp-1">
                        {x.role}
                        {x.company && <span className="text-muted-foreground"> · {x.company}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{x.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {candidate.projects.length > 0 && (
            <>
              <div className="hm-divider my-5" />
              <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Projects</h4>
              <div className="space-y-3">
                {candidate.projects.map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.description}</div>
                    </div>
                  </div>
                ))}
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

      <EvidenceGraph />

      <div className="mt-8 flex items-center justify-between">
        {(meta.resumeFallback || meta.jobFallback) && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 text-warning-foreground px-3 py-1.5 text-[11px]">
            <AlertCircle className="h-3 w-3" />
            Some parsing used deterministic fallback (AI was slow/unavailable). Results are still valid.
          </div>
        )}
        <Button onClick={() => setView("match")} className="ml-auto gap-2">
          See your job match <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
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

function SkillRow({ ev }: { ev: SkillEvidence }) {
  const [open, setOpen] = React.useState(false);
  const color =
    ev.level === "strong"
      ? "var(--success)"
      : ev.level === "moderate"
      ? "var(--warning)"
      : "var(--muted-foreground)";
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
        <div className="flex items-center gap-3">
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
