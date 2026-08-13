# Task ID: 7 — Session Comparison Feature

**Agent**: main (full-stack-developer)
**Task**: Add a side-by-side comparison view that lets users compare two past sessions to see growth over time.

## Plan
1. Backend: NEW `/api/session/compare?a=<id>&b=<id>` GET route returning `{ a, b, deltas }`.
2. Store: extend Zustand `StoreState` with `comparison`, `loadingComparison`, `loadComparison(aId, bId)`, `clearComparison()`, and add `'compare'` to the `View` union + `VALID_VIEWS`.
3. UI: NEW `src/components/hiremind/compare-view.tsx` — premium Apple-inspired side-by-side compare with session picker fallback, AnimatedCounter, spring delta arrows, growth-story callout.
4. Nav: add "Compare" nav item (GitCompare icon) to `shell.tsx` after "Roadmap"; enabled when ≥2 sessions exist in DB.
5. Page: add `view === 'compare'` branch to `page.tsx`.
6. Polish: staggered entrance, mobile vertical stack, success/critical/muted delta coloring, "better side" radial gradient tint.

## Reference files (read before starting)
- `/home/z/my-project/worklog.md` — prior work log
- `/home/z/my-project/src/lib/store.ts` — Zustand store + parseHash/syncHash
- `/home/z/my-project/src/lib/types.ts` — SessionPayload + domain types
- `/home/z/my-project/src/lib/session.ts` — loadSession helper
- `/home/z/my-project/src/app/api/session/route.ts` — existing session list/get endpoint
- `/home/z/my-project/src/components/hiremind/shell.tsx` — SiteHeader + ScoreRing + NAV array
- `/home/z/my-project/src/components/hiremind/match-view.tsx` — AnimatedCounter pattern + hm-card usage
- `/home/z/my-project/src/components/hiremind/session-history.tsx` — session list fetch pattern
- `/home/z/my-project/src/app/page.tsx` — view switch
- `/home/z/my-project/src/app/globals.css` — hm-card / hm-card-hover utility classes

## Notes
- The store list endpoint already exists at `/api/session?list=true` returning `{ sessions: [...] }` with shape `{ id, isDemo, status, createdAt, jobTitle, candidateName, matchIndex, readinessIndex }`. The compare-view picker can reuse this.
- Interview score (avg of evaluation.overall) — need to read `interviewJson` from the session row and average `evaluations[].overall`. overall is 0..1, so multiply by 100 for display.
- topGaps is top 3 gaps by priorityScore (descending). Fallback: take first 3 from gaps array.
- gapCount = gaps.length (filtered by status==="gap" if a SkillGap[] includes matched/weak rows — but `gaps` field in payload only includes actual gaps already, so length is fine).
- "Better side highlights with subtle bg tint" — for each metric, the side with the "better" value (higher for match/readiness/interviewScore, LOWER for gapCount) gets a radial-gradient bg.

## Work Log
- Read prior worklog and project structure.
- (in progress)
