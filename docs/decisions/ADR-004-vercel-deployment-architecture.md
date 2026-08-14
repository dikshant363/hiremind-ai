# ADR-004: Vercel Serverless Deployment & Performance Optimization

## Status
Accepted

## Context
Deploying Next.js applications with complex AI processing and data-heavy dashboards on serverless hosting platforms requires strict attention to cold-boot times, bundle size, and UI responsiveness.

## Decision
1. **Dynamic Code Splitting:** Non-landing views (`CandidateView`, `MatchView`, `GapsView`, `InterviewView`, `EvaluationView`, `ReadinessView`, `RoadmapView`, `CompareView`) and heavy dialogs (`ControlCenter`, `AchievementGallery`, `CommandPalette`) are asynchronously loaded via `next/dynamic`.
2. **GPU Optimization:** Static radial gradients in `<GradientMesh />` replace continuous infinite CSS keyframe blur transformations, eliminating CPU/GPU rendering bottlenecks.
3. **Stateless API Handlers:** All Next.js App Router route handlers run as stateless Node.js serverless functions with memory-efficient sliding-window rate limiters.
4. **Transient Document Processing:** Ingested PDF/DOCX files are parsed in-memory using buffer streams and immediately released to garbage collection without touching the ephemeral disk.

## Consequences
### Positive
- Initial JavaScript bundle size drastically reduced.
- Sub-100ms first contentful paint (FCP) and smooth 60fps scrolling.
- Compatibility with Vercel Hobby free tier limits.

### Negative
- Slight initial delay (~50ms) on first navigation to deeply nested views as chunks are streamed.
