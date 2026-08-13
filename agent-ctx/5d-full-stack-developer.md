# Task 5d — Quick Re-Interview and Session Share Link Features

## Work Summary

### Feature 1: Quick Re-Interview Button

1. **evaluation-view.tsx**: Added "Retake interview" outline button (RotateCcw icon) next to "See your readiness" when interview is complete. Also added to the empty/recovery state. Uses `startInterview()` from store with loading spinner.

2. **readiness-view.tsx**: Added "Retake interview" outline button in "Your next best action" section alongside "Open my roadmap". Destructures `startInterview` and `loading` from store.

3. **interview-view.tsx**: Enhanced the complete state with:
   - "Retake the interview" outline button
   - Expandable "Retake with different difficulty" section using AnimatePresence + motion.div
   - Shows all 4 difficulty options (Warm-up, Balanced, Deep dive, Adaptive) as clickable cards
   - Each card calls `startInterview({ difficulty })` directly

### Feature 2: Session Share Link

Added ghost-variant share buttons with Link2 icon to:
- **readiness-view.tsx**: Next to "Where do you stand?" heading
- **candidate-view.tsx**: Next to "Here's what we found." heading
- **match-view.tsx**: Next to "How well do you align?" heading

Each share button:
- Uses `navigator.clipboard.writeText(window.location.href)` to copy URL
- Shows sonner toast: "Session link copied to clipboard"
- Has tooltip: "Copy link to share this session"
- Styled as ghost variant, h-7, with "Share" text label

### No new npm packages added. ESLint passes. Dev server compiles.
