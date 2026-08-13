"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, MessageSquare, Target, CheckCircle2 } from "lucide-react";
import { useHireMind } from "@/lib/store";
import type { SkillEvidence, CompetencyState } from "@/lib/types";

const LEVEL_COLORS: Record<string, string> = {
  strong: "var(--success)",
  moderate: "var(--warning)",
  weak: "var(--muted-foreground)",
  unknown: "var(--muted)",
};

const STATUS_COLORS: Record<string, string> = {
  matched: "var(--success)",
  weak: "var(--warning)",
  unknown: "var(--muted)",
  gap: "var(--critical)",
};

function EvidenceNode({
  label,
  icon,
  level,
  source,
  delay = 0,
}: {
  label: string;
  icon: React.ReactNode;
  level: string;
  source?: string;
  delay?: number;
}) {
  const color = LEVEL_COLORS[level] ?? STATUS_COLORS[level] ?? "var(--muted-foreground)";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-1 min-w-[80px]"
    >
      <div
        className="relative flex items-center justify-center h-9 w-9 rounded-full border-2"
        style={{ borderColor: color, background: `color-mix(in oklch, ${color} 10%, transparent)` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-[10px] font-medium text-foreground text-center leading-tight max-w-[90px] truncate">
        {label}
      </span>
      <span className="text-[9px] text-muted-foreground capitalize">{level}</span>
      {source && (
        <span className="text-[8px] text-muted-foreground/60 capitalize">{source}</span>
      )}
    </motion.div>
  );
}

function ArrowConnector({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center h-9 w-8 shrink-0"
    >
      <svg width="100%" height="12" viewBox="0 0 32 12" preserveAspectRatio="none">
        <line x1="0" y1="6" x2="28" y2="6" stroke="var(--border)" strokeWidth="1.5" />
        <polygon points="28,2 32,6 28,10" fill="var(--border)" />
      </svg>
    </motion.div>
  );
}

function EvidenceRow({
  competency,
  jobReq,
  resumeEv,
  interviewEv,
  currentState,
  index,
}: {
  competency: string;
  jobReq?: { importance: string; required: boolean };
  resumeEv?: SkillEvidence;
  interviewEv?: SkillEvidence;
  currentState?: CompetencyState;
  index: number;
}) {
  const baseDelay = index * 0.12;
  const jobLevel = jobReq?.required ? "strong" : "moderate";
  const resumeLevel = resumeEv?.level ?? "unknown";
  const interviewLevel = interviewEv?.level ?? currentState?.interviewLevel ?? "unknown";
  const assessmentLevel = currentState?.status ?? "unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: baseDelay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center gap-0 py-3 border-b border-border/40 last:border-0"
    >
      <EvidenceNode
        label={competency}
        icon={<Target className="h-3.5 w-3.5" />}
        level={jobLevel}
        source="job"
        delay={baseDelay}
      />
      <ArrowConnector delay={baseDelay + 0.08} />
      <EvidenceNode
        label={resumeEv?.evidence ? truncate(resumeEv.evidence, 20) : "—"}
        icon={<FileText className="h-3.5 w-3.5" />}
        level={resumeLevel}
        source="resume"
        delay={baseDelay + 0.16}
      />
      <ArrowConnector delay={baseDelay + 0.24} />
      <EvidenceNode
        label={interviewEv?.evidence ? truncate(interviewEv.evidence, 20) : "—"}
        icon={<MessageSquare className="h-3.5 w-3.5" />}
        level={interviewLevel}
        source="interview"
        delay={baseDelay + 0.32}
      />
      <ArrowConnector delay={baseDelay + 0.4} />
      <EvidenceNode
        label={assessmentLabel(assessmentLevel)}
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        level={assessmentLevel}
        source="assessment"
        delay={baseDelay + 0.48}
      />
    </motion.div>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function assessmentLabel(status: string): string {
  if (status === "matched") return "Matched";
  if (status === "weak") return "Weak";
  if (status === "gap") return "Gap";
  return "Unknown";
}

export function EvidenceGraph() {
  const { candidate, job, interview, match } = useHireMind();
  const [open, setOpen] = React.useState(false);

  if (!candidate || !job) return null;

  // Build the top 5 competencies from match rows (by contribution)
  const topRows = match
    ? [...match.rows].sort((a, b) => b.contribution - a.contribution).slice(0, 5)
    : job.requirements.slice(0, 5).map((r) => ({
        competency: r.competency,
        category: r.category,
        required: r.required,
        importance: r.importance,
        candidateLevel: "unknown" as const,
        status: "unknown" as const,
        evidence: null,
        semanticScore: 0,
        contribution: 0,
      }));

  // Build evidence maps
  const resumeByComp = new Map<string, SkillEvidence>();
  const interviewByComp = new Map<string, SkillEvidence>();
  for (const ev of candidate.evidence) {
    if (ev.source === "resume") resumeByComp.set(ev.competency, ev);
    else interviewByComp.set(ev.competency, ev);
  }
  const compStates = new Map<string, CompetencyState>();
  if (interview) {
    for (const cs of interview.competencyStates) {
      compStates.set(cs.competency, cs);
    }
  }

  const jobReqByComp = new Map<string, { importance: string; required: boolean }>();
  for (const r of job.requirements) {
    jobReqByComp.set(r.competency, { importance: r.importance, required: r.required });
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-accent-blue-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Hide evidence graph" : "Show evidence graph"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="hm-card p-5 mt-3">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Evidence chain — top competencies
              </div>

              {/* Column headers */}
              <div className="flex items-center justify-center gap-0 mb-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="min-w-[80px] text-center">Job Reqd</span>
                <span className="w-8" />
                <span className="min-w-[80px] text-center">Resume</span>
                <span className="w-8" />
                <span className="min-w-[80px] text-center">Interview</span>
                <span className="w-8" />
                <span className="min-w-[80px] text-center">Assessment</span>
              </div>

              <div>
                {topRows.map((row, i) => (
                  <EvidenceRow
                    key={row.competency}
                    competency={row.competency}
                    jobReq={jobReqByComp.get(row.competency)}
                    resumeEv={resumeByComp.get(row.competency)}
                    interviewEv={interviewByComp.get(row.competency)}
                    currentState={compStates.get(row.competency)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: (string | false | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}
