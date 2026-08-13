/**
 * HIREMIND AI — AI Abstraction Layer
 *
 * Wraps z-ai-web-dev-sdk with timeouts, validation, and graceful fallbacks.
 * Every method returns validated structured output. Malformed AI output is
 * rejected safely and never mutates critical state directly.
 *
 * "AI understands. Application logic decides."
 */

import ZAI from "z-ai-web-dev-sdk";
import type {
  CandidateProfile,
  JobProfile,
  JobRequirement,
  SkillEvidence,
  AnswerEvaluation,
  InterviewQuestion,
  InterviewState,
} from "./types";
import { normalizeSkill } from "./taxonomy";
import { evidenceStrength } from "./text";

const TIMEOUT_MS = 25_000;

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("AI_TIMEOUT")), ms)),
  ]);
}

async function chatJSON<T>(system: string, user: string, fallback: T): Promise<{ data: T; usedFallback: boolean; raw?: string }> {
  try {
    const zai = await ZAI.create();
    const completion = await withTimeout(
      zai.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        thinking: { type: "disabled" },
      })
    );
    const raw = completion.choices[0]?.message?.content ?? "";
    // Extract JSON from the response (handles ```json fences)
    const jsonStr = extractJSON(raw);
    if (!jsonStr) {
      return { data: fallback, usedFallback: true, raw };
    }
    const parsed = JSON.parse(jsonStr);
    return { data: parsed as T, usedFallback: false, raw };
  } catch (err) {
    console.warn("[HIREMIND] AI call failed, using fallback:", (err as Error).message);
    return { data: fallback, usedFallback: true };
  }
}

function extractJSON(raw: string): string | null {
  if (!raw) return null;
  // Try fenced ```json ... ```
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  // Try raw JSON object/array
  const trimmed = raw.trim();
  const startObj = trimmed.indexOf("{");
  const startArr = trimmed.indexOf("[");
  let start = -1;
  if (startObj >= 0 && startArr >= 0) start = Math.min(startObj, startArr);
  else start = Math.max(startObj, startArr);
  if (start < 0) return null;
  const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (end <= start) return null;
  return trimmed.slice(start, end + 1).trim();
}

// ---------- Resume Intelligence ----------

export async function extractResume(text: string): Promise<{ profile: CandidateProfile; usedFallback: boolean }> {
  const fallback = deterministicResume(text);
  const system = `You are HireMind AI's resume parser. Extract a structured candidate profile from raw resume text.

Rules:
- Extract ONLY information actually present. Never invent skills, jobs, or education.
- For every skill you extract, include a short evidence sentence quoted/paraphrased from the resume.
- Distinguish KNOWN (clear evidence), WEAK (mentioned but light), and UNKNOWN (absent).
- Normalize skill names (e.g. "RESTful API" -> "REST APIs", "k8s" -> "Kubernetes").

Respond with ONLY a JSON object matching this TypeScript type:
{
  "name": string | null,
  "summary": string,         // 1-2 sentence professional summary derived from the resume
  "skills": string[],        // raw skill strings as found
  "experience": [{ "role": string, "company": string | null, "description": string }],
  "projects": [{ "name": string, "description": string }],
  "education": [{ "degree": string, "institution": string | null }],
  "certifications": string[],
  "evidence": [{ "skill": string, "evidence": string, "strength": number }] // strength 0..1
}`;

  const { data, usedFallback } = await chatJSON<CandidateProfile>(system, `Resume text:\n\n${text}`, fallback);

  if (usedFallback) return { profile: fallback, usedFallback: true };

  // Post-process: normalize + compute deterministic strength if missing
  const profile: CandidateProfile = {
    name: data.name ?? null,
    summary: data.summary ?? fallback.summary,
    skills: Array.from(new Set((data.skills ?? []).map((s) => s.trim()).filter(Boolean))),
    experience: data.experience ?? [],
    projects: data.projects ?? [],
    education: data.education ?? [],
    certifications: data.certifications ?? [],
    evidence: [],
    raw: {
      sectionsDetected: detectSections(text),
      lines: text.split("\n").length,
    },
  };

  profile.evidence = (data.evidence ?? []).map((e) => {
    const norm = normalizeSkill(e.skill);
    const ev: SkillEvidence = {
      skill: e.skill,
      competency: norm.competency,
      category: norm.category,
      level: e.strength >= 0.75 ? "strong" : e.strength >= 0.4 ? "moderate" : e.strength > 0 ? "weak" : "unknown",
      source: "resume",
      evidence: e.evidence,
      strength: Math.max(0, Math.min(1, e.strength ?? evidenceStrength(e.evidence))),
    };
    return ev;
  });

  // Deduplicate evidence by competency, keep highest strength
  const byComp = new Map<string, SkillEvidence>();
  for (const e of profile.evidence) {
    const ex = byComp.get(e.competency);
    if (!ex || e.strength > ex.strength) byComp.set(e.competency, e);
  }
  profile.evidence = Array.from(byComp.values());

  return { profile, usedFallback: false };
}

function deterministicResume(text: string): CandidateProfile {
  // Naive line-based extraction fallback
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = lines[0] ?? null;

  const knownSkills = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Django",
    "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "scikit-learn",
    "Pandas", "NumPy", "REST APIs", "GraphQL", "Microservices", "Redis", "Kafka",
    "CI/CD", "Git", "Linux", "System Design", "Scalability", "Caching",
  ];

  const skills: string[] = [];
  const evidence: SkillEvidence[] = [];
  const lower = text.toLowerCase();
  for (const s of knownSkills) {
    if (lower.includes(s.toLowerCase())) {
      skills.push(s);
      const norm = normalizeSkill(s);
      const ev = extractContextSentence(text, s);
      const strength = evidenceStrength(ev);
      evidence.push({
        skill: s,
        competency: norm.competency,
        category: norm.category,
        level: strength >= 0.75 ? "strong" : strength >= 0.4 ? "moderate" : strength > 0 ? "weak" : "unknown",
        source: "resume",
        evidence: ev,
        strength,
      });
    }
  }

  return {
    name,
    summary: `Candidate with ${skills.length} detected skills. (Deterministic fallback parse — AI was unavailable.)`,
    skills,
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    evidence,
    raw: {
      sectionsDetected: detectSections(text),
      lines: lines.length,
    },
  };
}

function extractContextSentence(text: string, term: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx < 0) return `Mentions ${term}.`;
  const start = text.lastIndexOf(".", idx);
  const end = text.indexOf(".", idx);
  const s = text.slice(start + 1, end > 0 ? end + 1 : text.length).trim();
  return s.slice(0, 200) || `Mentions ${term}.`;
}

function detectSections(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const s of ["experience", "education", "projects", "skills", "certifications", "summary", "objective", "publications"]) {
    if (lower.includes(s)) found.push(s);
  }
  return found;
}

// ---------- Job Intelligence ----------

export async function extractJob(title: string, text: string): Promise<{ profile: JobProfile; usedFallback: boolean }> {
  const fallback = deterministicJob(title, text);
  const system = `You are HireMind AI's job description parser. Extract structured job requirements from raw job description text.

Rules:
- Extract ONLY what the JD actually requires. Never invent requirements.
- Classify each requirement as required (true) or preferred (false).
- Assign importance: critical / high / medium / low based on emphasis in the JD.
- Normalize skill names (e.g. "RESTful API" -> "REST APIs").

Respond with ONLY a JSON object matching this TypeScript type:
{
  "title": string,
  "summary": string,         // 1-2 sentence role summary
  "responsibilities": string[],
  "requirements": [{ "skill": string, "importance": "critical"|"high"|"medium"|"low", "required": boolean }]
}`;

  const { data, usedFallback } = await chatJSON<JobProfile>(system, `Job title: ${title}\n\nJob description:\n${text}`, fallback);

  if (usedFallback) return { profile: fallback, usedFallback: true };

  const profile: JobProfile = {
    title: data.title ?? title,
    summary: data.summary ?? fallback.summary,
    responsibilities: data.responsibilities ?? [],
    requirements: [],
    raw: { lines: text.split("\n").length },
  };

  const seen = new Set<string>();
  for (const r of data.requirements ?? []) {
    const norm = normalizeSkill(r.skill);
    if (seen.has(norm.competency)) continue;
    seen.add(norm.competency);
    const req: JobRequirement = {
      skill: r.skill,
      competency: norm.competency,
      category: norm.category,
      importance: ["critical", "high", "medium", "low"].includes(r.importance) ? r.importance : "medium",
      required: typeof r.required === "boolean" ? r.required : true,
    };
    profile.requirements.push(req);
  }

  if (profile.requirements.length === 0) profile.requirements = fallback.requirements;

  return { profile, usedFallback: false };
}

function deterministicJob(title: string, text: string): JobProfile {
  const knownSkills = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI",
    "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS",
    "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "scikit-learn",
    "REST APIs", "GraphQL", "Microservices", "Redis", "Kafka", "CI/CD",
    "System Design", "Scalability", "Communication", "Leadership",
  ];
  const lower = text.toLowerCase();
  const requirements: JobRequirement[] = [];
  const seen = new Set<string>();
  for (const s of knownSkills) {
    if (lower.includes(s.toLowerCase())) {
      const norm = normalizeSkill(s);
      if (seen.has(norm.competency)) continue;
      seen.add(norm.competency);
      const importance = /must have|required|strong|expert|deep|years/.test(lower.slice(lower.indexOf(s.toLowerCase()) - 30, lower.indexOf(s.toLowerCase()) + 50)) ? "high" : "medium";
      requirements.push({
        skill: s,
        competency: norm.competency,
        category: norm.category,
        importance: importance as JobRequirement["importance"],
        required: true,
      });
    }
  }
  return {
    title,
    summary: `Deterministic fallback parse — ${requirements.length} requirements detected from keyword scan.`,
    responsibilities: [],
    requirements,
    raw: { lines: text.split("\n").length },
  };
}

// ---------- Question Generation ----------

export async function generateQuestion(
  competency: string,
  category: string,
  gapReason: string,
  previousAnswers: { question: string; answer: string; evaluation: string }[],
  fallback: InterviewQuestion,
  count: number = 1
): Promise<{ questions: InterviewQuestion[]; usedFallback: boolean }> {
  const system = `You are HireMind AI's interview question generator for a gap-driven adaptive interview.

Generate ${count} diverse focused technical interview question${count > 1 ? "s" : ""} that:
- Target the specified competency
- Are appropriate for a ${category} role context
- Avoid duplication with previous questions
- Probe depth, not trivia
- Are 1-2 sentences max each
${count > 1 ? `- Cover different difficulty levels (easy, medium, hard) and angles (conceptual, practical, tradeoff-based)
- Each should test a different facet of the competency` : ""}

Respond with ONLY JSON: { "questions": [{ "text": string, "difficulty": "easy"|"medium"|"hard", "reason": string }] }`;

  const historyStr = previousAnswers.length
    ? `\n\nPrevious Q&A (avoid duplication, build on weaknesses):\n${previousAnswers.map((p, i) => `${i + 1}. Q: ${p.question}\nA: ${p.answer}\nEval: ${p.evaluation}`).join("\n")}`
    : "";

  const user = `Competency to test: ${competency}\nWhy we're asking: ${gapReason}${historyStr}`;

  const fallbackArr = [{
    text: fallback.text,
    difficulty: fallback.difficulty,
    reason: fallback.reason,
  }];

  const { data, usedFallback } = await chatJSON<{ questions: { text: string; difficulty: "easy" | "medium" | "hard"; reason: string }[] }>(
    system,
    user,
    { questions: fallbackArr }
  );

  const rawQuestions = Array.isArray(data?.questions) ? data.questions : fallbackArr;

  const questions: InterviewQuestion[] = rawQuestions.slice(0, count).map((q, i) => ({
    id: `${fallback.id}-${i}`,
    competency,
    category: category as InterviewQuestion["category"],
    text: q.text?.trim() || fallback.text,
    difficulty: q.difficulty || fallback.difficulty,
    mode: "technical" as const,
    reason: q.reason?.trim() || fallback.reason,
  }));

  // Ensure at least one question
  if (questions.length === 0) {
    questions.push({
      id: fallback.id,
      competency,
      category: category as InterviewQuestion["category"],
      text: fallback.text,
      difficulty: fallback.difficulty,
      mode: "technical",
      reason: fallback.reason,
    });
  }

  return { questions, usedFallback };
}

// ---------- Answer Evaluation ----------

export async function evaluateAnswer(
  question: InterviewQuestion,
  answer: string,
  fallback: AnswerEvaluation
): Promise<{ evaluation: AnswerEvaluation; usedFallback: boolean }> {
  const system = `You are HireMind AI's structured answer evaluator for a technical mock interview.

Evaluate the candidate's answer to a ${question.competency} question.

Produce a strict JSON object with these fields:
{
  "technicalAccuracy": number,   // 0..1
  "relevance": number,           // 0..1
  "depth": number,               // 0..1
  "communication": number,       // 0..1
  "strengths": string[],         // 1-3 short bullets
  "weaknesses": string[],        // 1-3 short bullets
  "detectedCompetency": string,  // canonical competency the answer actually demonstrated
  "detectedGap": string | null,  // a deeper competency to drill into next, or null
  "nextFocus": string | null     // human-readable next focus, or null
}

Rules:
- Be honest and specific. Never inflate scores.
- detectedGap must be a real sub-competency (e.g. "Scalability", "Caching", "Fault Tolerance"), not generic.
- If the answer is excellent, set detectedGap to null.
- Do NOT include any text outside the JSON.`;

  const user = `Question (competency: ${question.competency}):\n${question.text}\n\nCandidate's answer:\n${answer}`;

  const { data, usedFallback } = await chatJSON<AnswerEvaluation>(system, user, fallback);

  if (usedFallback) return { evaluation: fallback, usedFallback: true };

  // Clamp + validate
  const clamp = (n: unknown) => Math.max(0, Math.min(1, typeof n === "number" ? n : 0));
  const technicalAccuracy = clamp(data.technicalAccuracy);
  const relevance = clamp(data.relevance);
  const depth = clamp(data.depth);
  const communication = clamp(data.communication);
  // Deterministic overall: weighted aggregate (application logic owns this number)
  const overall = Math.round((0.4 * technicalAccuracy + 0.25 * depth + 0.2 * relevance + 0.15 * communication) * 100) / 100;

  const evaluation: AnswerEvaluation = {
    questionId: question.id,
    competency: question.competency,
    technicalAccuracy: Math.round(technicalAccuracy * 100) / 100,
    relevance: Math.round(relevance * 100) / 100,
    depth: Math.round(depth * 100) / 100,
    communication: Math.round(communication * 100) / 100,
    overall,
    strengths: Array.isArray(data.strengths) ? data.strengths.slice(0, 3) : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.slice(0, 3) : [],
    detectedCompetency: typeof data.detectedCompetency === "string" ? data.detectedCompetency : question.competency,
    detectedGap: typeof data.detectedGap === "string" && data.detectedGap.length > 0 ? data.detectedGap : null,
    nextFocus: typeof data.nextFocus === "string" && data.nextFocus.length > 0 ? data.nextFocus : null,
  };

  return { evaluation, usedFallback: false };
}

// ---------- Roadmap polish (optional AI assist) ----------

export async function polishRoadmapReason(
  competency: string,
  reason: string
): Promise<{ reason: string; usedFallback: boolean }> {
  const system = `You are HireMind AI. Rewrite the given roadmap reason in 1 short, motivating, specific sentence. Do not invent facts. Respond with ONLY JSON: { "reason": string }`;
  const { data, usedFallback } = await chatJSON<{ reason: string }>(system, `Competency: ${competency}\nReason: ${reason}`, { reason });
  return { reason: data.reason?.trim() || reason, usedFallback };
}
