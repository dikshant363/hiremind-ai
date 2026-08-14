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
import { normalizeSkill, TAXONOMY } from "./taxonomy";
import { evidenceStrength } from "./text";
import { db } from "@/lib/db";

const TIMEOUT_MS = 25_000;
const RETRY_DELAY_MS = 500;
const MAX_RETRIES = 1;

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("AI_TIMEOUT")), ms)),
  ]);
}

/**
 * Classify an error as transient (worth retrying) or deterministic (skip retry).
 *
 * Transient errors include:
 *   - Network failures (fetch, ECONNRESET, ETIMEDOUT, socket hang up, aborted)
 *   - Our own AI_TIMEOUT sentinel
 *   - 5xx HTTP errors from the upstream provider
 *
 * Deterministic errors include:
 *   - JSON parse / SyntaxError (bad model output)
 *   - 4xx HTTP errors (auth, bad request, quota — won't fix themselves)
 *   - Anything we can't classify as transient defaults to "do not retry" so we
 *     fail fast instead of compounding a hopeless situation.
 */
function isTransientError(err: unknown): boolean {
  const message = (err as Error)?.message ?? String(err);
  if (!message) return false;
  const lower = message.toLowerCase();
  // Our own timeout sentinel.
  if (lower.includes("ai_timeout")) return true;
  // Network / transport class.
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound") ||
    lower.includes("socket hang up") ||
    lower.includes("aborted") ||
    lower.includes("und_err_") /* undici error codes */ ||
    lower.includes("retry") // provider-side retry hint
  ) {
    return true;
  }
  // 5xx HTTP status from upstream provider.
  if (/\b5\d{2}\b/.test(lower) && lower.includes("status")) return true;
  return false;
}

/**
 * Retry helper. Wraps an async fn and retries on transient errors only.
 * JSON parse / validation / 4xx errors are deterministic and propagate
 * immediately — there's no point burning another 15s on a response shape
 * the model can't produce.
 *
 * On each retry attempt we log a warning to the AuditEvent trail (fire-and-
 * forget) so operators can observe flakiness trends without bouncing logs.
 *
 * Total worst-case time before fallback:
 *   25s (initial timeout) + 500ms (backoff) + 25s (retry timeout) = 50.5s
 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    if (!isTransientError(err)) throw err;

    const message = (err as Error)?.message ?? String(err);
    console.warn(
      `[HIREMIND] AI transient error, retrying (${retries} left): ${message}`
    );

    // Fire-and-forget audit log — don't let observability break the call path.
    void db.auditEvent
      .create({
        data: {
          category: "ai",
          action: "retry",
          level: "warn",
          message: `AI call failed, retrying: ${message}`,
        },
      })
      .catch(() => {
        /* swallow logging failures */
      });

    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return withRetry(fn, retries - 1);
  }
}

export type AIStatusType = "connected" | "fallback" | "unavailable";

export interface AIStatusInfo {
  status: AIStatusType;
  provider: "gemini" | "zai-sdk" | "deterministic-fallback";
  model?: string;
  isConfigured: boolean;
  message: string;
}

export function getAIStatus(): AIStatusInfo {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const isValidFormat = Boolean(geminiKey && geminiKey.trim().length >= 20 && !geminiKey.trim().startsWith("AQ."));
  if (isValidFormat) {
    return {
      status: "connected",
      provider: "gemini",
      model: "gemini-2.5-flash",
      isConfigured: true,
      message: "Live Google Gemini AI engine connected.",
    };
  }
  return {
    status: "fallback",
    provider: "deterministic-fallback",
    isConfigured: false,
    message: "Deterministic intelligence engine active (resilient offline fallback).",
  };
}

async function callGeminiDirect(system: string, user: string, apiKey: string): Promise<string> {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
  let lastErr: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `System Instruction:\n${system}\n\nUser Request:\n${user}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Gemini ${model} status ${res.status}: ${errorText.slice(0, 150)}`);
      }

      const data = await res.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (content) return content;
    } catch (err) {
      lastErr = err as Error;
    }
  }

  throw lastErr || new Error("Gemini API call failed");
}

async function chatJSON<T>(system: string, user: string, fallback: T): Promise<{ data: T; usedFallback: boolean; source: "live-ai" | "deterministic-fallback"; raw?: string }> {
  // Phase 1: get a raw completion string from Gemini or SDK, with retry on transient
  // errors (timeout / network). JSON parsing is excluded from retry because a
  // malformed response is deterministic — retrying would just waste 25 more
  // seconds producing the same broken JSON.
  let raw = "";
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  const isKeyUsable = geminiKey.length >= 20 && !geminiKey.startsWith("AQ.");

  try {
    const fetchCompletion = async () => {
      // 1. Try Gemini API directly if key is configured and valid
      if (isKeyUsable) {
        try {
          return await withTimeout(callGeminiDirect(system, user, geminiKey), TIMEOUT_MS);
        } catch (geminiErr) {
          console.warn("[HIREMIND] Gemini direct API notice, trying SDK fallback:", (geminiErr as Error).message);
        }
      }

      // 2. Try ZAI SDK
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
      return completion.choices[0]?.message?.content ?? "";
    };
    raw = await withRetry(fetchCompletion);
  } catch (err) {
    console.info(
      "[HIREMIND] AI resilience fallback active (using built-in deterministic engine):",
      (err as Error).message
    );
    return { data: fallback, usedFallback: true, source: "deterministic-fallback" };
  }

  // Phase 2: parse JSON — deterministic. No retry.
  try {
    const jsonStr = extractJSON(raw);
    if (!jsonStr) {
      return { data: fallback, usedFallback: true, source: "deterministic-fallback", raw };
    }
    const parsed = JSON.parse(jsonStr);
    return { data: parsed as T, usedFallback: false, source: "live-ai", raw };
  } catch (err) {
    console.warn(
      "[HIREMIND] AI response JSON parse failed (deterministic, no retry), using fallback:",
      (err as Error).message
    );
    return { data: fallback, usedFallback: true, source: "deterministic-fallback", raw };
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

export async function extractResume(text: string): Promise<{ profile: CandidateProfile; usedFallback: boolean; source: "live-ai" | "deterministic-fallback" }> {
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

  const { data, usedFallback, source } = await chatJSON<CandidateProfile>(system, `Resume text:\n\n${text}`, fallback);

  if (usedFallback) return { profile: fallback, usedFallback: true, source: "deterministic-fallback" };

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

  return { profile, usedFallback: false, source };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALL_TAXONOMY_KEYWORDS = Array.from(
  new Set(TAXONOMY.flatMap((node) => [node.competency, ...node.aliases]))
).sort((a, b) => b.length - a.length);

function deterministicResume(text: string): CandidateProfile {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = lines[0] ?? null;

  const skills: string[] = [];
  const evidence: SkillEvidence[] = [];
  const lower = text.toLowerCase();
  for (const s of ALL_TAXONOMY_KEYWORDS) {
    if (s.length < 2) continue;
    // Word boundary check for short terms
    const regex = s.length <= 3 ? new RegExp(`\\b${escapeRegex(s.toLowerCase())}\\b`, "i") : null;
    const matches = regex ? regex.test(lower) : lower.includes(s.toLowerCase());
    if (matches) {
      const norm = normalizeSkill(s);
      skills.push(norm.competency);
      const ev = extractContextSentence(text, s);
      const strength = evidenceStrength(ev);
      evidence.push({
        skill: norm.competency,
        competency: norm.competency,
        category: norm.category,
        level: strength >= 0.75 ? "strong" : strength >= 0.4 ? "moderate" : strength > 0 ? "weak" : "unknown",
        source: "resume",
        evidence: ev,
        strength,
      });
    }
  }

  // Deduplicate evidence by competency, keep highest strength
  const byComp = new Map<string, SkillEvidence>();
  for (const e of evidence) {
    const ex = byComp.get(e.competency);
    if (!ex || e.strength > ex.strength) byComp.set(e.competency, e);
  }
  const dedupedEvidence = Array.from(byComp.values());
  const dedupedSkills = Array.from(new Set(skills));

  return {
    name,
    summary: `Candidate with ${dedupedSkills.length} detected skills. (Deterministic fallback parse — AI was unavailable.)`,
    skills: dedupedSkills,
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    evidence: dedupedEvidence,
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

export async function extractJob(title: string, text: string): Promise<{ profile: JobProfile; usedFallback: boolean; source: "live-ai" | "deterministic-fallback" }> {
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

  const { data, usedFallback, source } = await chatJSON<JobProfile>(system, `Job title: ${title}\n\nJob description:\n${text}`, fallback);

  if (usedFallback) return { profile: fallback, usedFallback: true, source: "deterministic-fallback" };

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

  return { profile, usedFallback: false, source };
}

function deterministicJob(title: string, text: string): JobProfile {
  const lower = text.toLowerCase();
  const requirements: JobRequirement[] = [];
  const seen = new Set<string>();
  for (const s of ALL_TAXONOMY_KEYWORDS) {
    if (s.length < 2) continue;
    const regex = s.length <= 3 ? new RegExp(`\\b${escapeRegex(s.toLowerCase())}\\b`, "i") : null;
    const matches = regex ? regex.test(lower) : lower.includes(s.toLowerCase());
    if (matches) {
      const norm = normalizeSkill(s);
      if (seen.has(norm.competency)) continue;
      seen.add(norm.competency);
      const importance = /must have|required|strong|expert|deep|years|5\+|6\+|3\+/.test(
        lower.slice(Math.max(0, lower.indexOf(s.toLowerCase()) - 40), Math.min(lower.length, lower.indexOf(s.toLowerCase()) + 60))
      ) ? "high" : "medium";
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
): Promise<{ questions: InterviewQuestion[]; usedFallback: boolean; source: "live-ai" | "deterministic-fallback" }> {
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

  const { data, usedFallback, source } = await chatJSON<{ questions: { text: string; difficulty: "easy" | "medium" | "hard"; reason: string }[] }>(
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

  return { questions, usedFallback, source };
}

// ---------- Answer Evaluation ----------

export async function evaluateAnswer(
  question: InterviewQuestion,
  answer: string,
  fallback: AnswerEvaluation
): Promise<{ evaluation: AnswerEvaluation; usedFallback: boolean; source: "live-ai" | "deterministic-fallback" }> {
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

  const { data, usedFallback, source } = await chatJSON<AnswerEvaluation>(system, user, fallback);

  if (usedFallback) return { evaluation: fallback, usedFallback: true, source: "deterministic-fallback" };

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

  return { evaluation, usedFallback: false, source };
}

// ---------- Roadmap polish (optional AI assist) ----------

export async function polishRoadmapReason(
  competency: string,
  reason: string
): Promise<{ reason: string; usedFallback: boolean; source: "live-ai" | "deterministic-fallback" }> {
  const system = `You are HireMind AI. Rewrite the given roadmap reason in 1 short, motivating, specific sentence. Do not invent facts. Respond with ONLY JSON: { "reason": string }`;
  const { data, usedFallback, source } = await chatJSON<{ reason: string }>(system, `Competency: ${competency}\nReason: ${reason}`, { reason });
  return { reason: data.reason?.trim() || reason, usedFallback, source };
}
