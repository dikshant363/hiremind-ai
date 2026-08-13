/**
 * HIREMIND AI — Resume Strength Score (deterministic).
 *
 * A transparent, rule-based assessment of the resume's quality as evidence.
 * This is NOT a hireability score — it measures how informative the resume is
 * for the HireMind engine: how much signal we can extract from it.
 *
 * "AI understands. Application logic decides."
 *
 * Dimensions (each 0..1):
 *   - Evidence quality:    Are evidence snippets quantified, action-verb-led?
 *   - Skill coverage:      Variety of distinct competencies demonstrated.
 *   - Section completeness: Does the resume include experience, projects, education?
 *   - Achievement density: Ratio of quantified achievements to total evidence.
 */

import type { CandidateProfile } from "./types";

export interface ResumeStrengthDimension {
  label: string;
  score: number; // 0..1
  detail: string;
  icon: string; // lucide icon name
}

export interface ResumeStrengthResult {
  index: number; // 0..100
  band: "thin" | "fair" | "good" | "strong";
  headline: string;
  dimensions: ResumeStrengthDimension[];
  tips: string[];
}

// Action verbs commonly used in strong resumes (deterministic check).
const ACTION_VERBS = [
  "built", "led", "designed", "implemented", "shipped", "deployed", "optimized",
  "reduced", "increased", "improved", "launched", "architected", "developed",
  "created", "delivered", "scaled", "automated", "migrated", "refactored",
  "engineered", "owned", "drove", "established", "spearheaded", "mentored",
];

// Patterns that indicate quantified impact.
const QUANT_PATTERNS = [
  /\$\s?\d/,               // $1.2M, $50K
  /\b\d{1,3}(,\d{3})+\b/,  // 1,200,000
  /\b\d+(\.\d+)?\s?%/,     // 25%, 99.9%
  /\b\d+(\.\d+)?\s?[xXkKmMbB]\b/, // 5x, 10k, 2M
  /\b\d+\+/,               // 50+, 100+
  /\b\d+\s?(users|customers|requests|queries|rps|qps|latency|ms|seconds|hours|days|models|features|engineers|people|reports|pipelines|deployments|experiments)\b/i,
];

/**
 * Compute a deterministic Resume Strength Score for a candidate profile.
 * Pure function — no side effects, no AI calls. Same input always produces
 * the same output.
 */
export function computeResumeStrength(profile: CandidateProfile): ResumeStrengthResult {
  const evidence = profile.evidence;
  const evidenceCount = evidence.length;
  const skillsCount = profile.skills.length;

  // --- 1. Evidence quality (0..1) ---
  // Strong evidence = action-verb-led + quantified.
  let qualityScore = 0;
  if (evidenceCount > 0) {
    let actionVerbHits = 0;
    let quantifiedHits = 0;
    for (const ev of evidence) {
      const text = ev.evidence.toLowerCase();
      if (ACTION_VERBS.some((v) => text.includes(v))) actionVerbHits++;
      if (QUANT_PATTERNS.some((p) => p.test(ev.evidence))) quantifiedHits++;
    }
    const actionVerbRatio = actionVerbHits / evidenceCount;
    const quantifiedRatio = quantifiedHits / evidenceCount;
    // Weighted: quantification matters more than action verbs.
    qualityScore = Math.min(1, actionVerbRatio * 0.4 + quantifiedRatio * 0.6);
  }
  const qualityDetail =
    evidenceCount === 0
      ? "No evidence snippets detected — add concrete project descriptions."
      : `${Math.round(qualityScore * 100)}% of evidence has action verbs or quantified impact.`;

  // --- 2. Skill coverage (0..1) ---
  // Distinct competencies demonstrated. Curve: 1 competency = 0.1, 5 = 0.4, 10+ = 1.0.
  const distinctCompetencies = new Set(evidence.map((e) => e.competency)).size;
  const coverageScore = Math.min(1, 0.1 + (distinctCompetencies / 10) * 0.9);
  const coverageDetail = `${distinctCompetencies} distinct competencies demonstrated across ${evidenceCount} evidence snippets.`;

  // --- 3. Section completeness (0..1) ---
  // Resume should have experience, projects, education, and certifications.
  const hasExperience = profile.experience.length > 0;
  const hasProjects = profile.projects.length > 0;
  const hasEducation = profile.education.length > 0;
  const hasCerts = profile.certifications.length > 0;
  const hasSummary = profile.summary.trim().length > 30;
  const sectionFlags = [hasExperience, hasProjects, hasEducation, hasCerts, hasSummary];
  const sectionScore = sectionFlags.filter(Boolean).length / sectionFlags.length;
  const sectionDetail = `${sectionFlags.filter(Boolean).length}/5 sections present (experience, projects, education, certs, summary).`;

  // --- 4. Achievement density (0..1) ---
  // Ratio of quantified evidence to total evidence — how metrics-rich the resume is.
  let densityScore = 0;
  if (evidenceCount > 0) {
    const quantified = evidence.filter((e) => QUANT_PATTERNS.some((p) => p.test(e.evidence))).length;
    densityScore = Math.min(1, quantified / Math.max(3, evidenceCount * 0.5));
  }
  const densityDetail =
    evidenceCount === 0
      ? "Add quantified outcomes (e.g. 'reduced latency by 40%')."
      : `${evidence.filter((e) => QUANT_PATTERNS.some((p) => p.test(e.evidence))).length} quantified achievements detected.`;

  const dimensions: ResumeStrengthDimension[] = [
    { label: "Evidence quality", score: round2(qualityScore), detail: qualityDetail, icon: "Sparkles" },
    { label: "Skill coverage", score: round2(coverageScore), detail: coverageDetail, icon: "Grid3x3" },
    { label: "Section completeness", score: round2(sectionScore), detail: sectionDetail, icon: "ListChecks" },
    { label: "Achievement density", score: round2(densityScore), detail: densityDetail, icon: "TrendingUp" },
  ];

  // Weighted aggregate — quality and coverage matter most.
  const weights = [0.35, 0.25, 0.2, 0.2];
  const index = Math.round(
    dimensions.reduce((s, d, i) => s + d.score * weights[i], 0) * 100
  );

  const band: ResumeStrengthResult["band"] =
    index >= 75 ? "strong" : index >= 55 ? "good" : index >= 35 ? "fair" : "thin";

  const headline =
    band === "strong"
      ? "Rich, quantified resume — strong signal for the engine."
      : band === "good"
      ? "Solid resume — a few tweaks would sharpen the signal."
      : band === "fair"
      ? "Decent resume — adding quantified outcomes would help most."
      : "Thin resume — add concrete projects and quantified impact.";

  // Tips — deterministic, ordered by impact.
  const tips: string[] = [];
  if (densityScore < 0.4) {
    tips.push("Add quantified outcomes — numbers like '40% faster' or '1.2M users' make evidence stronger.");
  }
  if (qualityScore < 0.4) {
    tips.push("Start bullet points with action verbs (built, led, designed, shipped, optimized).");
  }
  if (coverageScore < 0.4) {
    tips.push("Demonstrate more distinct competencies — currently few skills are evidenced.");
  }
  if (!hasProjects) {
    tips.push("Add a Projects section — side projects count as real evidence.");
  }
  if (!hasCerts) {
    tips.push("List relevant certifications if you have any — they count as credential evidence.");
  }
  if (tips.length === 0) {
    tips.push("Resume is in great shape — focus on interview prep next.");
  }

  return { index, band, headline, dimensions, tips };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
