# Task 5b — Onboarding Tooltip System

## Agent: full-stack-developer

## Work Summary

Created a lightweight onboarding tooltip system that guides first-time users through the HireMind interface with contextual tooltips.

## Files Created/Modified

1. **`/src/hooks/use-onboarding.tsx`** (NEW)
   - `OnboardingStep` interface with id, target (CSS selector), title, description, position
   - 4 step definitions targeting `data-hm` attributes: resume-input, job-input, analyze-btn, demo-btn
   - localStorage key `hiremind-onboarding-complete` to track completion
   - Hook returns `{ step, currentStep, totalSteps, next, skip, restart, isComplete, mounted }`
   - Auto-starts onboarding on first visit (step 0)

2. **`/src/components/hiremind/onboarding-tooltip.tsx`** (NEW)
   - Floating tooltip positioned via `getBoundingClientRect()`
   - Spotlight overlay using box-shadow inset "hole" technique — pointer-events-none to not block scrolling
   - Arrow/pointer pointing to target element (hidden on mobile)
   - Framer Motion fade+scale entrance animation
   - Step indicator (numbered circle, accent-blue bg), title, description
   - Progress dots showing current/completed/upcoming steps
   - "Next" button (accent-blue) and "Skip tour" link (muted)
   - Premium styling: rounded-xl, bg-card/95 backdrop-blur-lg, border-accent-blue/30, shadow-xl
   - z-50 for tooltip, z-40 for spotlight
   - Mobile: positions tooltip at bottom of screen, hides arrow
   - Scrolls target into view when step changes
   - Re-measures on resize/scroll/interval for layout stability

3. **`/src/components/hiremind/home-view.tsx`** (MODIFIED)
   - Added `data-hm="resume-input"` to resume textarea wrapper div
   - Added `data-hm="job-input"` to job input wrapper div
   - Added `data-hm="analyze-btn"` to analyze button
   - Added `data-hm="demo-btn"` to demo button

4. **`/src/app/page.tsx`** (MODIFIED)
   - Imported `OnboardingTooltip`
   - Renders `{view === "home" && <OnboardingTooltip />}` at bottom of component tree

## Quality Checks
- ESLint: passes (no errors)
- TypeScript: no new errors in modified files
- Dev server: compiles successfully
