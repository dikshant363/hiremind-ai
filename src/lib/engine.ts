/**
 * HIREMIND AI — Deterministic Domain Engine
 *
 * "AI understands. Application logic decides."
 *
 * All final scoring, gap prioritization, competency state transitions and
 * readiness indices are computed here deterministically. The LLM may propose
 * interpretations, but this module owns the canonical numbers shown to users.
 */

import type {
  CandidateProfile,
  JobProfile,
  JobRequirement,
  MatchResult,
  CompetencyMatchRow,
  SkillGap,
  GapPriority,
  SkillLevel,
  MatchStatus,
  InterviewState,
  InterviewQuestion,
  InterviewDifficulty,
  AnswerEvaluation,
  CompetencyState,
  ReadinessResult,
  Roadmap,
  RoadmapStep,
} from "./types";
import type { ScoringWeights, ReadinessWeights } from "./config";
import { bestSemanticMatch, evidenceStrength } from "./text";
import { normalizeSkill } from "./taxonomy";

// ---------- helpers ----------

const IMPORTANCE_WEIGHT: Record<JobRequirement["importance"], number> = {
  critical: 1.0,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

const LEVEL_VALUE: Record<SkillLevel, number> = {
  unknown: 0,
  weak: 0.3,
  moderate: 0.6,
  strong: 1.0,
};

export function levelFromStrength(strength: number): SkillLevel {
  if (strength >= 0.75) return "strong";
  if (strength >= 0.4) return "moderate";
  if (strength > 0) return "weak";
  return "unknown";
}

// ---------- candidate profile helpers ----------

export function indexCandidateSkills(profile: CandidateProfile): {
  skills: string[];
  byCompetency: Map<string, { level: SkillLevel; evidence: string; strength: number }>;
} {
  const byCompetency = new Map<string, { level: SkillLevel; evidence: string; strength: number }>();
  for (const ev of profile.evidence) {
    const norm = normalizeSkill(ev.skill);
    const existing = byCompetency.get(norm.competency);
    const strength = Math.max(ev.strength, existing?.strength ?? 0);
    const level = levelFromStrength(strength);
    // Prefer evidence with the highest strength
    if (!existing || ev.strength >= existing.strength) {
      byCompetency.set(norm.competency, { level, evidence: ev.evidence, strength });
    } else {
      byCompetency.set(norm.competency, { level: existing.level, evidence: existing.evidence, strength: existing.strength });
    }
  }
  return { skills: profile.skills, byCompetency };
}

// ---------- semantic match engine ----------

export function computeMatch(
  candidate: CandidateProfile,
  job: JobProfile,
  customWeights?: ScoringWeights
): MatchResult {
  const { byCompetency } = indexCandidateSkills(candidate);

  const rows: CompetencyMatchRow[] = job.requirements.map((req) => {
    const norm = normalizeSkill(req.skill);
    const candidateEntry = byCompetency.get(norm.competency);
    const semantic = bestSemanticMatch(req.skill, candidate.skills);
    const candidateLevel: SkillLevel = candidateEntry?.level ?? "unknown";
    const evidence = candidateEntry?.evidence ?? null;

    let status: MatchStatus;
    let contribution = 0;
    const importanceW = IMPORTANCE_WEIGHT[req.importance];

    if (candidateLevel === "unknown" && semantic.score < 0.3) {
      status = req.required ? "gap" : "unknown";
      // Gap on required critical skill is a strong negative signal
      contribution = req.required ? 0.0 : 0.05;
    } else if (candidateLevel === "unknown" && semantic.score >= 0.5) {
      status = "weak";
      contribution = 0.35 * importanceW;
    } else if (candidateLevel === "weak") {
      status = "weak";
      contribution = 0.45 * importanceW;
    } else if (candidateLevel === "moderate") {
      status = "matched";
      contribution = 0.75 * importanceW;
    } else if (candidateLevel === "strong") {
      status = "matched";
      contribution = 1.0 * importanceW;
    } else {
      status = "weak";
      contribution = 0.4 * importanceW;
    }

    // Boost contribution slightly by semantic similarity for unknown cases
    if (candidateLevel === "unknown" && semantic.score >= 0.5) {
      contribution = Math.max(contribution, semantic.score * importanceW * 0.7);
    }

    return {
      competency: norm.competency,
      category: norm.category,
      required: req.required,
      importance: req.importance,
      candidateLevel,
      status,
      evidence,
      semanticScore: Math.round(semantic.score * 100) / 100,
      contribution: Math.round(contribution * 100) / 100,
    };
  });

  // Aggregate: weighted sum of contributions over weighted max
  const totalWeight = rows.reduce((s, r) => s + IMPORTANCE_WEIGHT[r.importance] * (r.required ? 1.0 : 0.6), 0);
  const totalScore = rows.reduce((s, r) => s + r.contribution, 0);
  const index = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  // Components — explainable breakdown (only implemented factors shown)
  const requiredRows = rows.filter((r) => r.required);
  const matched = rows.filter((r) => r.status === "matched").length;
  const weak = rows.filter((r) => r.status === "weak").length;
  const gap = rows.filter((r) => r.status === "gap").length;

  const requiredCoverage =
    requiredRows.length > 0
      ? requiredRows.filter((r) => r.status === "matched").length / requiredRows.length
      : 1;
  const evidenceStrengthAvg = rows
    .filter((r) => r.evidence)
    .reduce((s, r) => s + (r.contribution / Math.max(0.001, IMPORTANCE_WEIGHT[r.importance])), 0) /
    Math.max(1, rows.filter((r) => r.evidence).length);

  const wRequired = typeof customWeights?.requiredSkillAlignment === "number" ? customWeights.requiredSkillAlignment : 0.4;
  const wEvidence = typeof customWeights?.evidenceStrength === "number" ? customWeights.evidenceStrength : 0.3;
  const wSemantic = typeof customWeights?.semanticRelevance === "number" ? customWeights.semanticRelevance : 0.2;
  const wBreadth = typeof customWeights?.coverageBreadth === "number" ? customWeights.coverageBreadth : 0.1;

  const components = [
    {
      label: "Required-skill alignment",
      weight: wRequired,
      score: Math.round(requiredCoverage * 100) / 100,
      detail: `${requiredRows.filter((r) => r.status === "matched").length} of ${requiredRows.length} required skills demonstrated with evidence.`,
    },
    {
      label: "Evidence strength",
      weight: wEvidence,
      score: Math.round(Math.min(1, evidenceStrengthAvg) * 100) / 100,
      detail: "Average contribution weight of evidenced skills across the role.",
    },
    {
      label: "Semantic relevance",
      weight: wSemantic,
      score: Math.round((rows.reduce((s, r) => s + r.semanticScore, 0) / Math.max(1, rows.length)) * 100) / 100,
      detail: "How closely your stated skills relate to the job's required competencies.",
    },
    {
      label: "Coverage breadth",
      weight: wBreadth,
      score: Math.round((matched / Math.max(1, rows.length)) * 100) / 100,
      detail: `${matched} matched, ${weak} weak, ${gap} gap across ${rows.length} competency rows.`,
    },
  ];

  const band: MatchResult["band"] = index >= 80 ? "strong" : index >= 65 ? "good" : index >= 45 ? "fair" : "low";
  const headline =
    band === "strong"
      ? "Strong alignment with this role."
      : band === "good"
      ? "Good alignment — a few areas to strengthen."
      : band === "fair"
      ? "Fair alignment — meaningful gaps to close."
      : "Limited alignment — significant upskilling needed.";

  return { index, band, headline, rows, components };
}

// ---------- skill gap engine ----------

export function computeGaps(match: MatchResult, candidate: CandidateProfile, job: JobProfile): SkillGap[] {
  const { byCompetency } = indexCandidateSkills(candidate);

  const gaps: SkillGap[] = match.rows
    .filter((r) => r.status !== "matched")
    .map((r) => {
      const importanceW = IMPORTANCE_WEIGHT[r.importance];
      // Priority score: required critical gap > unknown > weak
      const unknownPenalty = r.candidateLevel === "unknown" ? 0.25 : 0;
      const requiredBoost = r.required ? 0.2 : 0;
      const levelPenalty = 1 - LEVEL_VALUE[r.candidateLevel];
      const priorityScore = Math.round(Math.min(1, importanceW * levelPenalty + requiredBoost + unknownPenalty) * 100) / 100;

      let priority: GapPriority;
      if (priorityScore >= 0.85) priority = "critical";
      else if (priorityScore >= 0.6) priority = "high";
      else if (priorityScore >= 0.35) priority = "medium";
      else priority = "low";

      const reason =
        r.candidateLevel === "unknown"
          ? `No resume evidence found for ${r.competency}, which is ${r.importance} for this role.`
          : r.candidateLevel === "weak"
          ? `Resume shows limited ${r.competency} depth; this role requires ${r.importance} proficiency.`
          : `Partial coverage of ${r.competency}; strengthening it will raise your match index.`;

      return {
        competency: r.competency,
        category: r.category,
        importance: r.importance,
        status: r.status,
        candidateLevel: r.candidateLevel,
        reason,
        priority,
        priorityScore,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return gaps;
}

export function highestImpactGap(gaps: SkillGap[]): SkillGap | null {
  return gaps.length > 0 ? gaps[0] : null;
}

// ---------- interview state machine ----------

export const QUESTION_BANK: Record<string, Omit<InterviewQuestion, "id" | "reason">[]> = {
  "System Design": [
    { competency: "System Design", category: "system_design", text: "How would you design a scalable REST API that handles 100,000 concurrent users?", difficulty: "hard", mode: "technical" },
    { competency: "System Design", category: "system_design", text: "Walk me through the architecture you'd propose for a real-time notifications service.", difficulty: "hard", mode: "technical" },
    { competency: "System Design", category: "system_design", text: "How would you design a rate limiter for a public API? What data structures would you use?", difficulty: "medium", mode: "technical" },
    { competency: "System Design", category: "system_design", text: "Explain the tradeoffs between a microservices and monolithic architecture for a small team.", difficulty: "easy", mode: "technical" },
  ],
  "Scalability": [
    { competency: "Scalability", category: "system_design", text: "How would you introduce caching and load balancing to scale an existing web service?", difficulty: "hard", mode: "technical" },
    { competency: "Scalability", category: "system_design", text: "Compare horizontal vs vertical scaling. When would you choose each for a stateful service?", difficulty: "medium", mode: "technical" },
    { competency: "Scalability", category: "system_design", text: "What is the C.A.P. theorem and how does it influence your choice of database for a distributed system?", difficulty: "medium", mode: "technical" },
  ],
  "Fault Tolerance": [
    { competency: "Fault Tolerance", category: "system_design", text: "Design a system that stays available when a primary dependency goes down.", difficulty: "hard", mode: "technical" },
    { competency: "Fault Tolerance", category: "system_design", text: "Explain circuit breakers and bulkheads. How do they prevent cascading failures?", difficulty: "medium", mode: "technical" },
    { competency: "Fault Tolerance", category: "system_design", text: "What is graceful degradation? Give a real-world example from a service you'd build.", difficulty: "easy", mode: "technical" },
  ],
  "Caching": [
    { competency: "Caching", category: "system_design", text: "What cache invalidation strategies would you use and why?", difficulty: "medium", mode: "technical" },
    { competency: "Caching", category: "system_design", text: "Compare write-through, write-back, and write-around caches. When is each appropriate?", difficulty: "hard", mode: "technical" },
    { competency: "Caching", category: "system_design", text: "How would you design a distributed cache? What consistency guarantees can you offer?", difficulty: "hard", mode: "technical" },
  ],
  "Load Balancing": [
    { competency: "Load Balancing", category: "system_design", text: "Compare round-robin, least-connections and consistent hashing for load balancing.", difficulty: "medium", mode: "technical" },
    { competency: "Load Balancing", category: "system_design", text: "What is a health check in the context of load balancing? How does it affect traffic routing?", difficulty: "easy", mode: "technical" },
  ],
  "REST APIs": [
    { competency: "REST APIs", category: "backend", text: "Design a paginated, filterable REST API for a product catalog.", difficulty: "medium", mode: "technical" },
    { competency: "REST APIs", category: "backend", text: "What are idempotency and safety in HTTP methods? Why do they matter for APIs?", difficulty: "easy", mode: "technical" },
    { competency: "REST APIs", category: "backend", text: "How would you version a REST API? Compare URL versioning vs header versioning.", difficulty: "medium", mode: "technical" },
  ],
  "Microservices": [
    { competency: "Microservices", category: "backend", text: "What are the main challenges of inter-service communication in microservices? How do you address them?", difficulty: "medium", mode: "technical" },
    { competency: "Microservices", category: "backend", text: "Compare synchronous (REST/gRPC) vs asynchronous (message queue) communication between services.", difficulty: "hard", mode: "technical" },
    { competency: "Microservices", category: "backend", text: "How do you handle data consistency across microservices without distributed transactions?", difficulty: "hard", mode: "technical" },
  ],
  "Databases": [
    { competency: "Databases", category: "backend", text: "How do you choose between SQL and NoSQL for a new service? Give a concrete tradeoff.", difficulty: "medium", mode: "technical" },
    { competency: "Databases", category: "backend", text: "Explain database indexing. How do you decide which columns to index?", difficulty: "easy", mode: "technical" },
    { competency: "Databases", category: "backend", text: "What is database sharding? Compare it with partitioning and replication.", difficulty: "medium", mode: "technical" },
  ],
  "Docker": [
    { competency: "Docker", category: "devops", text: "How would you secure and optimize a Docker image for production?", difficulty: "medium", mode: "technical" },
    { competency: "Docker", category: "devops", text: "Explain the difference between COPY and ADD in a Dockerfile. When would you use each?", difficulty: "easy", mode: "technical" },
    { competency: "Docker", category: "devops", text: "How do you manage secrets in Docker containers? What are the security risks of environment variables?", difficulty: "medium", mode: "technical" },
  ],
  "Kubernetes": [
    { competency: "Kubernetes", category: "devops", text: "Explain how a Kubernetes Deployment, Service and Ingress work together.", difficulty: "medium", mode: "technical" },
    { competency: "Kubernetes", category: "devops", text: "What is a Kubernetes Pod? How does it differ from a container?", difficulty: "easy", mode: "technical" },
    { competency: "Kubernetes", category: "devops", text: "How would you configure auto-scaling in Kubernetes? What metrics would you use?", difficulty: "hard", mode: "technical" },
  ],
  "AWS": [
    { competency: "AWS", category: "cloud", text: "Design a highly available 3-tier web application on AWS.", difficulty: "hard", mode: "technical" },
    { competency: "AWS", category: "cloud", text: "Compare S3, EBS and EFS. When would you use each?", difficulty: "easy", mode: "technical" },
    { competency: "AWS", category: "cloud", text: "How would you implement Infrastructure as Code on AWS? Compare CloudFormation and Terraform.", difficulty: "medium", mode: "technical" },
  ],
  "MLOps": [
    { competency: "MLOps", category: "ml", text: "How would you set up a CI/CD pipeline for an ML model? What stages are needed?", difficulty: "medium", mode: "technical" },
    { competency: "MLOps", category: "ml", text: "What is model drift? How do you detect and respond to it in production?", difficulty: "hard", mode: "technical" },
    { competency: "MLOps", category: "ml", text: "Compare A/B testing and shadow deployment for releasing a new ML model.", difficulty: "medium", mode: "technical" },
  ],
  "Python": [
    { competency: "Python", category: "languages", text: "Explain the GIL and how it affects multi-threaded Python programs.", difficulty: "medium", mode: "technical" },
    { competency: "Python", category: "languages", text: "Compare list comprehensions, generators, and map/filter. When is each most appropriate?", difficulty: "easy", mode: "technical" },
    { competency: "Python", category: "languages", text: "How does Python's memory management work? Explain reference counting and the garbage collector.", difficulty: "medium", mode: "technical" },
  ],
  "Machine Learning": [
    { competency: "Machine Learning", category: "ml", text: "How would you decide between a simpler model and a deep learning model for a tabular dataset?", difficulty: "medium", mode: "technical" },
    { competency: "Machine Learning", category: "ml", text: "Explain the bias-variance tradeoff. How do you diagnose underfitting vs overfitting?", difficulty: "easy", mode: "technical" },
    { competency: "Machine Learning", category: "ml", text: "How would you handle imbalanced classes in a classification problem?", difficulty: "medium", mode: "technical" },
  ],
  "Deep Learning": [
    { competency: "Deep Learning", category: "ml", text: "Explain backpropagation and how vanishing gradients are mitigated.", difficulty: "hard", mode: "technical" },
    { competency: "Deep Learning", category: "ml", text: "Compare CNNs and Transformers for sequence modeling. When would you choose each?", difficulty: "medium", mode: "technical" },
    { competency: "Deep Learning", category: "ml", text: "What is transfer learning? How does fine-tuning differ from feature extraction?", difficulty: "easy", mode: "technical" },
  ],
  "NLP": [
    { competency: "NLP", category: "ml", text: "Explain the difference between bag-of-words, TF-IDF, and word embeddings for text representation.", difficulty: "easy", mode: "technical" },
    { competency: "NLP", category: "ml", text: "How do attention mechanisms work in Transformers? Explain self-attention.", difficulty: "hard", mode: "technical" },
    { competency: "NLP", category: "ml", text: "What are the challenges of evaluating NLP models? Compare BLEU, ROUGE, and human evaluation.", difficulty: "medium", mode: "technical" },
  ],
  "Feature Engineering": [
    { competency: "Feature Engineering", category: "ml", text: "What is feature importance and how do you measure it? Compare at least two methods.", difficulty: "medium", mode: "technical" },
    { competency: "Feature Engineering", category: "ml", text: "Explain feature scaling and normalization. When does the choice matter?", difficulty: "easy", mode: "technical" },
  ],
  "Communication": [
    { competency: "Communication", category: "communication", text: "Tell me about a time you had to explain a complex technical decision to a non-technical stakeholder.", difficulty: "easy", mode: "hr" },
    { competency: "Communication", category: "communication", text: "How do you handle disagreements on technical direction within a team?", difficulty: "medium", mode: "hr" },
    { competency: "Communication", category: "communication", text: "Describe how you document your architectural decisions for the team.", difficulty: "easy", mode: "hr" },
  ],
  "Cross-functional collaboration": [
    { competency: "Cross-functional collaboration", category: "communication", text: "How do you align engineering work with product and design priorities?", difficulty: "medium", mode: "hr" },
    { competency: "Cross-functional collaboration", category: "communication", text: "Describe a project where you worked closely with a non-engineering team. What did you learn?", difficulty: "easy", mode: "hr" },
  ],
  "Leadership": [
    { competency: "Leadership", category: "communication", text: "Describe a situation where you led a team through an ambiguous problem.", difficulty: "medium", mode: "hr" },
    { competency: "Leadership", category: "communication", text: "How do you mentor junior engineers? Give a specific example.", difficulty: "easy", mode: "hr" },
  ],
};

/**
 * Initialize the interview state machine from gaps. We pre-select target
 * competencies: the highest-impact gap first, then a few neighboring gaps.
 *
 * `difficultyPreference` (optional) biases question selection toward easy /
 * medium / hard variants when the question bank has multiple options.
 */
export function initInterview(
  gaps: SkillGap[],
  candidate: CandidateProfile,
  match: MatchResult,
  difficultyPreference: InterviewDifficulty = "auto"
): InterviewState {
  const targetCompetencies: string[] = [];
  const topGap = highestImpactGap(gaps);
  if (topGap) targetCompetencies.push(topGap.competency);

  // Add up to 3 more gaps, preferring different categories for breadth.
  const seenCategories = new Set(topGap ? [topGap.category] : []);
  for (const g of gaps) {
    if (g.competency === topGap?.competency) continue;
    if (targetCompetencies.length >= 4) break;
    if (seenCategories.has(g.category)) continue;
    targetCompetencies.push(g.competency);
    seenCategories.add(g.category);
  }
  // Fallback: if no gaps found, pick candidate/matched competencies to probe.
  if (targetCompetencies.length === 0) {
    const candidateRows = match.rows.filter((r) => r.status === "weak");
    const fallbackRows = candidateRows.length > 0 ? candidateRows : match.rows;
    for (const r of fallbackRows.slice(0, 3)) targetCompetencies.push(r.competency);
  }
  if (targetCompetencies.length === 0) {
    targetCompetencies.push("System Design");
  }

  const totalQuestions = Math.min(7, Math.max(3, targetCompetencies.length + 2));

  // Initialize competency states from candidate evidence
  const { byCompetency } = indexCandidateSkills(candidate);
  const competencyStates: CompetencyState[] = match.rows.map((r) => {
    const entry = byCompetency.get(r.competency);
    const resumeLevel = entry?.level ?? "unknown";
    return {
      competency: r.competency,
      category: r.category,
      resumeLevel,
      interviewLevel: "unknown",
      current: resumeLevel,
      status: r.status,
      notes: entry?.evidence ? "Resume evidence available." : "No resume evidence.",
    };
  });

  // Generate the first question deterministically (highest-impact gap)
  const questions: InterviewQuestion[] = [];
  const firstQ = pickQuestionForCompetency(topGap?.competency ?? targetCompetencies[0], targetCompetencies, topGap, difficultyPreference);
  if (firstQ) questions.push(firstQ);

  return {
    status: "asking",
    mode: "technical",
    difficultyPreference,
    currentIndex: 0,
    totalQuestions,
    targetCompetencies,
    questions,
    answers: [],
    evaluations: [],
    competencyStates,
    identifiedWeaknesses: [],
    history: [
      {
        step: "interview_start",
        detail: `Interview started (difficulty: ${difficultyPreference}). Initial target: ${topGap?.competency ?? "first weak competency"} (${topGap?.priority ?? "medium"} priority gap).`,
        at: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Pick a question for a given competency, preferring ones that match the
 * user's selected difficulty. Falls back gracefully if no exact match exists.
 */
function pickQuestionForCompetency(
  competency: string,
  asked: string[],
  gap: SkillGap | null,
  difficultyPreference: InterviewDifficulty = "auto"
): InterviewQuestion | null {
  const bank = QUESTION_BANK[competency] ?? [];
  if (bank.length === 0) {
    return {
      id: cryptoId(),
      competency,
      category: gap?.category ?? "domain",
      text: `Tell me about your experience with ${competency} and how you've applied it to a real problem.`,
      difficulty: difficultyPreference === "auto" ? "medium" : difficultyPreference,
      mode: "technical",
      reason: gap
        ? `${competency} was identified as your ${gap.priority}-priority gap for this role.`
        : `Exploring your ${competency} knowledge.`,
    };
  }

  // Filter out already-asked questions
  const usedTexts = new Set(asked);
  const available = bank.filter((q) => !usedTexts.has(q.text));
  const pool = available.length > 0 ? available : bank;

  // Difficulty preference ordering — pick the closest available variant
  let chosen: (typeof pool)[number] | undefined;
  if (difficultyPreference === "auto") {
    chosen = pool[0];
  } else {
    // Exact match first
    chosen = pool.find((q) => q.difficulty === difficultyPreference);
    if (!chosen) {
      // Fall back: easy→medium→hard, hard→medium→easy, medium→easy→hard
      const fallbackOrder: Record<Exclude<InterviewDifficulty, "auto">, ("easy" | "medium" | "hard")[]> = {
        easy: ["medium", "hard"],
        medium: ["easy", "hard"],
        hard: ["medium", "easy"],
      };
      for (const alt of fallbackOrder[difficultyPreference]) {
        chosen = pool.find((q) => q.difficulty === alt);
        if (chosen) break;
      }
    }
    if (!chosen) chosen = pool[0];
  }

  return {
    id: cryptoId(),
    ...chosen,
    reason: gap
      ? `${competency} was identified as your ${gap.priority}-priority gap for this role.`
      : `Probing your ${competency} understanding.`,
  };
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return "q_" + crypto.randomUUID().replace(/-/g, "").slice(0, 14);
  }
  return "q_" + Date.now().toString(36);
}

/**
 * Apply an evaluation: update competency states, identify weakness,
 * and deterministically pick the next competency + question.
 *
 * This is the WOW moment: the next question changes because of the answer.
 */
export function applyEvaluation(
  state: InterviewState,
  evaluation: AnswerEvaluation
): InterviewState {
  const next: InterviewState = JSON.parse(JSON.stringify(state));

  // 1. Update competency evidence
  const idx = next.competencyStates.findIndex((c) => c.competency === evaluation.competency);
  if (idx >= 0) {
    const cs = next.competencyStates[idx];
    const interviewLevel: SkillLevel =
      evaluation.overall >= 0.75 ? "strong" : evaluation.overall >= 0.5 ? "moderate" : evaluation.overall >= 0.25 ? "weak" : "unknown";
    cs.interviewLevel = interviewLevel;
    cs.current = combineLevels(cs.resumeLevel, interviewLevel);
    cs.status = cs.current === "unknown" ? "unknown" : cs.current === "weak" ? "weak" : "matched";
    cs.notes = `Interview evidence: ${evaluation.strengths.join("; ") || "n/a"}. ${evaluation.weaknesses.join("; ") || "No major weaknesses."}`;
  }

  // 2. Identify weakness
  if (evaluation.detectedGap) {
    if (!next.identifiedWeaknesses.includes(evaluation.detectedGap)) {
      next.identifiedWeaknesses.push(evaluation.detectedGap);
    }
  } else if (evaluation.overall < 0.5) {
    if (!next.identifiedWeaknesses.includes(evaluation.competency)) {
      next.identifiedWeaknesses.push(evaluation.competency);
    }
  }

  next.evaluations.push(evaluation);
  next.history.push({
    step: "evaluation_applied",
    detail: `Evaluated ${evaluation.competency}. Overall: ${Math.round(evaluation.overall * 100)}%. Detected gap: ${evaluation.detectedGap ?? "none"}.`,
    at: new Date().toISOString(),
  });

  // 3. Decide next competency & question
  next.currentIndex += 1;
  if (next.currentIndex >= next.totalQuestions) {
    next.status = "complete";
    next.history.push({
      step: "interview_complete",
      detail: `Interview complete. ${next.evaluations.length} questions answered. Weaknesses identified: ${next.identifiedWeaknesses.join(", ") || "none"}.`,
      at: new Date().toISOString(),
    });
    return next;
  }

  // Adaptive decision logic:
  //   If the evaluator detected a deeper gap (drill-down), prioritize that.
  //   Otherwise pick the next highest-priority gap that hasn't been interviewed yet.
  let nextCompetency: string | null = evaluation.detectedGap;
  let nextGapReason: string | null = null;

  if (!nextCompetency) {
    // Find a competency state that is still unknown/weak and was a gap
    const candidates = next.competencyStates
      .filter((c) => (c.status === "gap" || c.status === "unknown" || c.status === "weak") && c.competency !== evaluation.competency)
      .sort((a, b) => LEVEL_VALUE[a.current] - LEVEL_VALUE[b.current]);
    nextCompetency = candidates[0]?.competency ?? null;
    if (nextCompetency) {
      nextGapReason = `${nextCompetency} is still an open gap based on your current evidence.`;
    }
  } else {
    nextGapReason = evaluation.nextFocus ?? `Your previous answer suggested limited depth in ${nextCompetency}.`;
  }

  if (!nextCompetency) {
    // All addressed — pick a strong area to verify depth
    const strong = next.competencyStates.find((c) => c.current === "moderate" || c.current === "strong");
    nextCompetency = strong?.competency ?? evaluation.competency;
    nextGapReason = `Verifying depth in ${nextCompetency}, a stronger area of your profile.`;
  }

  const nextQuestion = pickQuestionForCompetency(nextCompetency, next.questions.map((q) => q.text), null, next.difficultyPreference);
  if (nextQuestion) {
    nextQuestion.reason = nextGapReason ?? nextQuestion.reason;
    next.questions.push(nextQuestion);
  }

  next.history.push({
    step: "next_question_selected",
    detail: `Next competency: ${nextCompetency}. Reason: ${nextGapReason}`,
    at: new Date().toISOString(),
  });

  next.status = "asking";
  return next;
}

function combineLevels(a: SkillLevel, b: SkillLevel): SkillLevel {
  const av = LEVEL_VALUE[a];
  const bv = LEVEL_VALUE[b];
  // Take the average; if interview evidence is much weaker than resume, downgrade
  const avg = (av + bv) / 2;
  // If interview reveals the candidate is significantly weaker than resume suggested, trust interview
  if (bv > 0 && bv < av - 0.3) return levelFromStrength(bv + 0.1);
  return levelFromStrength(avg);
}

// ---------- readiness engine ----------

export function computeReadiness(
  match: MatchResult,
  gaps: SkillGap[],
  interview: InterviewState | null,
  customWeights?: ReadinessWeights
): ReadinessResult {
  // Dimensions:
  //   - job alignment (from match index)
  //   - required competency coverage
  //   - interview evidence (if available)
  //   - technical readiness (proxy from match + interview deltas)
  //   - communication (proxy from interview communication scores)

  const jobAlignment = match.index / 100;

  const requiredRows = match.rows.filter((r) => r.required);
  const requiredCoverage = requiredRows.length > 0
    ? requiredRows.filter((r) => r.status === "matched").length / requiredRows.length
    : 1;

  let interviewEvidence = 0.5;
  let technicalReadiness = jobAlignment;
  let communication = 0.6;

  if (interview && interview.evaluations.length > 0) {
    const evals = interview.evaluations;
    interviewEvidence = evals.reduce((s, e) => s + e.overall, 0) / evals.length;
    technicalReadiness = (jobAlignment + evals.reduce((s, e) => s + (e.technicalAccuracy + e.depth) / 2, 0) / evals.length) / 2;
    communication = evals.reduce((s, e) => s + e.communication, 0) / evals.length;
  }

  const dimensions = [
    { label: "Job alignment", score: round2(jobAlignment), detail: "Prototype Job Match Index contribution." },
    { label: "Required competency coverage", score: round2(requiredCoverage), detail: `${Math.round(requiredCoverage * 100)}% of required skills demonstrated.` },
    { label: "Interview evidence", score: round2(interviewEvidence), detail: interview ? `Across ${interview.evaluations.length} answered questions.` : "No interview evidence yet." },
    { label: "Technical readiness", score: round2(technicalReadiness), detail: "Aggregate of match + demonstrated depth." },
    { label: "Communication", score: round2(communication), detail: "How clearly answers were structured." },
  ];

  // Weighted aggregate
  const weights = [
    typeof customWeights?.jobAlignment === "number" ? customWeights.jobAlignment : 0.3,
    typeof customWeights?.requiredCoverage === "number" ? customWeights.requiredCoverage : 0.25,
    typeof customWeights?.interviewEvidence === "number" ? customWeights.interviewEvidence : 0.2,
    typeof customWeights?.technicalReadiness === "number" ? customWeights.technicalReadiness : 0.15,
    typeof customWeights?.communication === "number" ? customWeights.communication : 0.1,
  ];
  const index = Math.round(
    dimensions.reduce((s, d, i) => s + d.score * weights[i], 0) * 100
  );

  const criticalBlockers = gaps
    .filter((g) => g.priority === "critical")
    .map((g) => g.competency);

  const band: ReadinessResult["band"] = index >= 80 ? "strong" : index >= 65 ? "good" : index >= 45 ? "fair" : "low";
  const headline =
    band === "strong"
      ? "You're in strong shape for this role."
      : band === "good"
      ? `You're close — ${criticalBlockers.length} critical area${criticalBlockers.length === 1 ? "" : "s"} need${criticalBlockers.length === 1 ? "s" : ""} attention.`
      : band === "fair"
      ? "Several areas need focused work before you're interview-ready."
      : "Significant upskilling needed before targeting this role.";

  const nextBestAction =
    criticalBlockers.length > 0
      ? `Strengthen ${criticalBlockers[0]} reasoning before your next interview.`
      : gaps.length > 0
      ? `Focus on ${gaps[0].competency} — your highest-impact opportunity.`
      : "Keep practicing and refining your storytelling around past projects.";

  return { index, band, headline, dimensions, criticalBlockers, nextBestAction };
}

// ---------- roadmap engine ----------

export function computeRoadmap(
  gaps: SkillGap[],
  interview: InterviewState | null,
  readiness: ReadinessResult
): Roadmap {
  const identified = interview?.identifiedWeaknesses ?? [];
  // Today: highest-impact gap (or the top interview-identified weakness)
  const currentGap = identified[0] ?? gaps[0]?.competency ?? "Targeted practice";

  // Build steps from gaps + interview weaknesses
  const orderedGaps = [...gaps].sort((a, b) => b.priorityScore - a.priorityScore);
  const used = new Set<string>();

  const steps: RoadmapStep[] = [];

  // TODAY step
  const todayGap = orderedGaps.find((g) => g.competency === currentGap) ?? orderedGaps[0];
  if (todayGap) {
    used.add(todayGap.competency);
    steps.push({
      phase: "TODAY",
      competency: todayGap.competency,
      focus: `Build foundational reasoning in ${todayGap.competency}.`,
      practice: practiceFor(todayGap.competency),
      reason: `${todayGap.competency} is your highest-impact gap (${todayGap.priority} priority).`,
    });
  }

  // NEXT step — drill deeper
  const nextGap = orderedGaps.find((g) => !used.has(g.competency));
  if (nextGap) {
    used.add(nextGap.competency);
    steps.push({
      phase: "NEXT",
      competency: nextGap.competency,
      focus: `Deepen applied ${nextGap.competency} through real-world scenarios.`,
      practice: practiceFor(nextGap.competency),
      reason: `${nextGap.competency} is your next open gap (${nextGap.priority} priority).`,
    });
  }

  // THEN step
  const thenGap = orderedGaps.find((g) => !used.has(g.competency));
  if (thenGap) {
    used.add(thenGap.competency);
    steps.push({
      phase: "THEN",
      competency: thenGap.competency,
      focus: `Combine ${thenGap.competency} with prior skills in a project.`,
      practice: practiceFor(thenGap.competency),
      reason: `Reinforces learning and fills the ${thenGap.priority}-priority gap.`,
    });
  }

  // REASSESS
  steps.push({
    phase: "REASSESS",
    competency: "Adaptive Interview",
    focus: "Re-run the adaptive interview to validate new evidence.",
    practice: ["Retake the mock interview", "Compare readiness index before/after"],
    reason: "Closes the loop — your roadmap should be re-driven by new interview evidence.",
  });

  return { currentGap, steps };
}

function practiceFor(competency: string): string[] {
  const map: Record<string, string[]> = {
    "System Design": ["Design a URL shortener end-to-end", "Sketch a notification fan-out system", "Read the DDIA scaling chapters"],
    Scalability: ["Add caching to an existing service", "Benchmark horizontal vs vertical scaling", "Practice backpressure patterns"],
    "Fault Tolerance": ["Add circuit breakers to a service", "Design failover for a stateful system", "Practice graceful degradation drills"],
    Caching: ["Compare cache-aside vs write-through", "Design invalidation for a feed", "Practice CDN edge caching"],
    "Load Balancing": ["Compare LB algorithms in practice", "Set up consistent hashing", "Practice session affinity tradeoffs"],
    "REST APIs": ["Design a versioned, paginated API", "Practice idempotency", "Add rate limiting"],
    Docker: ["Optimize image layers", "Practice multi-stage builds", "Add healthchecks"],
    Kubernetes: ["Roll out a Deployment with HPA", "Practice canary via Ingress", "Tune resource requests/limits"],
    AWS: ["Design a 3-tier HA app", "Practice IAM least privilege", "Compare RDS vs DynamoDB for a workload"],
    Python: ["Profile a slow function", "Practice asyncio vs threading", "Refactor with type hints"],
    "Machine Learning": ["Build a baseline first", "Practice model selection on tabular data", "Add evaluation metrics"],
    "Deep Learning": ["Implement backprop from scratch", "Practice regularization", "Tune learning rate schedules"],
    Databases: ["Design normalized schema for a domain", "Practice indexing strategy", "Compare SQL vs NoSQL for 3 services"],
  };
  return map[competency] ?? [`Practice 2 real problems involving ${competency}`, `Read a focused primer on ${competency}`, `Write a short design doc using ${competency}`];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
