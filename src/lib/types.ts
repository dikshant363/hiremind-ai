/**
 * HIREMIND AI — Domain Types
 *
 * These types are the single source of truth shared between the deterministic
 * domain engine and the AI layer. The LLM only ever produces JSON that is
 * validated against these shapes; application logic always owns final state.
 */

export type SkillLevel = "unknown" | "weak" | "moderate" | "strong";

export type CompetencyCategory =
  | "system_design"
  | "backend"
  | "frontend"
  | "data"
  | "ml"
  | "cloud"
  | "devops"
  | "languages"
  | "communication"
  | "domain";

export interface SkillEvidence {
  skill: string;
  competency: string;        // canonical competency name (e.g. "System Design")
  category: CompetencyCategory;
  level: SkillLevel;
  source: "resume" | "interview";
  evidence: string;          // short verbatim quote or paraphrase
  strength: number;          // 0..1 deterministic strength
}

export interface CandidateProfile {
  name: string | null;
  summary: string;
  skills: string[];
  experience: { role: string; company: string | null; description: string }[];
  projects: { name: string; description: string }[];
  education: { degree: string; institution: string | null }[];
  certifications: string[];
  evidence: SkillEvidence[];
  raw: {
    sectionsDetected: string[];
    lines: number;
  };
}

export interface JobRequirement {
  skill: string;
  competency: string;
  category: CompetencyCategory;
  importance: "critical" | "high" | "medium" | "low";
  required: boolean;        // hard required vs preferred
}

export interface JobProfile {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: JobRequirement[];
  raw: {
    lines: number;
  };
}

export type MatchStatus = "matched" | "weak" | "unknown" | "gap";

export interface CompetencyMatchRow {
  competency: string;
  category: CompetencyCategory;
  required: boolean;
  importance: "critical" | "high" | "medium" | "low";
  candidateLevel: SkillLevel;
  status: MatchStatus;
  evidence: string | null;
  semanticScore: number;   // 0..1 similarity to closest candidate skill
  contribution: number;    // 0..1 weighted contribution to overall index
}

export interface MatchResult {
  /** Prototype Job Match Index — 0..100 (deterministic aggregation) */
  index: number;
  band: "low" | "fair" | "good" | "strong";
  headline: string;
  rows: CompetencyMatchRow[];
  components: {
    label: string;
    weight: number;     // 0..1
    score: number;      // 0..1
    detail: string;
  }[];
}

export type GapPriority = "critical" | "high" | "medium" | "low";

export interface SkillGap {
  competency: string;
  category: CompetencyCategory;
  importance: "critical" | "high" | "medium" | "low";
  status: MatchStatus;
  candidateLevel: SkillLevel;
  reason: string;
  priority: GapPriority;
  priorityScore: number;   // 0..1 — drives "highest-impact gap" selection
}

export interface InterviewQuestion {
  id: string;
  competency: string;
  category: CompetencyCategory;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  mode: "technical" | "hr";
  reason: string;        // human-readable "why we're asking"
}

export interface AnswerEvaluation {
  questionId: string;
  competency: string;
  technicalAccuracy: number;   // 0..1
  relevance: number;           // 0..1
  depth: number;               // 0..1
  communication: number;       // 0..1
  overall: number;             // 0..1 deterministic aggregate
  strengths: string[];
  weaknesses: string[];
  detectedCompetency: string;
  detectedGap: string | null;   // competency name to drill into next, if any
  nextFocus: string | null;     // human-readable next focus
}

export interface CompetencyState {
  competency: string;
  category: CompetencyCategory;
  resumeLevel: SkillLevel;
  interviewLevel: SkillLevel;
  current: SkillLevel;
  status: MatchStatus;
  notes: string;
}

export type InterviewDifficulty = "auto" | "easy" | "medium" | "hard";

export interface InterviewState {
  status: "idle" | "asking" | "evaluating" | "complete";
  mode: "technical" | "hr";
  /** User-selected difficulty preference — affects question selection. */
  difficultyPreference: InterviewDifficulty;
  currentIndex: number;
  totalQuestions: number;
  targetCompetencies: string[];
  questions: InterviewQuestion[];
  answers: { questionId: string; text: string }[];
  evaluations: AnswerEvaluation[];
  competencyStates: CompetencyState[];
  identifiedWeaknesses: string[];
  history: {
    step: string;
    detail: string;
    at: string;
  }[];
}

export interface ReadinessResult {
  /** Prototype Job Readiness Index — 0..100 */
  index: number;
  band: "low" | "fair" | "good" | "strong";
  headline: string;
  dimensions: {
    label: string;
    score: number;        // 0..1
    detail: string;
  }[];
  criticalBlockers: string[];
  nextBestAction: string;
}

export interface RoadmapStep {
  phase: "TODAY" | "NEXT" | "THEN" | "REASSESS";
  competency: string;
  focus: string;
  practice: string[];
  reason: string;
}

export interface Roadmap {
  currentGap: string;
  steps: RoadmapStep[];
}

/** Full session payload returned to the client. */
export interface SessionPayload {
  id: string;
  isDemo: boolean;
  status: string;
  createdAt: string;
  resume: { name: string | null; summary: string; lines: number };
  job: { title: string; summary: string; lines: number };
  candidate: CandidateProfile;
  jobProfile: JobProfile;
  match: MatchResult | null;
  gaps: SkillGap[] | null;
  interview: InterviewState | null;
  readiness: ReadinessResult | null;
  roadmap: Roadmap | null;
}
