# Privacy & Data Handling Policy

Resume documents and candidate interview responses contain sensitive personal information (PII). HireMind AI is designed with data minimization, transient document processing, and transparent user controls.

> [!NOTE]
> This document describes the technical data handling architecture of the open-source HireMind AI software. It does not constitute formal legal advice.

---

## 1. What Data is Processed

When a user interacts with HireMind AI, the following data may be processed:
- **Resume Text:** Candidate name, contact details (if present), work experience, projects, education, and technical competencies extracted from uploaded documents.
- **Target Job Information:** Role title, requirements, responsibilities, and qualifications.
- **Interview Interactions:** Candidate-authored textual answers submitted during adaptive mock interview turns.
- **Computed Results:** Mathematical match indexes, identified skill gaps, answer evaluations, readiness indexes, and personalized roadmap recommendations.

---

## 2. Where and How Data is Stored

- **Transient Document Extraction:** Uploaded PDF and DOCX files are parsed in-memory (RAM) to extract plain text. Uploaded raw binary files are discarded after parsing and are not retained on server storage.
- **Database Persistence:** Text transcripts and structured JSON results are stored in the configured database (local SQLite in development, managed PostgreSQL in production).
- **Session Isolation:** Authenticated user sessions are strictly linked to the creating user's account ID and protected by server-side authorization checks.
- **No Unconsented Third-Party Sharing:** HireMind AI does not sell, broker, or syndicate candidate resume data.

---

## 3. External AI Processing

When an external LLM provider (e.g. Google Gemini) is configured:
- Structured text payloads (resume excerpts, job descriptions, or interview answers) are sent via HTTPS to the provider's API for qualitative interpretation.
- If the external AI provider is unavailable, unconfigured, or disabled, all processing is performed locally via the built-in deterministic heuristic engine.

---

## 4. User Data Deletion

HireMind AI provides direct server-side data deletion:
- Users can delete individual sessions via `DELETE /api/session?id=<session_id>`.
- Deletion removes the complete session payload (`candidateProfileJson`, `jobProfileJson`, `matchJson`, `gapsJson`, `interviewJson`, `readinessJson`, `roadmapJson`) from database storage.
- An immutable, anonymized audit log (`AuditEvent`) recording the deletion timestamp and category is retained for security observability without storing any PII.
