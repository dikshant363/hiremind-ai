# Task 7-c — Export Dropdown (full-stack-developer)

**Task:** Enhance `export-results.tsx` with a dropdown menu offering Copy Markdown, Download .md, and Download .json alongside the existing PDF button.

## Files Modified
- `src/components/hiremind/export-results.tsx` (only file touched)

## What Changed
1. **Imports** — added DropdownMenu primitives (`DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuTrigger`) and merged new lucide icons (`ChevronDown`, `FileJson`, `FileText`) with existing `Copy`, `Check`, `FileDown`.
2. **Module-scope `downloadBlob(content, filename, type)`** helper — Blob + object URL + temp `<a>` click + revoke.
3. **`buildMarkdown`** — extracted from the old `handleExport` as a `useCallback` returning the assembled string; deps `[candidate, job, match, gaps, interview, readiness, roadmap]`.
4. **`handleCopyMarkdown`** — renamed clipboard handler, reuses `buildMarkdown()`; toggles `copied` for 2s.
5. **`handleDownloadMarkdown`** — `downloadBlob(..., "hiremind-assessment.md", "text/markdown;charset=utf-8")`, toasts success, sets `downloaded("md")` for 2s.
6. **`handleDownloadJson`** — builds `{ generatedAt, app, version, candidate, job, match, gaps, interview, readiness, roadmap }` payload (null-coalesced), `JSON.stringify(..., null, 2)`, downloads as `hiremind-assessment.json`, toasts, sets `downloaded("json")` for 2s.
7. **`downloaded` state** (`string | null`) added for per-item "Downloaded" feedback.
8. **UI** — replaced the old "Export results" button with a `<DropdownMenu>` (trigger: FileDown + "Export" + ChevronDown). Menu: "Export format" label, separator, then 3 items (Copy Markdown / Download .md / Download .json) each swapping its icon to a green Check + "Copied!"/"Downloaded" label on success.
9. **PDF button + print flow UNCHANGED** — `handleDownloadPdf`, `printing`/`printingRef`, double-rAF + afterprint + 30s fallback all preserved verbatim.

## Lint
- `cd /home/z/my-project && bun run lint` → **0 errors, 0 warnings**.
- dev.log shows clean recompiles with no runtime errors after the edit.

## Key Decisions
- Shared `buildMarkdown` useCallback so clipboard + .md outputs are byte-identical and can't drift.
- Single `downloaded: string | null` state drives feedback for both file formats (vs two booleans).
- Module-scope `downloadBlob` keeps the component lean and reusable.
- JSON payload includes a `generatedAt` / `app` / `version` envelope so downloaded files are self-describing.
- Kept `onClick` on `DropdownMenuItem` per spec (Radix still auto-closes on select).

## Verification
- ESLint clean.
- TypeScript strict satisfied (no `any`, no unused vars).
- No other files modified.
