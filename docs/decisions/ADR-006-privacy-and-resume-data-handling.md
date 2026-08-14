# ADR-006: Privacy-First Resume Data Processing & Deletion

## Status
Accepted

## Context
Resumes contain Personally Identifiable Information (PII) including names, email addresses, employment history, and education. Users must have complete clarity regarding how their data is handled and retain the right to erase their records.

## Decision
1. **Memory-Only Document Extraction:** PDF and DOCX binary files uploaded through `/api/extract-text` are parsed strictly in Node.js buffer memory and never written to disk or object storage.
2. **Server-Side Authorization:** Private candidate sessions are linked to authenticated user accounts and blocked from unauthorized access via strict 403 Forbidden checks at the database query layer.
3. **Guest Session Protection:** Public/unauthenticated session queries only return designated demo sessions, protecting guest resumes from enumeration.
4. **Permanent Server Deletion:** `DELETE /api/session?id=...` enables users to immediately purge their candidate profile, transcripts, and evaluation history from database storage with audit event tracking.

## Consequences
### Positive
- Strict data minimization reduces privacy risk.
- Compliant with self-service user data removal expectations.
- Zero local file clutter on ephemeral serverless hosting environments.

### Negative
- Users must explicitly save or download roadmap reports before deletion, as purging is immediate and permanent.
