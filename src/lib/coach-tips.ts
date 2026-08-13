/**
 * HIREMIND AI — Answer Coach tips.
 *
 * Static, deterministic coaching content keyed by canonical competency name.
 * Used by the Interactive Answer Coach panel on the interview view to give
 * the candidate real-time, competency-specific guidance on what great
 * answers include and how to structure them.
 */

export interface CoachTip {
  /** What great answers include — concrete, competency-specific cues. */
  greatIncludes: string[];
  /** Structure hint — e.g. STAR, Situation/Task/Action/Result. */
  structure: string;
  /** Common pitfalls to avoid. */
  avoid: string[];
  /** Suggested length guidance. */
  length: string;
}

const GENERIC: CoachTip = {
  greatIncludes: [
    "Concrete example with a real system or project",
    "Tradeoff reasoning — why this choice, not just what",
    "Quantified impact (latency, throughput, users, error rate)",
  ],
  structure: "Context → Approach → Tradeoff → Outcome",
  avoid: [
    "Name-dropping tools without explaining why",
    "Vague generalities ('it depends')",
  ],
  length: "Aim for 4–8 sentences. Depth beats length.",
};

const TIPS: Record<string, CoachTip> = {
  "System Design": {
    greatIncludes: [
      "Clarifying requirements (functional + non-functional) before designing",
      "Capacity estimates (RPS, storage, bandwidth)",
      "Component diagram walk-through with data flow",
      "Bottleneck analysis and explicit tradeoffs",
      "Scaling strategy (horizontal/vertical, caching, sharding)",
    ],
    structure: "Requirements → High-level design → Deep-dive → Scalability → Tradeoffs",
    avoid: [
      "Jumping into code-level detail too early",
      "Skipping capacity estimation",
      "Naming technologies without justifying them",
    ],
    length: "Aim for 6–10 sentences — show structured thinking.",
  },
  "Scalability": {
    greatIncludes: [
      "Horizontal vs vertical scaling tradeoff with a statefulness argument",
      "Specific caching layer (CDN, app cache, DB cache) with invalidation strategy",
      "Load balancing algorithm choice justified by workload",
      "Database scaling (read replicas, sharding key, partitioning)",
    ],
    structure: "Bottleneck → Options → Tradeoff → Choice → Validation",
    avoid: [
      "Saying 'just add caching' without invalidation plan",
      "Ignoring CAP theorem implications",
    ],
    length: "5–8 sentences with concrete numbers.",
  },
  "Fault Tolerance": {
    greatIncludes: [
      "Specific failure mode (network partition, dependency down, slow dep)",
      "Pattern named correctly (circuit breaker, bulkhead, retry with backoff)",
      "Graceful degradation behavior described",
      "Monitoring / observability for the failure path",
    ],
    structure: "Failure scenario → Pattern → Implementation → Tradeoff",
    avoid: [
      "Generic 'we make it reliable'",
      "Forgetting the user-facing degradation experience",
    ],
    length: "5–7 sentences focused on one failure mode.",
  },
  "Caching": {
    greatIncludes: [
      "Cache layer placement (browser/CDN/app/DB) with rationale",
      "Eviction policy (LRU/LFU/TTL) chosen for the access pattern",
      "Invalidation strategy (write-through / write-back / event-based)",
      "Cache stampede / thundering herd handling",
    ],
    structure: "Layer → Key design → Eviction → Invalidation → Failure mode",
    avoid: [
      "'Just use Redis' without key/eviction design",
      "Ignoring consistency vs the source of truth",
    ],
    length: "4–7 sentences; include concrete cache key example.",
  },
  "Databases": {
    greatIncludes: [
      "SQL vs NoSQL tradeoff grounded in the access pattern",
      "Indexing strategy tied to query shapes",
      "Normalization/denormalization choice with consistency cost",
      "Transaction isolation level and why it matters here",
    ],
    structure: "Workload → Choice → Schema → Tradeoff → Failure mode",
    avoid: [
      "Picking a DB because 'it's popular'",
      "Ignoring write/read ratio",
    ],
    length: "5–8 sentences; mention a concrete query or schema.",
  },
  "REST APIs": {
    greatIncludes: [
      "Resource modeling that maps to domain entities",
      "Status code semantics (not just 200 for everything)",
      "Pagination, filtering, and rate limiting design",
      "Versioning strategy (URL / header / content negotiation)",
    ],
    structure: "Resources → Methods → Errors → Pagination → Versioning",
    avoid: [
      "Verbs in URL paths (/getUser)",
      "Ignoring idempotency for non-GET methods",
    ],
    length: "4–7 sentences; cite specific endpoints.",
  },
  "Microservices": {
    greatIncludes: [
      "Service boundary justified by business capability",
      "Communication pattern (sync REST/gRPC vs async queue) with rationale",
      "Data consistency approach (saga, outbox, eventual)",
      "Operational cost acknowledged (observability, deployment)",
    ],
    structure: "Boundary → Communication → Consistency → Operations",
    avoid: [
      "Microservices for microservices' sake",
      "Ignoring distributed transactions",
    ],
    length: "5–8 sentences; show you've felt the pain.",
  },
  "Docker": {
    greatIncludes: [
      "Layer caching strategy for fast rebuilds",
      "Image size optimization (multi-stage build, distroless)",
      "Secret handling (not env vars in plain)",
      "Runtime security (non-root user, read-only fs)",
    ],
    structure: "Base image → Layers → Security → Runtime",
    avoid: [
      "Using :latest tag in production",
      "Baking secrets into layers",
    ],
    length: "4–6 sentences with a concrete Dockerfile choice.",
  },
  "Kubernetes": {
    greatIncludes: [
      "Workload type choice (Deployment/StatefulSet/Job) justified",
      "Resource requests/limits and QoS implications",
      "Service discovery + Ingress flow",
      "Rolling update / rollback strategy",
    ],
    structure: "Workload → Resources → Networking → Rollout",
    avoid: [
      "Forgetting resource limits",
      "Ignoring pod disruption budgets",
    ],
    length: "5–8 sentences.",
  },
  "Python": {
    greatIncludes: [
      "Idiomatic patterns (list comprehensions, context managers)",
      "Performance awareness (GIL, generator vs list)",
      "Type hints + why they help",
      "Testing approach (pytest fixtures, mocking)",
    ],
    structure: "Choice → Idiom → Performance → Testing",
    avoid: ["Java-style Python", "Ignoring the GIL for CPU-bound work"],
    length: "4–6 sentences with a code smell you'd avoid.",
  },
  "Machine Learning": {
    greatIncludes: [
      "Problem framing (classification/regression/ranking) with metric",
      "Feature engineering tied to the signal you expect",
      "Validation strategy that prevents leakage",
      "Production concerns (drift, retraining, serving latency)",
    ],
    structure: "Problem → Features → Model → Validation → Production",
    avoid: [
      "Defaulting to deep learning without justification",
      "Train/test leakage",
    ],
    length: "6–9 sentences; name the metric and why.",
  },
  "Deep Learning": {
    greatIncludes: [
      "Architecture choice justified by data modality",
      "Regularization approach (dropout, weight decay, early stopping)",
      "Training infrastructure (data parallelism, mixed precision)",
      "Evaluation metric matching the business goal",
    ],
    structure: "Data → Architecture → Training → Evaluation",
    avoid: ["Ignoring compute budget", "No baseline comparison"],
    length: "6–9 sentences; mention the loss function.",
  },
  "NLP": {
    greatIncludes: [
      "Tokenization / preprocessing choice",
      "Embedding strategy (TF-IDF, word2vec, transformer)",
      "Evaluation metric aligned with task (BLEU, F1, ROUGE)",
      "Handling of out-of-vocabulary / domain shift",
    ],
    structure: "Preprocess → Embed → Model → Evaluate",
    avoid: ["Ignoring tokenization language dependence", "No baseline"],
    length: "5–8 sentences.",
  },
  "MLOps": {
    greatIncludes: [
      "Training / serving skew awareness",
      "Re-training trigger (scheduled, drift-based, performance-based)",
      "Model registry + versioning",
      "Canary / shadow deployment for new models",
    ],
    structure: "Train → Validate → Deploy → Monitor → Retrain",
    avoid: ["No monitoring", "Manual model promotion in prod"],
    length: "5–8 sentences.",
  },
  "Communication": {
    greatIncludes: [
      "Structured response (Context → Action → Result)",
      "Concrete stakeholder and what they cared about",
      "Tradeoff you communicated and the decision made",
      "Outcome with measurable impact",
    ],
    structure: "STAR: Situation → Task → Action → Result",
    avoid: ["Vague 'I worked with the team'", "No outcome"],
    length: "4–7 sentences ending with a measurable result.",
  },
  "Collaboration": {
    greatIncludes: [
      "Specific cross-functional partner and their concern",
      "How you built alignment (doc, meeting, decision framework)",
      "Conflict resolution approach",
      "Resulting velocity / quality improvement",
    ],
    structure: "Partner → Conflict → Approach → Outcome",
    avoid: ["'We worked well together'", "No opposing viewpoint surfaced"],
    length: "4–7 sentences.",
  },
};

/** Get coaching tips for a competency, falling back to the generic template. */
export function getCoachTips(competency: string): CoachTip {
  return TIPS[competency] ?? GENERIC;
}

/** Compute a real-time "answer readiness" score 0..1 from the answer text. */
export function answerReadiness(answer: string): {
  score: number;
  signals: { label: string; ok: boolean }[];
} {
  const text = answer.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const hasLength = words.length >= 30;
  const hasStructure = sentences.length >= 2;
  const hasNumbers = /\d+/.test(text);
  const hasTradeoff =
    /(trade-?off|tradeoffs|alternatively|on the other hand|whereas|versus|instead)/i.test(
      text
    );
  const hasConcrete =
    /(because|specifically|for example|e\.g\.|in our|when we|at scale|in production)/i.test(
      text
    );

  const signals = [
    { label: "Substance (30+ words)", ok: hasLength },
    { label: "Structure (2+ sentences)", ok: hasStructure },
    { label: "Quantified (numbers)", ok: hasNumbers },
    { label: "Tradeoff reasoning", ok: hasTradeoff },
    { label: "Concrete example", ok: hasConcrete },
  ];

  const score = signals.filter((s) => s.ok).length / signals.length;
  return { score, signals };
}
