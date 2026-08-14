# ADR-001: Deterministic Scoring Engine for Transparent Decision-Making

## Status
Accepted

## Context
Recruitment intelligence and candidate assessment platforms frequently suffer from the "black-box problem" when relying solely on Large Language Models (LLMs) to generate final match and readiness scores. LLMs exhibit non-deterministic behavior, hallucinations, prompt drift, and lack mathematical reproducibility, making score explanations indefensible to candidates and hiring managers.

## Decision
We separate **Qualitative Interpretation** from **Quantitative Evaluation**:
1. **LLMs / AI:** Responsible exclusively for unstructured document parsing (extracting raw skills, experience snippets, and responsibilities) and qualitative interview answer evaluation.
2. **Deterministic Engine (`src/lib/engine.ts`):** Responsible exclusively for all mathematical calculations:
   - **4-Axis Match Index:** `0.35 * Required + 0.35 * Evidence + 0.20 * Semantic + 0.10 * Breadth`
   - **4-Dimension Answer Score:** `0.40 * Technical + 0.25 * Depth + 0.20 * Relevance + 0.15 * Communication`
   - **5-Axis Readiness Index:** `0.30 * Alignment + 0.25 * Coverage + 0.20 * Interview + 0.15 * Technical + 0.10 * Communication`
   - **Dynamic 4-Phase Roadmap:** Algorithmic step derivation based on prioritized gap severity.

## Consequences
### Positive
- **100% Reproducibility:** The exact same candidate and job description always produce identical, audit-proof scores.
- **Explainability:** Every score component can be unpacked into constituent mathematical weights and specific matched/unmatched competencies.
- **Offline Resilience:** The platform operates with full fidelity even when external AI APIs are unconfigured or unreachable.

### Negative
- Requires maintaining an explicit taxonomy of normalized skills and competency mappings in application code.
