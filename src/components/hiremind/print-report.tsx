"use client";

/**
 * PrintReport — premium, print-optimized PDF report component.
 *
 * Renders ALL session data (candidate, job match, gaps, interview,
 * readiness, roadmap) as a clean, document-like report. The component
 * is hidden offscreen on screen (see `.hm-print-report` in globals.css)
 * and revealed only when the browser enters print media (window.print()).
 *
 * Pulls data from the same Zustand store as the rest of the app — no
 * prop drilling. Uses semantic HTML (<h1>/<h2>/<table>) for clean
 * print output and accessibility. Score badges use inline style backgrounds
 * (with print-color-adjust: exact) so colors survive the print pipeline.
 */

import * as React from "react";
import { useHireMind } from "@/lib/store";
import type {
  CompetencyCategory,
  SkillLevel,
  GapPriority,
} from "@/lib/types";

/* ---------------------------------------------------------------------------
 * Label / color lookups — kept local so the report is self-contained and
 * doesn't depend on Tailwind classes that print engines may strip.
 * ------------------------------------------------------------------------- */

const CATEGORY_LABEL: Record<CompetencyCategory, string> = {
  system_design: "System Design",
  backend: "Backend",
  frontend: "Frontend",
  data: "Data",
  ml: "Machine Learning",
  cloud: "Cloud",
  devops: "DevOps",
  languages: "Languages",
  communication: "Communication",
  domain: "Domain",
};

const SKILL_LEVEL_LABEL: Record<SkillLevel, string> = {
  unknown: "Unknown",
  weak: "Weak",
  moderate: "Moderate",
  strong: "Strong",
};

/** Band → hex color for the big index numbers and band labels. */
const BAND_COLOR: Record<string, string> = {
  low: "#c95a4f", // critical red
  fair: "#c79654", // amber
  good: "#4f6082", // slate blue
  strong: "#3a8a73", // success green
};

/** Priority → hex color for the gap priority badges. */
const PRIORITY_COLOR: Record<GapPriority, string> = {
  critical: "#c95a4f",
  high: "#c79654",
  medium: "#4f6082",
  low: "#6b7280",
};

const PRIORITY_LABEL: Record<GapPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/* Document serif stack — premium, document-like feel. */
const SERIF_FONT =
  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

/* Reusable muted color tokens for print (kept light to save ink). */
const INK_PRIMARY = "#1a1a2e";
const INK_SECONDARY = "#5a5a6e";
const INK_MUTED = "#8a8a96";
const RULE_COLOR = "#d4d4d8";
const TABLE_HEAD_BG = "#f4f4f5";

/* ---------------------------------------------------------------------------
 * Small presentational helpers
 * ------------------------------------------------------------------------- */

/** Colored score badge — uses inline styles + print-color-adjust: exact so
 *  the background color is preserved when printing to PDF. */
function ScoreBadge({
  value,
  color,
  label,
}: {
  value: string;
  color: string;
  label?: string;
}) {
  return (
    <span
      className="hm-print-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "2.25rem",
        height: "1.35rem",
        padding: "0 0.45rem",
        borderRadius: "0.25rem",
        background: color,
        color: "#ffffff",
        fontWeight: 600,
        fontSize: "0.72rem",
        letterSpacing: "0.01em",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
      }}
    >
      {value}
      {label ? <span style={{ marginLeft: "0.2rem", fontWeight: 500, fontSize: "0.62rem", opacity: 0.9 }}>{label}</span> : null}
    </span>
  );
}

/** A "big number" hero block used for the two indices. */
function IndexHero({
  index,
  band,
  headline,
  title,
}: {
  index: number;
  band: "low" | "fair" | "good" | "strong";
  headline: string;
  title: string;
}) {
  const color = BAND_COLOR[band] ?? INK_SECONDARY;
  const bandLabel = band.charAt(0).toUpperCase() + band.slice(1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "0.75rem" }}>
      <div
        className="hm-print-badge"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "5.5rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "0.4rem",
          background: color,
          color: "#ffffff",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: "1.9rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {index}
        </span>
        <span style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.92, marginTop: "0.15rem" }}>
          / 100
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.15rem" }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.2rem" }}>
          <span style={{ fontFamily: SERIF_FONT, fontSize: "1.05rem", fontWeight: 700, color: INK_PRIMARY }}>{bandLabel}</span>
          <span style={{ fontSize: "0.7rem", color: INK_MUTED }}>band</span>
        </div>
        <p style={{ fontSize: "0.82rem", color: INK_SECONDARY, lineHeight: 1.4, margin: 0 }}>{headline}</p>
      </div>
    </div>
  );
}

/** Section heading — numbered, serif, with a thin bottom rule. */
function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <h2
      style={{
        fontFamily: SERIF_FONT,
        fontSize: "1.05rem",
        fontWeight: 700,
        color: INK_PRIMARY,
        margin: "0 0 0.6rem 0",
        paddingBottom: "0.35rem",
        borderBottom: `1.5px solid ${RULE_COLOR}`,
        display: "flex",
        alignItems: "baseline",
        gap: "0.55rem",
      }}
    >
      <span style={{ color: INK_MUTED, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", fontVariantNumeric: "tabular-nums" }}>
        {String(n).padStart(2, "0")}
      </span>
      <span>{title}</span>
    </h2>
  );
}

/** Wrapper for a major section — page-break-after via the CSS class. */
function Section({
  n,
  title,
  children,
  last = false,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={`hm-print-section${last ? " hm-print-section-last" : ""}`}
      style={{ marginBottom: "1.25rem" }}
    >
      <SectionHeading n={n} title={title} />
      {children}
    </section>
  );
}

/* Shared table styles applied via inline style on each <table> / cell. */
const TABLE_STYLE: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.78rem",
  lineHeight: 1.4,
};
const TH_STYLE: React.CSSProperties = {
  textAlign: "left",
  padding: "0.4rem 0.5rem",
  fontWeight: 600,
  fontSize: "0.68rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: INK_SECONDARY,
  background: TABLE_HEAD_BG,
  border: `0.5px solid ${RULE_COLOR}`,
  verticalAlign: "bottom",
};
const TD_STYLE: React.CSSProperties = {
  padding: "0.4rem 0.5rem",
  border: `0.5px solid ${RULE_COLOR}`,
  verticalAlign: "top",
  color: INK_PRIMARY,
};

/* ---------------------------------------------------------------------------
 * Main component
 * ------------------------------------------------------------------------- */

export function PrintReport() {
  const { candidate, job, match, gaps, interview, readiness, roadmap } = useHireMind();

  // Defensive: if there's no candidate at all, render a minimal placeholder
  // so the print pipeline still produces a valid (mostly empty) document.
  if (!candidate) {
    return (
      <div id="hm-print-report" className="hm-print-report">
        <p style={{ fontFamily: SERIF_FONT, color: INK_SECONDARY }}>
          No candidate data available for this report.
        </p>
      </div>
    );
  }

  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Top skills — first 12, capped.
  const topSkills = candidate.skills.slice(0, 12);

  // Average interview score (0..100), rounded.
  const interviewAvg =
    interview && interview.evaluations.length > 0
      ? Math.round(
          (interview.evaluations.reduce((s, e) => s + e.overall, 0) /
            interview.evaluations.length) *
            100
        )
      : null;

  return (
    <div id="hm-print-report" className="hm-print-report">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header style={{ marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: `2px solid ${INK_PRIMARY}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <div style={{ fontFamily: SERIF_FONT, fontSize: "1.6rem", fontWeight: 700, color: INK_PRIMARY, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              HireMind AI
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: INK_MUTED, marginTop: "0.2rem" }}>
              Assessment Report
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "0.72rem", color: INK_SECONDARY, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: INK_PRIMARY }}>{candidate.name ?? "Anonymous candidate"}</div>
            <div>{job?.title ?? "Target role not specified"}</div>
            <div style={{ color: INK_MUTED, marginTop: "0.15rem" }}>Generated {generatedDate}</div>
          </div>
        </div>
      </header>

      {/* ── Section 1: Candidate Profile Summary ───────────────────── */}
      <Section n={1} title="Candidate Profile Summary">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem", marginBottom: "0.6rem" }}>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.15rem" }}>Name</div>
            <div style={{ fontSize: "0.85rem", color: INK_PRIMARY, fontWeight: 600 }}>{candidate.name ?? "Anonymous candidate"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.15rem" }}>Target Role</div>
            <div style={{ fontSize: "0.85rem", color: INK_PRIMARY, fontWeight: 600 }}>{job?.title ?? "Not specified"}</div>
          </div>
        </div>

        {candidate.summary ? (
          <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: INK_SECONDARY, margin: "0 0 0.6rem 0" }}>
            {candidate.summary}
          </p>
        ) : null}

        {topSkills.length > 0 ? (
          <div style={{ marginBottom: "0.6rem" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.25rem" }}>
              Top skills ({Math.min(12, candidate.skills.length)} of {candidate.skills.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {topSkills.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="hm-print-badge"
                  style={{
                    display: "inline-block",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "0.25rem",
                    background: "#eef0f4",
                    color: INK_PRIMARY,
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    border: `0.5px solid ${RULE_COLOR}`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
          <Stat label="Experience" value={candidate.experience.length} />
          <Stat label="Projects" value={candidate.projects.length} />
          <Stat label="Certifications" value={candidate.certifications.length} />
        </div>
      </Section>

      {/* ── Section 2: Job Match Index ─────────────────────────────── */}
      {match ? (
        <Section n={2} title="Job Match Index">
          <IndexHero
            index={match.index}
            band={match.band}
            headline={match.headline}
            title="Match Index"
          />
          <table className="hm-print-table" style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Component</th>
                <th style={{ ...TH_STYLE, width: "3.5rem", textAlign: "right" }}>Weight</th>
                <th style={{ ...TH_STYLE, width: "3.5rem", textAlign: "right" }}>Score</th>
                <th style={TH_STYLE}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {match.components.map((c, i) => (
                <tr key={`mc-${i}`}>
                  <td style={{ ...TD_STYLE, fontWeight: 600 }}>{c.label}</td>
                  <td style={{ ...TD_STYLE, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(c.weight * 100)}%</td>
                  <td style={{ ...TD_STYLE, textAlign: "right" }}>
                    <ScoreBadge value={String(Math.round(c.score * 100))} color={BAND_COLOR[c.score >= 0.7 ? "strong" : c.score >= 0.5 ? "good" : c.score >= 0.3 ? "fair" : "low"]} />
                  </td>
                  <td style={{ ...TD_STYLE, color: INK_SECONDARY }}>{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      {/* ── Section 3: Skill Gaps ──────────────────────────────────── */}
      {gaps && gaps.length > 0 ? (
        <Section n={3} title="Skill Gaps">
          <p style={{ fontSize: "0.78rem", color: INK_SECONDARY, margin: "0 0 0.6rem 0", lineHeight: 1.45 }}>
            {gaps.length} {gaps.length === 1 ? "gap" : "gaps"} identified between your current evidence and the target role&apos;s requirements, ranked by impact.
          </p>
          <table className="hm-print-table" style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Competency</th>
                <th style={{ ...TH_STYLE, width: "5rem" }}>Category</th>
                <th style={{ ...TH_STYLE, width: "4.5rem" }}>Priority</th>
                <th style={{ ...TH_STYLE, width: "4.5rem" }}>Importance</th>
                <th style={{ ...TH_STYLE, width: "5rem" }}>Your level</th>
                <th style={TH_STYLE}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={`gap-${i}`}>
                  <td style={{ ...TD_STYLE, fontWeight: 600 }}>{g.competency}</td>
                  <td style={TD_STYLE}>{CATEGORY_LABEL[g.category] ?? g.category}</td>
                  <td style={TD_STYLE}>
                    <ScoreBadge value={PRIORITY_LABEL[g.priority]} color={PRIORITY_COLOR[g.priority]} />
                  </td>
                  <td style={{ ...TD_STYLE, textTransform: "capitalize" }}>{g.importance}</td>
                  <td style={{ ...TD_STYLE, textTransform: "capitalize" }}>{SKILL_LEVEL_LABEL[g.candidateLevel]}</td>
                  <td style={{ ...TD_STYLE, color: INK_SECONDARY }}>{g.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      {/* ── Section 4: Adaptive Interview ──────────────────────────── */}
      {interview && interview.evaluations.length > 0 ? (
        <Section n={4} title="Adaptive Interview">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Stat label="Questions answered" value={interview.evaluations.length} />
            <Stat label="Avg score" value={interviewAvg !== null ? `${interviewAvg}%` : "—"} />
            <Stat label="Competencies covered" value={new Set(interview.evaluations.map((e) => e.competency)).size} />
          </div>

          {interview.evaluations.map((ev, i) => {
            const q = interview.questions.find((qq) => qq.id === ev.questionId);
            const a = interview.answers.find((aa) => aa.questionId === ev.questionId);
            const score = Math.round(ev.overall * 100);
            const tone =
              ev.overall >= 0.7 ? "strong" : ev.overall >= 0.5 ? "good" : ev.overall >= 0.3 ? "fair" : "low";

            return (
              <div
                key={`qa-${i}`}
                className="hm-print-avoid-break"
                style={{
                  marginBottom: "0.7rem",
                  padding: "0.55rem 0.65rem",
                  border: `0.5px solid ${RULE_COLOR}`,
                  borderRadius: "0.35rem",
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: INK_PRIMARY }}>
                    <span style={{ color: INK_MUTED, fontWeight: 600, marginRight: "0.35rem" }}>Q{i + 1}.</span>
                    {q?.competency ?? ev.competency}
                    {q ? (
                      <span style={{ fontWeight: 400, color: INK_MUTED, marginLeft: "0.4rem", fontSize: "0.68rem" }}>
                        · {q.difficulty} · {q.mode}
                      </span>
                    ) : null}
                  </div>
                  <ScoreBadge value={`${score}%`} color={BAND_COLOR[tone]} />
                </div>

                {q ? (
                  <p style={{ fontSize: "0.78rem", color: INK_PRIMARY, margin: "0 0 0.3rem 0", lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 600, color: INK_SECONDARY }}>Question: </span>
                    {q.text}
                  </p>
                ) : null}

                {a ? (
                  <p style={{ fontSize: "0.76rem", color: INK_SECONDARY, margin: "0 0 0.35rem 0", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: INK_SECONDARY }}>Answer: </span>
                    {a.text.length > 480 ? a.text.slice(0, 480) + "…" : a.text}
                  </p>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1rem", fontSize: "0.72rem", marginTop: "0.25rem" }}>
                  {ev.strengths.length > 0 ? (
                    <div>
                      <div style={{ fontWeight: 700, color: "#3a8a73", marginBottom: "0.15rem", fontSize: "0.66rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Strengths</div>
                      <ul style={{ margin: 0, paddingLeft: "1rem", color: INK_SECONDARY, lineHeight: 1.4 }}>
                        {ev.strengths.map((s, j) => (
                          <li key={`s-${i}-${j}`}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {ev.weaknesses.length > 0 ? (
                    <div>
                      <div style={{ fontWeight: 700, color: "#c95a4f", marginBottom: "0.15rem", fontSize: "0.66rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Weaknesses</div>
                      <ul style={{ margin: 0, paddingLeft: "1rem", color: INK_SECONDARY, lineHeight: 1.4 }}>
                        {ev.weaknesses.map((w, j) => (
                          <li key={`w-${i}-${j}`}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {ev.nextFocus ? (
                  <p style={{ fontSize: "0.7rem", color: INK_MUTED, margin: "0.35rem 0 0 0", fontStyle: "italic" }}>
                    Next focus: {ev.nextFocus}
                  </p>
                ) : null}
              </div>
            );
          })}
        </Section>
      ) : null}

      {/* ── Section 5: Job Readiness Index ─────────────────────────── */}
      {readiness ? (
        <Section n={5} title="Job Readiness Index">
          <IndexHero
            index={readiness.index}
            band={readiness.band}
            headline={readiness.headline}
            title="Readiness Index"
          />

          <table className="hm-print-table" style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Dimension</th>
                <th style={{ ...TH_STYLE, width: "3.5rem", textAlign: "right" }}>Score</th>
                <th style={TH_STYLE}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {readiness.dimensions.map((d, i) => (
                <tr key={`rd-${i}`}>
                  <td style={{ ...TD_STYLE, fontWeight: 600 }}>{d.label}</td>
                  <td style={{ ...TD_STYLE, textAlign: "right" }}>
                    <ScoreBadge
                      value={String(Math.round(d.score * 100))}
                      color={BAND_COLOR[d.score >= 0.7 ? "strong" : d.score >= 0.5 ? "good" : d.score >= 0.3 ? "fair" : "low"]}
                    />
                  </td>
                  <td style={{ ...TD_STYLE, color: INK_SECONDARY }}>{d.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {readiness.criticalBlockers.length > 0 ? (
            <div style={{ marginTop: "0.6rem" }}>
              <div style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c95a4f", marginBottom: "0.25rem" }}>
                Critical blockers
              </div>
              <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.78rem", color: INK_SECONDARY, lineHeight: 1.5 }}>
                {readiness.criticalBlockers.map((b, i) => (
                  <li key={`cb-${i}`}>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div
            className="hm-print-avoid-break"
            style={{
              marginTop: "0.65rem",
              padding: "0.5rem 0.65rem",
              border: `0.5px solid ${RULE_COLOR}`,
              borderLeft: "3px solid #4f6082",
              borderRadius: "0.3rem",
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.2rem" }}>
              Next best action
            </div>
            <p style={{ margin: 0, fontSize: "0.8rem", color: INK_PRIMARY, lineHeight: 1.5 }}>{readiness.nextBestAction}</p>
          </div>
        </Section>
      ) : null}

      {/* ── Section 6: Improvement Roadmap ─────────────────────────── */}
      {roadmap ? (
        <Section n={6} title="Improvement Roadmap" last>
          <div
            className="hm-print-avoid-break"
            style={{
              marginBottom: "0.6rem",
              padding: "0.5rem 0.65rem",
              border: `0.5px solid ${RULE_COLOR}`,
              borderLeft: "3px solid #c79654",
              borderRadius: "0.3rem",
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.2rem" }}>
              Highest-impact gap
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: INK_PRIMARY, fontWeight: 600, lineHeight: 1.4 }}>{roadmap.currentGap}</p>
          </div>

          {roadmap.steps.map((s, i) => {
            const phaseColor =
              s.phase === "TODAY" ? "#c95a4f" : s.phase === "NEXT" ? "#c79654" : s.phase === "THEN" ? "#4f6082" : "#3a8a73";
            return (
              <div
                key={`rs-${i}`}
                className="hm-print-avoid-break"
                style={{ marginBottom: "0.6rem", padding: "0.5rem 0.65rem", border: `0.5px solid ${RULE_COLOR}`, borderRadius: "0.35rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                  <ScoreBadge value={s.phase} color={phaseColor} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: INK_PRIMARY }}>{s.competency}</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: INK_PRIMARY, margin: "0 0 0.3rem 0", lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: INK_SECONDARY }}>Focus: </span>
                  {s.focus}
                </p>
                {s.reason ? (
                  <p style={{ fontSize: "0.72rem", color: INK_MUTED, margin: "0 0 0.3rem 0", lineHeight: 1.4, fontStyle: "italic" }}>
                    {s.reason}
                  </p>
                ) : null}
                {s.practice.length > 0 ? (
                  <div style={{ marginTop: "0.2rem" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.15rem" }}>
                      Practice
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: "0.74rem", color: INK_SECONDARY, lineHeight: 1.45 }}>
                      {s.practice.map((p, j) => (
                        <li key={`p-${i}-${j}`}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </Section>
      ) : null}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: "1rem",
          paddingTop: "0.5rem",
          borderTop: `0.5px solid ${RULE_COLOR}`,
          fontSize: "0.66rem",
          color: INK_MUTED,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        Generated by HireMind AI · Assessment support, not a hiring verdict · Prototype indices · AI-assisted evaluation
      </footer>
    </div>
  );
}

/* Tiny stat tile (used in candidate + interview summaries) */
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="hm-print-badge"
      style={{
        padding: "0.4rem 0.55rem",
        borderRadius: "0.3rem",
        background: TABLE_HEAD_BG,
        border: `0.5px solid ${RULE_COLOR}`,
      }}
    >
      <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_MUTED, marginBottom: "0.1rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: INK_PRIMARY, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}
