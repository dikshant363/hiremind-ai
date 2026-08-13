/**
 * HIREMIND AI — Deterministic text utilities & semantic similarity.
 *
 * No ML here — pure deterministic functions. Used as fallback when the LLM
 * embedding provider is unavailable, and as the basis for the deterministic
 * match score (application logic owns the final number).
 */

import { normalizeSkill } from "./taxonomy";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "at",
  "for", "with", "as", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would", "should",
  "could", "may", "might", "can", "this", "that", "these", "those", "i", "you",
  "he", "she", "it", "we", "they", "their", "our", "your", "my", "me", "him",
  "her", "them", "us", "who", "what", "when", "where", "why", "how", "which",
  "while", "about", "into", "than", "then", "so", "such", "very", "more", "most",
  "some", "any", "all", "no", "not", "out", "up", "down", "over", "under",
  "experience", "skill", "skills", "work", "working", "strong", "good", "great",
  "responsible", "responsibilities", "required", "requirements", "preferred",
  "plus", "etc", "including", "include", "includes", "using", "use", "used",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#./-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

/**
 * Cosine similarity over term-frequency vectors. Deterministic, fast, good
 * enough for prototype semantic similarity between short skill phrases.
 */
export function cosineSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const va = termFrequency(ta);
  const vb = termFrequency(tb);
  let dot = 0;
  for (const [k, v] of va) {
    const w = vb.get(k);
    if (w) dot += v * w;
  }
  let na = 0;
  for (const v of va.values()) na += v * v;
  let nb = 0;
  for (const v of vb.values()) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Best semantic similarity between a job-required skill and a candidate's
 * known skills. Uses normalized canonical names where possible.
 */
export function bestSemanticMatch(
  requiredSkill: string,
  candidateSkills: string[]
): { score: number; matched: string | null } {
  if (candidateSkills.length === 0) return { score: 0, matched: null };
  const normalizedRequired = normalizeSkill(requiredSkill).competency;
  let best = 0;
  let matched: string | null = null;
  for (const cs of candidateSkills) {
    const normalizedCs = normalizeSkill(cs).competency;
    // Exact canonical match = perfect similarity
    let score = normalizedCs.toLowerCase() === normalizedRequired.toLowerCase() ? 1 : 0;
    if (score === 0) {
      score = Math.max(cosineSimilarity(normalizedRequired, normalizedCs), cosineSimilarity(requiredSkill, cs));
    }
    if (score > best) {
      best = score;
      matched = cs;
    }
  }
  return { score: best, matched };
}

/**
 * Heuristic evidence strength from a sentence/quote (0..1).
 * Longer, verb-rich sentences score higher.
 */
export function evidenceStrength(text: string): number {
  const t = text.trim();
  if (t.length === 0) return 0;
  const tokens = tokenize(t);
  const actionVerbs = new Set([
    "built", "designed", "implemented", "developed", "created", "led",
    "shipped", "deployed", "optimized", "improved", "architected",
    "owned", "launched", "scaled", "automated", "researched", "trained",
    "mentored", "drove", "delivered", "established", "engineered",
  ]);
  let verbs = 0;
  for (const tk of tokens) if (actionVerbs.has(tk)) verbs += 1;
  const lengthScore = Math.min(1, tokens.length / 12);
  const verbScore = Math.min(1, verbs / 2);
  // Weighted: verbs matter more than length
  return Math.round((0.4 * lengthScore + 0.6 * verbScore) * 100) / 100;
}
