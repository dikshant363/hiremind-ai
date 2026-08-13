# Task 4f — Voice Input for Interview Answers (Web Speech API)

## Work Summary

### Feature 1: `useSpeechRecognition` hook

Created `/home/z/my-project/src/hooks/use-speech-recognition.ts`:
- SSR-safe wrapper around `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- Includes minimal TS type declarations for the Web Speech API (not in the standard DOM lib) — no `any` types
- Returns: `{ isListening, transcript, interimTranscript, isSupported, start, stop, reset, error }`
- Configures: `lang="en-US"`, `continuous=true`, `interimResults=true`, `maxAlternatives=1`
- Accumulates final results into `transcript` (auto-trims and inserts a separating space between chunks)
- Surfaces live non-final text in `interimTranscript` for real-time UI preview
- Auto-restarts on transient `no-speech` / `aborted` events while user has not explicitly stopped (Chrome fires these frequently in continuous mode)
- Friendly error messages for `not-allowed`, `audio-capture`, `network`, etc. — silently swallows `no-speech` / `aborted`
- Full cleanup on unmount: nulls all handlers, aborts recognition, releases the audio session
- All public functions wrapped in `useCallback` for stable consumer refs

### Feature 2: `VoiceInput` component

Created `/home/z/my-project/src/components/hiremind/voice-input.tsx`:
- Renders a circular mic button (`h-10 w-10 rounded-full`)
- Uses `Tooltip` (shadcn/ui) with dynamic label: "Voice input" / "Stop recording"
- Idle state: `bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground`
- Listening state: `bg-critical/15 text-critical-foreground ring-2 ring-critical/30` plus a pulsing ring (`bg-critical/20 animate-ping`, 1.4s duration)
- Uses both `Mic` (idle) and `MicOff` (listening) Lucide icons as requested
- Below the button: `Listening…` label in `text-[10px] uppercase tracking-wider text-critical-foreground` with a small pulsing critical-toned dot
- Live interim transcript preview in `text-[11px] italic text-muted-foreground` (truncated, max-w responsive)
- Error message rendered in `text-[10px] text-critical-foreground/80` when not listening
- Hydration-safe: returns a stable placeholder before mount, then decides based on actual support
- Progressive enhancement: when the Web Speech API is unavailable, shows a muted, non-interactive `MicOff` affordance with the tooltip "Voice input not supported in this browser"
- Commits the final transcript to the parent via `onTranscript` callback on the listening→idle transition (and then `reset()`s the hook for the next session)

### Feature 3: Integration into `interview-view.tsx`

- Imported `VoiceInput` from `./voice-input`
- Placed a new `<div className="mt-3">` between the word count row and the submit/skip actions row, in the answer column (lg:col-span-3)
- Wired `onTranscript` to `setAnswer` with append semantics: trims trailing whitespace, inserts a single space separator if there is existing text, then concatenates the spoken transcript — never replaces user-typed content
- `disabled={loading}` so the mic is unavailable while the AI is evaluating an answer
- Textarea remains fully editable while listening (no read-only / disabled lock) per spec
- No changes to the existing keyboard shortcut flow (`⌘+Enter` to submit) — voice input is purely additive

### Browser support / SSR

- `isSupported` is computed with `typeof window === "undefined"` guard, so SSR never throws
- VoiceInput uses a `mounted` flag to avoid hydration mismatch (SSR renders an invisible placeholder with the same footprint → no layout shift)
- Unsupported browsers get a muted `MicOff` chip with explanatory tooltip instead of being hidden entirely — discoverable but non-distracting

### Quality

- ESLint: 0 errors, 0 warnings (`bun run lint` clean)
- No new npm packages — pure native Web Speech API
- TypeScript strict-friendly: no `any`, no untyped event handlers
- Dev server: renders `/` 200 OK after edits; no compile errors introduced (only unrelated pre-existing SQLite read-only warnings from a separate API route)

## Files

- NEW: `src/hooks/use-speech-recognition.ts`
- NEW: `src/components/hiremind/voice-input.tsx`
- MODIFIED: `src/components/hiremind/interview-view.tsx` (import + voice input row below word count)
