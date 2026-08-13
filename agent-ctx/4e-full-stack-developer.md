# Task 4e — Job Market Insights Panel on Match View

## Work Log

1. **Read project context**:
   - `worklog.md` (HIREMIND AI overview, Round 3 status, premium styling tokens)
   - `src/components/hiremind/match-view.tsx` (existing structure, JobInsights placement, CTA at the end)
   - `src/components/hiremind/job-insights.tsx` (sibling component — matched styling pattern: `hm-card p-5 sm:p-7 mt-4`, accent-blue icon chip, `text-[11px]` muted descriptions, framer-motion staggered entrance, `importanceTone` mapping)
   - `src/lib/types.ts` (verified `JobProfile`, `JobRequirement`, `MatchResult`, `CompetencyMatchRow` shapes — `importance: "critical" | "high" | "medium" | "low"`, `match.rows[].status === "matched"`)
   - `src/lib/store.ts` (verified `job`, `match` exposed by `useHireMind`)
   - `src/app/globals.css` (verified `bg-critical` / `bg-warning` / `bg-accent-blue` are valid Tailwind classes via `@theme inline` mappings; `hm-card`, `hm-elevated` utility classes exist)
   - `src/components/hiremind/shell.tsx` and `resume-strength.tsx` (consistent card header pattern with `bg-accent-blue/10 text-accent-blue` icon chip)
   - Previous agent-ctx records (4a, 4f) to align on conventions (no new packages, deterministic-only, framer-motion `[0.22, 1, 0.36, 1]` easing)

2. **Created `src/components/hiremind/job-market-insights.tsx`**:
   - Single default export `JobMarketInsights`, `'use client'`, pulls `job` + `match` from `useHireMind`.
   - Returns `null` when no `job` is loaded (graceful no-op on the home view).
   - Computes 6 deterministic insights inline — no AI calls, no network requests:
     - **Demand level**: `<5 → "Niche role"`, `5–8 → "Moderate demand"`, `9–12 → "High demand"`, `>12 → "Very high demand"`. Description shows the exact requirement count.
     - **Seniority signal**: keyword regex scan over `title + summary + responsibilities`. Order of precedence: senior/lead/staff/principal → "Senior level"; junior/entry/graduate/intern → "Entry level"; mid/intermediate → "Mid level"; else → "Mid-Senior". Description lists the matched keyword family.
     - **Skill scarcity**: counts the role's `importance === "critical"` requirements, then checks how many of those have `status === "matched"` in `match.rows`. Thresholds: `>70% → "Your skills are in high demand"`, `40–70% → "Partial coverage of in-demand skills"`, `<40% → "Significant skill development needed"`. When the role has no critical requirements, falls back to "No critical skills defined" (no division-by-zero, no misleading signal).
     - **Work flexibility**: keyword regex (`remote|hybrid|flexible|work from home|wfh|distributed`). Preferential resolution: remote > hybrid > flexible > on-site. Description lists up to 2 matched keywords.
     - **Tech stack diversity**: `Set(requirements.map(r => r.category)).size`. Description lists up to 3 categories with `+N more` overflow.
     - **Top in-demand skills**: top 5 requirements, sorted by `importance` rank (critical → low), then `required` flag, then alphabetical skill name for stable ordering.
   - Visual structure:
     - Outer `hm-card p-5 sm:p-7 mt-4` with framer-motion fade+lift (`delay: 0.25` so it appears after `JobInsights`).
     - Header: `Zap` icon chip in `bg-accent-blue/10 text-accent-blue`, title "Job market insights", subtitle "Derived from this job description · deterministic analysis".
     - Body grid: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` (2x3 on desktop, 2xN on mobile).
     - First 5 cells = `InsightTile` subcomponent (`hm-elevated rounded-lg p-3`, icon chip `h-8 w-8 rounded-lg bg-secondary`, `text-[10px] uppercase tracking-wider text-muted-foreground` label, `text-sm font-semibold` value, `text-[11px] text-muted-foreground` description).
     - 6th cell spans `sm:col-span-2 lg:col-span-3` (full width) → renders the "Top in-demand skills" pills row.
     - Pills: `rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium`, with a tiny solid-color importance dot (`h-1.5 w-1.5 rounded-full`) using `bg-critical` / `bg-warning` / `bg-accent-blue` / `bg-muted-foreground/60`, followed by the skill name and a `text-[9px] uppercase` importance suffix.
   - Staggered entrance: tiles enter with `delay: 0.3 + i * 0.06`; the wide skills tile enters at `0.3 + 5 * 0.06`; each pill within the skills tile enters at `0.5 + i * 0.05`. All use the project-standard `[0.22, 1, 0.36, 1]` ease.
   - TypeScript: `LucideIcon` typed via `import { ..., type LucideIcon } from "lucide-react"`. No `any`. `InsightTileProps` interface declared for the subcomponent.

3. **Wired into `src/components/hiremind/match-view.tsx`**:
   - Added `import { JobMarketInsights } from "./job-market-insights";` next to the existing `JobInsights` import.
   - Inserted `<JobMarketInsights />` immediately below `<JobInsights />` and immediately above the existing "See your gaps" CTA `<div className="mt-8 ...">`. Comment `// Job market insights — deterministic signals derived from the JD` added above for clarity.

4. **Verification**:
   - `bun run lint` → 0 errors, 0 warnings (eslint silent).
   - `dev.log` shows `✓ Compiled in 146ms` / `✓ Compiled in 301ms` with no errors after the edits.
   - No new npm packages introduced; reuses `framer-motion`, `lucide-react`, `@/lib/store`, `@/lib/utils` only.

## Stage Summary

- **New file**: `src/components/hiremind/job-market-insights.tsx` (≈230 lines, single client component + `InsightTile` helper subcomponent).
- **Modified**: `src/components/hiremind/match-view.tsx` (one import line + one JSX insertion with comment — placed exactly between `<JobInsights />` and the "See your gaps" CTA as specified).
- **Insights delivered** (all deterministic from `JobProfile`): demand level, seniority signal, skill scarcity (candidate critical-skill coverage), work flexibility, tech stack diversity, top 5 in-demand skills with importance badges.
- **Design fidelity**: matches existing HireMind tokens (`hm-card`, `hm-elevated`, `bg-secondary`, `bg-accent-blue/10 text-accent-blue`); icon chips `h-8 w-8 rounded-lg`; labels `text-[10px] uppercase tracking-wider text-muted-foreground`; values `text-sm font-semibold`; skill pills `rounded-full bg-secondary px-2.5 py-1 text-[11px]` with solid-color importance dots.
- **Layout**: 2x3 grid on desktop (`lg:grid-cols-3`), 2-col on small screens (`sm:grid-cols-2`), with the in-demand skills tile spanning full width below the 5 insight tiles.
- **Animations**: staggered entrance using framer-motion with project-standard `[0.22, 1, 0.36, 1]` ease, mirroring the timing/stagger pattern used by sibling components.
- **Lint**: clean.
- **No new packages**, **no AI calls**, **no new routes**.
