"use client";

import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

export interface VoiceInputProps {
  /**
   * Fired with the final accumulated transcript when recognition stops.
   * The parent decides how to merge it into its own state (typically:
   * append to the answer textarea, with a separating space).
   */
  onTranscript: (text: string) => void;
  /** Disable interaction (e.g., while the AI is evaluating an answer). */
  disabled?: boolean;
  /** Optional tooltip text shown when the browser does not support speech. */
  unsupportedLabel?: string;
}

/**
 * Premium voice input button for interview answers.
 *
 * - Renders nothing on SSR / unsupported browsers (progressive enhancement).
 * - While listening: critical-toned button with a pulsing ring + live interim
 *   transcript preview.
 * - On stop: emits the final transcript via `onTranscript`.
 */
export function VoiceInput({
  onTranscript,
  disabled = false,
  unsupportedLabel = "Voice input not supported in this browser",
}: VoiceInputProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    start,
    stop,
    reset,
    error,
  } = useSpeechRecognition({
    lang: "en-US",
    continuous: true,
    interimResults: true,
  });

  // Avoid hydration mismatch: SSR renders null, client mounts, then we
  // decide whether to render based on actual browser support.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Commit the final transcript to the parent whenever the recognizer
  // transitions from listening → idle.
  const wasListeningRef = React.useRef(false);
  React.useEffect(() => {
    if (wasListeningRef.current && !isListening) {
      const finalText = transcript.trim();
      if (finalText) onTranscript(finalText);
      reset();
    }
    wasListeningRef.current = isListening;
  }, [isListening, transcript, onTranscript, reset]);

  // Not yet mounted (SSR / first paint) — render a stable placeholder
  // matching the button footprint so layout doesn't shift on hydration.
  if (!mounted) {
    return (
      <div className="flex items-center gap-2.5" aria-hidden>
        <span className="inline-flex h-10 w-10 rounded-full bg-secondary opacity-0" />
      </div>
    );
  }

  // Browser lacks the Web Speech API. Show a muted, non-interactive affordance
  // with a tooltip explaining why.
  if (!isSupported) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full",
              "bg-secondary text-muted-foreground/40"
            )}
            aria-label={unsupportedLabel}
          >
            <MicOff className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{unsupportedLabel}</TooltipContent>
      </Tooltip>
    );
  }

  const handleClick = () => {
    if (disabled) return;
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-label={isListening ? "Stop recording" : "Voice input"}
            aria-pressed={isListening}
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:opacity-50 disabled:pointer-events-none",
              isListening
                ? "bg-critical/15 text-critical-foreground ring-2 ring-critical/30"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {isListening && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-critical/20 animate-ping"
                style={{ animationDuration: "1.4s" }}
              />
            )}
            {isListening ? (
              <MicOff className="relative h-4 w-4" />
            ) : (
              <Mic className="relative h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isListening ? "Stop recording" : "Voice input"}
        </TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 flex-col gap-0.5">
        {isListening ? (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-critical-foreground">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-critical opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-critical" />
            </span>
            Listening…
          </span>
        ) : error ? (
          <span className="max-w-[220px] text-[10px] leading-snug text-critical-foreground/80 sm:max-w-[280px]">
            {error}
          </span>
        ) : null}
        {isListening && interimTranscript && (
          <span className="max-w-[220px] truncate text-[11px] italic text-muted-foreground sm:max-w-[280px]">
            {interimTranscript}
          </span>
        )}
      </div>
    </div>
  );
}
