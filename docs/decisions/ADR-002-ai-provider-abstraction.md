# ADR-002: AI Provider Abstraction with Safe Multi-Model Fallbacks

## Status
Accepted

## Context
External AI inference services are subject to quota exhaustion, network partitions, API format changes, and rate limits. The application must never crash or freeze if an external AI provider fails or if credentials are invalid or missing.

## Decision
We implemented a resilient AI abstraction layer in `src/lib/ai.ts`:
1. **Multi-Model Fallback Chain:** Google Gemini integration automatically falls back across `gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-1.5-pro` → `gemini-2.0-flash`.
2. **Safe Credential Validation:** `getAIStatus()` validates environment keys safely without throwing uncaught exceptions or leaking secrets in error traces.
3. **Transparent Truthfulness:** All analysis endpoints return explicit source metadata (`source: "live-ai" | "deterministic-fallback"`). The UI truthfully communicates whether AI or the local deterministic heuristic engine generated the result.
4. **Graceful Degradation:** When an AI call fails or times out, the system automatically falls back to deterministic rule-based extraction without user-facing interruptions.

## Consequences
### Positive
- Zero downtime when third-party AI APIs experience outages.
- Truthful reporting prevents misleading users about LLM usage.
- High developer velocity in local environments without requiring active paid API keys.

### Negative
- Deterministic extraction fallback relies on pattern matching and keyword dictionaries, which may miss novel or niche domain phrasing compared to live LLMs.
