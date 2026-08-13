# Task 10 — Interview Insights panel + premium polish

**Task ID**: 10
**Agent**: main (insights-polish)
**Task**: Add Interview Insights panel on Evaluation view (radar + sparkline + matrix + time analysis), confetti micro-animation on high scores, 'D' keyboard shortcut for demo answer, Insights tab on Readiness view (Strengths/Watch-outs/Coverage heatmap), AnimatedCounter everywhere.

## Files changed

### New
- `src/components/hiremind/interview-insights.tsx` — new component with 4 sections (Competency Radar, Trajectory Sparkline, Strength-Weakness Matrix, Time Analysis).

### Modified
- `src/components/hiremind/shell.tsx` — added shared `AnimatedCounter` export.
- `src/components/hiremind/evaluation-view.tsx` — restructured dimensions card (added ScoreRing + confetti), inserted `<InterviewInsights />`, applied AnimatedCounter to dimension bars.
- `src/components/hiremind/interview-view.tsx` — added `[D]` kbd badge on "Scripted answer" button.
- `src/hooks/use-keyboard-shortcuts.ts` — context-sensitive 'd' shortcut: loads demo on home view, triggers scripted demo answer on interview view.
- `src/components/hiremind/shortcut-hint.tsx` — updated 'd' description in shortcut overlay.
- `src/components/hiremind/readiness-view.tsx` — added `<InsightsTabs />` with Strengths/Watch-outs/Coverage tabs, applied AnimatedCounter to readiness dimensions.
- `src/components/hiremind/match-view.tsx` — removed local `AnimatedCounter` (uses shared one now).

## Key implementation notes

- **AnimatedCounter**: cubic ease-out + subtle sine overshoot near end. `delay` (seconds) + `duration` (ms) + `className` props. Springy feel without spring physics overhead.
- **Radar chart**: pure SVG. Pentagon with 5 axes (Technical, Relevance, Depth, Communication, Problem Solving — 5th synthetic blend). Required threshold polygon (dashed) at 70. Candidate polygon (filled accent-blue 18%) spring-pops in via Framer Motion scale animation. Concentric grid pentagons at 25/50/75/100.
- **Sparkline**: catmull-rom spline with gradient area fill. Single-data-point edge case handled with placeholder card ("Baseline established · trajectory appears after Q2") — addresses VLM feedback from first iteration.
- **Confetti**: 10 particles, pre-computed random angle/distance, mix of accent-blue + success, Framer Motion `[0, 0.25, 1]` keyframes for opacity. Brief (1s) and subtle.
- **'D' shortcut**: context-sensitive — uses same key for two different actions depending on current view. Skipped when typing in textarea/input (existing input-ignore logic preserved).
- **Coverage heatmap**: responsive 2/3/4-col grid of competency cells. Background tint + dot color reflect level (strong/moderate/weak/unknown). Required competencies get darker border + "Req" badge. Merges resume level from match.rows with latest interview level (interview wins).
- **All derived purely from existing store state** — no API calls, no schema changes, no new packages.

## Verification
- Lint: 0 errors / 0 warnings
- Dev server: stable, no compile errors
- Browser console: clean
- agent-browser walkthrough: demo → interview → press D → evaluation view with all 4 insights sections rendered → readiness view with 3-tab Insights section → coverage heatmap renders
- VLM rating: 8/10 for visual richness and information density on the evaluation view screenshot
- Screenshots: `feat-r5-insights-evaluation.png`, `feat-r5-insights-readiness.png`, `feat-r5-insights-readiness-coverage.png`
