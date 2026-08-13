# Task 4a — Command Palette (Cmd+K / Ctrl+K)

## Work Log

1. **Read project context**: `worklog.md`, `page.tsx`, `shell.tsx`, `use-keyboard-shortcuts.ts`, `store.ts`, `shortcut-hint.tsx`, `home-view.tsx`, `button.tsx`, and `globals.css` to understand existing patterns (event-based cross-component communication via `hm-*` custom events, `useHireMind` zustand store, framer-motion AnimatePresence usage, premium styling tokens).

2. **Created `src/hooks/use-command-palette.ts`**:
   - Returns `{ open, setOpen }`.
   - Global `keydown` listener on `window` with **capture phase** (`true`) so it intercepts before the bubble-phase `use-keyboard-shortcuts` listener.
   - Toggles on Cmd+K (Mac) / Ctrl+K (Win/Linux) — works even when an input is focused (deliberately not gated by the input-focus check that the general shortcuts hook uses).
   - Closes on Escape when open, with `stopPropagation` so the general shortcuts hook doesn't *also* navigate back to home.
   - Listens for the `hm-open-command-palette` custom DOM event so the header button can open the palette without prop drilling.

3. **Created `src/components/hiremind/command-palette.tsx`**:
   - Premium Apple-inspired modal: `max-w-xl`, `rounded-xl`, `bg-card/95 backdrop-blur-xl`, `border`, `shadow-2xl`.
   - Backdrop: `bg-background/60 backdrop-blur-sm`, click-to-close.
   - Search input `h-12` with magnifying-glass icon, autofocus on open, `Esc` kbd hint.
   - Filtered + sectioned list (Navigation / Actions / Theme) with `text-[10px] uppercase tracking-wider` section headers.
   - Each command row: icon chip, title, description, optional `kbd` shortcut, `CornerDownLeft` indicator on the selected row when it has no shortcut.
   - Selected row: `bg-secondary` + left accent border (`bg-accent-blue`).
   - Keyboard nav: ArrowUp/Down cycles, Enter executes, **Tab is trapped** (prevented) so focus never leaves the modal.
   - `onMouseMove` selects hovered row; active row auto-scrolled into view via `scrollIntoView({ block: "nearest" })`.
   - Empty state: "No commands found".
   - Footer hint bar with ↑/↓/↵/esc legends.
   - Framer Motion entrance: `scale: 0.97 → 1` + `opacity` + `y: 8 → 0` with `[0.22, 1, 0.36, 1]` easing; exit reverses.
   - `role="dialog"`, `aria-modal`, `aria-label`, `role="listbox"` + `role="option"` + `aria-selected` for a11y.

4. **Commands wired**:
   - Navigation (8): Overview, Candidate, Job Match, Skill Gaps, Interview, Readiness, Roadmap, Compare — each with its `1`–`8` shortcut. Session-required views disabled when no active session.
   - Actions (5): Load Demo Candidate (`D`), Start Over (`disabled` w/o session), Toggle Theme (`T`), Toggle Presentation Mode (`P`), Show Keyboard Shortcuts (`?`).
   - Theme (3): Light Mode, Dark Mode, System Mode.
   - Theme toggle + shortcuts dispatch the existing `hm-toggle-theme` / `hm-show-shortcuts` custom events so all synced UI updates flow through the established single-source listeners in `page.tsx`.

5. **Modified `src/components/hiremind/shell.tsx`**:
   - Added `Search` to the lucide-react import.
   - Added platform detection (`isMac`, gated on `mounted` to avoid hydration mismatch).
   - Inserted an outline-variant "Search commands…" button between the Presentation button and the Help button: Search icon always visible, label on `lg+`, `⌘K` / `Ctrl K` kbd hint on `sm+`. Clicking dispatches `hm-open-command-palette`.

6. **Modified `src/app/page.tsx`**:
   - Imported `CommandPalette` and rendered it alongside `LoadingOverlay` and `ShortcutHint`.

7. **Verified**: `bun run lint` passes with 0 errors; dev server returns HTTP 200 on `/`; no errors/warnings in `dev.log`.

## Stage Summary

- New files: `src/hooks/use-command-palette.ts`, `src/components/hiremind/command-palette.tsx`.
- Modified: `src/components/hiremind/shell.tsx` (header search button + platform hint), `src/app/page.tsx` (render `<CommandPalette />`).
- No new npm packages added.
- Works with or without an active session (session-dependent commands disabled, not hidden).
- No conflicts with the existing `use-keyboard-shortcuts` hook: capture-phase Escape + the input-focus gate in the shortcuts hook keep the two systems cleanly separated. Tab focus is trapped inside the modal.
- Lint clean, page compiles & serves 200.
