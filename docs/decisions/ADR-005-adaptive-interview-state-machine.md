# ADR-005: Adaptive Mock Interview Dynamic State Machine

## Status
Accepted

## Context
Static mock interviews that follow predetermined question lists fail to simulate real technical interviews. If a candidate displays a significant knowledge gap on a foundational topic (e.g., distributed caching or database indexing), a real interviewer explores that weakness rather than moving blindly through a script.

## Decision
We implemented a dynamic, turn-based interview state machine in `src/lib/engine.ts`:
1. **Initial Probing:** Question 1 focuses on the candidate's highest-priority missing requirement identified in the gap analysis.
2. **Turn-Based Evaluation:** Each candidate answer is qualitatively evaluated across 4 dimensions: Technical Accuracy (40%), Depth (25%), Relevance (20%), and Communication (15%).
3. **Adaptive Branching:** If an answer reveals a specific conceptual gap (e.g., scoring <50% on Depth or identifying a missing architectural trade-off), the engine automatically selects or generates the subsequent question targeting that uncovered weakness.
4. **Session Persistence:** Every question, answer, and evaluation is appended to the database session state to ensure recovery on page refresh.

## Consequences
### Positive
- Highly realistic mock interview experience reflecting genuine technical interviewer behavior.
- Direct alignment between interview feedback and subsequent roadmap recommendations.
- Mathematical rigor: Readiness scores reflect verified interview performance rather than assumed credentials.

### Negative
- Multi-turn interviews require persistent database roundtrips to track state progression.
