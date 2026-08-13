# Task 7-b — Resume Improvement Suggestions

**Agent**: full-stack-developer (Resume Suggestions)
**Task**: Build a Resume Improvement Suggestions panel with deterministic gap-based suggestions, integrate into gaps-view as a collapsible.

## What was built

### New file: `src/components/hiremind/resume-suggestions.tsx`
- `"use client"` component exporting `ResumeSuggestions({ gaps }: { gaps: SkillGap[] })`.
- Self-contained panel (not a modal) rendered inside the Gaps view.
- **Deterministic suggestion logic** (pure function of `SkillGap.candidateLevel`):
  - `unknown`  → "Add a project or work experience demonstrating {competency}. Even a personal project counts."
  - `weak`     → "Strengthen your {competency} evidence — quantify impact (e.g. 'reduced latency by 40%') and mention specific tools/methods."
  - `moderate` → "Add depth to your {competency} mention — include scale, tradeoffs, and outcomes."
  - `strong`   → skipped (returns `null`).
- Limits to top 6 gaps via `gaps.slice(0, 6)`.
- Each suggestion card shows:
  - Competency name + category badge (inlined `CATEGORY_BADGE` mirrors gaps-view exactly).
  - Priority pill (imported from `./shell`).
  - Candidate-level badge (color-coded: unknown=critical, weak=warning, moderate=accent-blue, strong=success).
  - Actionable suggestion text.
  - Copy button: `navigator.clipboard.writeText` → check icon for 2s → `toast.success("Suggestion copied")`. On failure: `toast.error("Couldn't copy — please copy manually.")`.
- Header: title "Resume improvement suggestions", subtitle "Concrete additions to strengthen your resume, derived from your detected gaps.", `FileText` icon tile, an "{n} actionable" pill with `Sparkles` icon.
- Collapsible (shadcn `Collapsible`): starts collapsed (`open=false`), expands to reveal cards. Trigger has `aria-expanded` + `aria-controls`. Chevron rotates 180° on open.
- Framer Motion: staggered fade-in (`staggerChildren: 0.06`) for the card grid; height-auto animation for the collapsible content via `AnimatePresence`.
- Premium styling: `hm-glass-panel` on container (verified to exist in globals.css line 1949), `hm-card-lift hm-elevated` on each card.
- Empty state: returns `null` if `suggestions.length === 0` (all gaps strong) — no dead UI.

### Modified: `src/components/hiremind/gaps-view.tsx`
- Added `import { ResumeSuggestions } from "./resume-suggestions";` after the `GapDeepDive` import.
- Placed `<ResumeSuggestions gaps={gaps} />` inside a `motion.div` (fade-in, delay 0.15, ease `[0.22, 1, 0.36, 1]`, `mt-6`) AFTER the "Other open gaps" section and BEFORE the `<GapDeepDive />` modal.
- The `gaps` variable is already destructured from the store at the top of `GapsView`.

## Constraints honored
- Did NOT run `bun run build` or `bun run dev` (dev server already running).
- Did NOT modify: `globals.css`, `page.tsx`, `interview-view.tsx`, `export-results.tsx`, `shell.tsx`, `home-view.tsx`, `match-view.tsx`.
- `"use client"` at the top of the new component.
- TypeScript strict — no `any`, no unused vars. All types from `@/lib/types`.
- Accessibility: collapsible trigger has `aria-expanded` + `aria-controls`; each copy button has a descriptive `aria-label`; focus-visible rings on all interactive elements.

## Verification
- `cd /home/z/my-project && bun run lint` → **0 errors, 0 warnings** ✅
- Dev server log: `✓ Compiled in Nms` repeatedly with no errors after the edit — hot reload picked up both the new file and the gaps-view import change cleanly. ✅

## Key decisions
1. **Inlined `CATEGORY_BADGE`** locally rather than importing from gaps-view — matches the existing `gap-deep-dive.tsx` precedent ("kept locally so the modal is portable / not coupled to gaps-view internal exports") and keeps the component self-contained.
2. **Added a separate `LEVEL_BADGE`** for candidate-level labels (color-coded to match the gap-confidence zones used elsewhere) so the level is visible at a glance without needing to read the suggestion text.
3. **Hidden the entire panel** when `suggestions.length === 0` (all gaps already strong) instead of showing an empty "0 actionable" collapsible — cleaner UX.
4. **`React.useCallback`** for the copy handler + **`React.useMemo`** for `deriveSuggestions` to keep the card list referentially stable across parent re-renders.
5. **Copy button uses ghost styling** (no border, muted text → foreground on hover) so it doesn't compete visually with the suggestion text.
