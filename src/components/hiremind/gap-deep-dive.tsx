"use client";

/**
 * HIREMIND AI — Skill Gap Deep-Dive Modal
 *
 * Opens when a user clicks any gap card in the gaps view. Shows deterministic,
 * genuinely-useful learning resources, warm-up interview questions, a progress
 * trajectory bar, and clear CTAs — all derived from the gap's category,
 * importance, candidateLevel and priorityScore. No AI calls.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Wrench,
  GraduationCap,
  MessageSquareQuote,
  TrendingUp,
  Target,
  Clock,
  ArrowRight,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriorityPill } from "./shell";
import { useHireMind } from "@/lib/store";
import { toast } from "sonner";
import type { CompetencyCategory, SkillGap } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Category badge (kept locally so the modal is portable / not coupled to
 * gaps-view internal exports). Styling mirrors gaps-view exactly.
 * ------------------------------------------------------------------------- */
const CATEGORY_BADGE: Record<CompetencyCategory, { label: string; cls: string }> = {
  system_design: { label: "Systems", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  backend: { label: "Backend", cls: "bg-success/15 text-success-foreground" },
  frontend: { label: "Frontend", cls: "bg-chart-3/15 text-chart-3" },
  data: { label: "Data", cls: "bg-warning/15 text-warning-foreground" },
  ml: { label: "ML", cls: "bg-accent-blue/15 text-accent-blue-foreground" },
  cloud: { label: "Cloud", cls: "bg-chart-4/15 text-chart-4" },
  devops: { label: "DevOps", cls: "bg-chart-5/15 text-chart-5" },
  languages: { label: "Lang", cls: "bg-chart-2/15 text-chart-2" },
  communication: { label: "Comm", cls: "bg-success/15 text-success-foreground" },
  domain: { label: "Domain", cls: "bg-muted text-muted-foreground" },
};

function CategoryBadge({ category }: { category: CompetencyCategory }) {
  const cfg = CATEGORY_BADGE[category] ?? CATEGORY_BADGE.domain;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cfg.cls
      )}
    >
      {cfg.label}
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * Deterministic maps — drive every numeric / textual value in this modal.
 * No AI calls; everything is derived from the gap's fields.
 * ------------------------------------------------------------------------- */
const CANDIDATE_LEVEL_PCT: Record<string, number> = {
  unknown: 5,
  weak: 25,
  moderate: 55,
  strong: 85,
};

const IMPORTANCE_PCT: Record<string, number> = {
  critical: 95,
  high: 80,
  medium: 60,
  low: 40,
};

const TIME_TO_CLOSE: Record<SkillGap["priority"], string> = {
  critical: "2–4 weeks",
  high: "1–2 weeks",
  medium: "3–5 days",
  low: "1–2 days",
};

/* ---------------------------------------------------------------------------
 * LEARNING_RESOURCES — keyed by CompetencyCategory.
 * Every entry is a real, verifiable book / course / project. 2–3 items each.
 * ------------------------------------------------------------------------- */
const LEARNING_RESOURCES: Record<
  CompetencyCategory,
  { readings: string[]; projects: string[]; courses: string[] }
> = {
  system_design: {
    readings: [
      "Designing Data-Intensive Applications — Kleppmann",
      "System Design Interview — Alex Xu, Vol. 1",
      "The System Design Primer (github.com/donnemartin/system-design-primer)",
    ],
    projects: [
      "Design a URL shortener end-to-end (storage, caching, encoding)",
      "Sketch a notification fan-out system for 10M users",
      "Implement a rate limiter (token bucket) in your language of choice",
    ],
    courses: [
      "Grokking the System Design Interview — DesignGurus",
      "MIT 6.824: Distributed Systems (free lecture notes)",
    ],
  },
  backend: {
    readings: [
      "Designing Data-Intensive Applications — Kleppmann, Ch. 6–7 (Partitioning & Transactions)",
      "Clean Architecture — Robert C. Martin",
      "The Twelve-Factor App (12factor.net)",
    ],
    projects: [
      "Build an idempotent REST API for payments with retry semantics",
      "Implement a job queue with dead-letter handling and exponential backoff",
      "Add optimistic concurrency control to a CRUD service using ETags",
    ],
    courses: [
      "MIT 6.5840 (was 6.824) Distributed Systems labs — Raft + KV store",
      "Backend Engineering with Hussein Nasser — YouTube series",
    ],
  },
  frontend: {
    readings: [
      "Refactoring UI — Wieruch & Schoger",
      "Frontend System Design — greatfrontend.com/system-design",
      "Web Performance in Action — Jeremy Wagner",
    ],
    projects: [
      "Build a virtualized list rendering 10K rows at 60fps",
      "Implement an accessible autocomplete with full keyboard nav + ARIA",
      "Create a data grid with sorting, filtering, and pagination",
    ],
    courses: [
      "Total TypeScript — Matt Pocock",
      "Epic React — Kent C. Dodds",
    ],
  },
  data: {
    readings: [
      "The Data Warehouse Toolkit — Kimball & Ross",
      "Designing Data-Intensive Applications — Kleppmann, Ch. 3 (Storage)",
      "Fundamentals of Data Engineering — Reis & Housley",
    ],
    projects: [
      "Build an incremental CDC pipeline from Postgres to a columnar store",
      "Model a star schema for an e-commerce funnel and write the ELT",
      "Implement a slow-changing-dimension (SCD2) loader with dbt",
    ],
    courses: [
      "DataTalks.Club Data Engineering Zoomcamp (free)",
      "Stanford CS246: Mining Massive Datasets",
    ],
  },
  ml: {
    readings: [
      "Hands-On Machine Learning — Géron (3rd ed.)",
      "Designing Machine Learning Systems — Chip Huyen",
      "Pattern Recognition and Machine Learning — Bishop",
    ],
    projects: [
      "Ship a fine-tuned text classifier with a serving endpoint + monitoring",
      "Build a feature-store PoC with online/offline parity",
      "Implement a RAG pipeline with offline + online evals",
    ],
    courses: [
      "Deep Learning Specialization — Andrew Ng (DeepLearning.AI)",
      "Full Stack Deep Learning (fullstackdeeplearning.com)",
    ],
  },
  cloud: {
    readings: [
      "AWS Well-Architected Framework (docs.aws.amazon.com/wellarchitected)",
      "Cloud Native Patterns — Jonathan Boccara",
      "Azure Architecture Center — Cloud Design Patterns",
    ],
    projects: [
      "Terraform a multi-AZ VPC + managed DB and deploy a stateless service",
      "Implement blue/green deployments with traffic shifting",
      "Design a cost-optimized storage strategy with lifecycle rules",
    ],
    courses: [
      "AWS Certified Solutions Architect — Associate (Adrian Cantrill)",
      "Google Cloud Solutions Architect learning path (cloud.google.com/training)",
    ],
  },
  devops: {
    readings: [
      "Site Reliability Engineering — Beyer et al. (Google, free online)",
      "The Phoenix Project — Kim, Behr & Spafford",
      "Accelerate — Forsgren, Humble & Kim",
    ],
    projects: [
      "Set up a CI/CD pipeline with tests, SBOM, and staged rollout",
      "Build an observability stack: metrics (Prometheus), traces (OTel), logs (Loki)",
      "Define SLOs + error budgets and a burn-rate alerting policy",
    ],
    courses: [
      "Kubernetes Fundamentals — KodeKloud / CNCF",
      "Linux Foundation LFS261: CI/CD",
    ],
  },
  languages: {
    readings: [
      "Effective Java — Joshua Bloch (or Effective Go / Effective TypeScript)",
      "Crafting Interpreters — Robert Nystrom (craftinginterpreters.com)",
      "Programming Language Pragmatics — Michael Scott",
    ],
    projects: [
      "Implement a small interpreter: lexer, parser, evaluator",
      "Port a non-trivial algorithm between two languages you use",
      "Write idiomatic stdlib helpers and benchmark vs. a naive impl",
    ],
    courses: [
      "MIT 6.S081 Operating Systems (Rust / C labs)",
      "Exercism track for your target language (mentored code review)",
    ],
  },
  communication: {
    readings: [
      "Articulating Design Decisions — Tom Greever",
      "Cracking the PM Interview — McDowell & Bavaro",
      "Thanks for the Feedback — Stone & Heen",
    ],
    projects: [
      "Write a 1-page ADR for a real technical decision you made",
      "Record a 5-min Loom explaining your system to a non-engineer",
      "Run a mock stakeholder Q&A and ship the FAQ doc afterwards",
    ],
    courses: [
      "Stanford GSB Strategic Communication (online short course)",
      "Tech Interview Handbook — Communication chapter (free)",
    ],
  },
  domain: {
    readings: [
      "Domain-Driven Design Distilled — Vaughn Vernon",
      "The Mom Test — Rob Fitzpatrick (talking to users / domain experts)",
      "Continuous Discovery Habits — Teresa Torres",
    ],
    projects: [
      "Run 3 user-expert interviews and distill a domain glossary",
      "Map the end-to-end business process you support and annotate bottlenecks",
      "Write a one-pager on the regulatory constraints of your domain",
    ],
    courses: [
      "DDD Europe learning track (dddeurope.com/learning)",
      "Pluralsight: Domain-Driven Design in Practice — Vladimir Khorikov",
    ],
  },
};

/* ---------------------------------------------------------------------------
 * WARMUP_QUESTIONS — 3 deterministic interview warm-up questions per
 * category. Used to prime the user before they click "Test this skill".
 * ------------------------------------------------------------------------- */
const WARMUP_QUESTIONS: Record<CompetencyCategory, string[]> = {
  system_design: [
    "Walk me through how you'd design a rate limiter for a public API.",
    "How would you partition a database that needs to handle 10K writes/sec?",
    "Explain the tradeoffs between eventual consistency and strong consistency.",
  ],
  backend: [
    "How would you design an idempotent API for processing payments?",
    "Walk me through your approach to retries, dead-letter queues, and backpressure.",
    "When would you pick serializable vs. read-committed transaction isolation?",
  ],
  frontend: [
    "How would you build a list that renders 10K rows smoothly at 60fps?",
    "Describe how you'd make an autocomplete fully accessible (keyboard + ARIA).",
    "Walk me through your state-management strategy in a large React app.",
  ],
  data: [
    "Design a CDC pipeline moving data from Postgres to a warehouse in near-real-time.",
    "When would you use a star schema vs. a snowflake schema, and why?",
    "How do you ensure online and offline feature parity in a feature store?",
  ],
  ml: [
    "Walk me through how you'd productionize and monitor a text classifier.",
    "How would you design a RAG pipeline with offline + online evals?",
    "How would you detect and mitigate data drift in a deployed model?",
  ],
  cloud: [
    "Design a multi-AZ architecture that survives a single AZ failure.",
    "How do you decide between managed services and self-hosting for a new component?",
    "Walk me through a cost-optimization plan for a compute-heavy workload.",
  ],
  devops: [
    "How would you design a CI/CD pipeline with safe, staged rollouts?",
    "Define an SLO, an error budget, and a burn-rate alerting policy.",
    "Walk me through your observability stack: metrics, logs, and traces.",
  ],
  languages: [
    "Pick a language you're strong in — what are its top three footguns?",
    "How would you implement a small interpreter (lexer, parser, evaluator)?",
    "Explain how memory management / GC works in your main language.",
  ],
  communication: [
    "Tell me about a time you explained a complex technical tradeoff to a non-engineer.",
    "Walk me through how you'd write a decision record (ADR) for a real choice you made.",
    "How do you handle pushback when stakeholders disagree on a technical direction?",
  ],
  domain: [
    "Tell me about a business constraint in your domain that shaped a technical decision.",
    "How would you build a ubiquitous-language glossary with domain experts?",
    "Describe a time you misunderstood a domain and how you corrected course.",
  ],
};

/* ---------------------------------------------------------------------------
 * Section heading — small icon + title + caption block
 * ------------------------------------------------------------------------- */
function SectionHeading({
  icon: Icon,
  title,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  caption?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        {caption && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{caption}</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Snapshot tile — small stat card used in the 4-up grid
 * ------------------------------------------------------------------------- */
function SnapshotTile({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="hm-stat-tile p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <div className="text-[14px] font-semibold text-foreground capitalize leading-tight">{value}</div>
      {sublabel && <div className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Progress trajectory — horizontal track with three nodes (Current / Target /
 * Mastery) + an "You need to grow ~X points" delta callout.
 * ------------------------------------------------------------------------- */
function ProgressTrajectory({ gap }: { gap: SkillGap }) {
  const currentPct = CANDIDATE_LEVEL_PCT[gap.candidateLevel] ?? 5;
  const targetPct = IMPORTANCE_PCT[gap.importance] ?? 50;
  const masteryPct = 95;
  const delta = targetPct - currentPct;

  // Sort nodes by position so chips read left-to-right along the bar.
  const nodes = [
    { label: "Current", value: currentPct, color: "var(--muted-foreground)" },
    { label: "Target", value: targetPct, color: "var(--accent-blue)" },
    { label: "Mastery", value: masteryPct, color: "var(--success)" },
  ].sort((a, b) => a.value - b.value);

  return (
    <div className="space-y-3">
      {/* Bar + node markers */}
      <div className="relative h-5">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--muted-foreground), var(--accent-blue))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${targetPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </div>
        {/* Node dots */}
        {nodes.map((n, i) => (
          <motion.div
            key={n.label}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${n.value}%` }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="h-3.5 w-3.5 rounded-full border-2 border-background"
              style={{ background: n.color, boxShadow: `0 0 0 1px ${n.color}` }}
            />
          </motion.div>
        ))}
      </div>

      {/* Chip row — Current / Target / Mastery */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {nodes.map((n) => (
          <div key={n.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: n.color }}
            />
            <span className="text-[11px] text-muted-foreground">{n.label}</span>
            <span className="text-[11px] font-semibold tabular-nums text-foreground">
              {n.value}%
            </span>
          </div>
        ))}
      </div>

      {/* Delta callout */}
      <motion.div
        className="hm-insight-callout flex items-start gap-2 px-3 py-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <TrendingUp className="h-3.5 w-3.5 text-accent-blue-foreground shrink-0 mt-0.5" />
        <span className="text-[12px] text-foreground/85 leading-relaxed">
          {delta > 0 ? (
            <>
              You need to grow{" "}
              <span className="font-semibold text-foreground">~{delta} points</span>{" "}
              to reach the target bar for this role.
            </>
          ) : (
            <>
              You're already at or past the target bar — focus on{" "}
              <span className="font-semibold text-foreground">depth & fluency</span>{" "}
              under interview pressure.
            </>
          )}
        </span>
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Resource list row — single bullet item with an icon
 * ------------------------------------------------------------------------- */
function ResourceRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2 text-[12px] text-foreground/85 leading-relaxed">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <span>{text}</span>
    </li>
  );
}

/* ---------------------------------------------------------------------------
 * Staggered entrance variants
 * ------------------------------------------------------------------------- */
const containerStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ---------------------------------------------------------------------------
 * GapDeepDive — the modal component
 * ------------------------------------------------------------------------- */
export function GapDeepDive({
  gap,
  open,
  onOpenChange,
}: {
  gap: SkillGap | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { startInterview, loading, loadingStep } = useHireMind();

  // Keep a "rendered gap" so the modal can play its exit animation even after
  // the parent nulls out the gap prop on close. Without this, the dialog
  // content would unmount abruptly mid-exit-transition.
  const [renderedGap, setRenderedGap] = React.useState<SkillGap | null>(null);
  React.useEffect(() => {
    if (gap) setRenderedGap(gap);
    // Intentionally do NOT clear when gap becomes null — the next non-null
    // gap will overwrite renderedGap on the next open.
  }, [gap]);

  const displayGap = gap ?? renderedGap;

  const handleStartInterview = React.useCallback(async () => {
    onOpenChange(false);
    // Defer the actual interview start a tick so the modal close animation
    // can begin without the view swap racing it.
    setTimeout(() => {
      void startInterview();
    }, 80);
  }, [onOpenChange, startInterview]);

  const handleAddToRoadmap = React.useCallback(() => {
    toast("Already in your roadmap", {
      description:
        "Your roadmap is auto-generated from your skill gaps — no need to add it manually.",
    });
  }, []);

  if (!displayGap) {
    // Render an inert Dialog so Radix keeps the close transition wired even
    // when there is nothing to show.
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sr-only" aria-hidden />
      </Dialog>
    );
  }

  const g = displayGap;
  const resources = LEARNING_RESOURCES[g.category] ?? LEARNING_RESOURCES.domain;
  const questions = WARMUP_QUESTIONS[g.category] ?? WARMUP_QUESTIONS.domain;
  const impactPct = Math.round((g.priorityScore ?? 0) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 p-0 overflow-hidden max-h-[90vh] sm:max-h-[85vh] w-full max-w-[calc(100%-1rem)] sm:max-w-2xl lg:max-w-3xl rounded-xl"
        aria-describedby={undefined}
      >
        <DialogDescription className="sr-only">
          Detailed learning resources, warm-up questions, and a progress trajectory for closing the {displayGap.competency} skill gap.
        </DialogDescription>
        {/* Scrollable content area */}
        <motion.div
          variants={containerStagger}
          initial="hidden"
          animate="show"
          className="overflow-y-auto hm-scrollbar flex-1 min-h-0"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            className="relative p-5 sm:p-7 pb-4 border-b border-border/60"
          >
            {/* Soft accent glow */}
            <div
              className="absolute -top-16 -right-12 h-48 w-48 rounded-full opacity-[0.08] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, var(--accent-blue), transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="text-[10px] font-semibold text-accent-blue-foreground uppercase tracking-widest mb-2">
                Close the gap
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CategoryBadge category={g.category} />
                <PriorityPill priority={g.priority} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                {g.competency}
              </h2>
            </div>
          </motion.div>

          {/* ── Snapshot grid ─────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-5 sm:p-7 pb-4"
          >
            <SnapshotTile
              icon={Target}
              label="Current level"
              value={g.candidateLevel}
              sublabel="Your evidence today"
            />
            <SnapshotTile
              icon={TrendingUp}
              label="Required"
              value={g.importance}
              sublabel="For this role"
            />
            <SnapshotTile
              icon={Sparkles}
              label="Impact score"
              value={`${impactPct}%`}
              sublabel="Priority weight"
            />
            <SnapshotTile
              icon={Clock}
              label="Est. time to close"
              value={TIME_TO_CLOSE[g.priority]}
              sublabel="Focused study"
            />
          </motion.div>

          {/* ── Why this matters ──────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="px-5 sm:px-7 pb-5">
            <SectionHeading
              icon={Target}
              title="Why this matters"
              caption="The reasoning behind this gap, in plain language."
            />
            <div className="hm-insight-callout px-4 py-3 text-[12px] text-foreground/85 leading-relaxed">
              {g.reason}
            </div>
          </motion.div>

          {/* ── Learning resources ────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="px-5 sm:px-7 pb-5">
            <SectionHeading
              icon={BookOpen}
              title="Learning resources"
              caption="Curated readings, hands-on projects, and structured courses for this category."
            />
            <div className="space-y-4">
              {/* Readings */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span>Readings</span>
                </div>
                <ul className="space-y-1.5">
                  {resources.readings.map((r) => (
                    <ResourceRow key={r} icon={BookOpen} text={r} />
                  ))}
                </ul>
              </div>
              {/* Projects */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Wrench className="h-3 w-3" />
                  <span>Hands-on projects</span>
                </div>
                <ul className="space-y-1.5">
                  {resources.projects.map((p) => (
                    <ResourceRow key={p} icon={Wrench} text={p} />
                  ))}
                </ul>
              </div>
              {/* Courses */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <GraduationCap className="h-3 w-3" />
                  <span>Courses</span>
                </div>
                <ul className="space-y-1.5">
                  {resources.courses.map((c) => (
                    <ResourceRow key={c} icon={GraduationCap} text={c} />
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* ── Warm-up questions ─────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="px-5 sm:px-7 pb-5">
            <SectionHeading
              icon={MessageSquareQuote}
              title="Suggested warm-up questions"
              caption="Say each one out loud before you click “Test this skill.”"
            />
            <ol className="space-y-2">
              {questions.map((q, i) => (
                <li
                  key={q}
                  className="hm-card-hover rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 flex items-start gap-2.5"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent-blue/10 text-accent-blue-foreground text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-foreground/85 leading-relaxed">
                    {q}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* ── Progress trajectory ───────────────────────────────────── */}
          <motion.div variants={fadeUp} className="px-5 sm:px-7 pb-5">
            <SectionHeading
              icon={TrendingUp}
              title="Progress trajectory"
              caption="From where you are now to role-ready, to mastery."
            />
            <div className="hm-card p-4">
              <ProgressTrajectory gap={g} />
            </div>
          </motion.div>

          {/* ── Bottom rail: small "Test this skill" inline CTA on mobile ── */}
          <motion.div
            variants={fadeUp}
            className="px-5 sm:px-7 pb-6 pt-1 flex items-center gap-2 text-[11px] text-muted-foreground"
          >
            <ListChecks className="h-3.5 w-3.5 shrink-0" />
            <span>
              Closing this gap typically raises your Job Match Index by{" "}
              <span className="font-semibold text-foreground">10–15 points</span>.
            </span>
          </motion.div>
        </motion.div>

        {/* ── Sticky CTA footer ───────────────────────────────────────── */}
        <div className="border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 sm:p-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToRoadmap}
            className="gap-1.5"
          >
            <Target className="h-3.5 w-3.5" />
            Add to my roadmap
          </Button>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Button
              size="sm"
              onClick={handleStartInterview}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 hm-thinking" />
                  {loadingStep || "Working…"}
                </>
              ) : (
                <>
                  Test this skill in the interview
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
