"use client";

import * as React from "react";

/**
 * Minimal Web Speech API type definitions.
 *
 * The Web Speech API (`SpeechRecognition`) is not yet part of the standard
 * TypeScript DOM lib, so we declare just enough surface area here to use it
 * in a fully-typed way. These mirror the runtime shapes exposed by Chromium
 * browsers as `window.SpeechRecognition` / `window.webkitSpeechRecognition`.
 */

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag for recognition. Defaults to "en-US". */
  lang?: string;
  /** Keep recognition running continuously until explicitly stopped. */
  continuous?: boolean;
  /** Emit interim (non-final) results as the user speaks. */
  interimResults?: boolean;
}

export interface UseSpeechRecognitionResult {
  /** True while the recognizer is actively capturing audio. */
  isListening: boolean;
  /** Accumulated final transcript for the current recognition session. */
  transcript: string;
  /** Live interim (not-yet-final) text — useful for real-time UI hints. */
  interimTranscript: string;
  /** Whether the browser exposes the Web Speech API at all. */
  isSupported: boolean;
  /** Begin listening. No-op if unsupported or already listening. */
  start: () => void;
  /** Stop listening and finalize the current transcript. */
  stop: () => void;
  /** Reset the accumulated transcript / interim / error state. */
  reset: () => void;
  /** Human-readable error message, if the last session failed. */
  error: string | null;
}

/**
 * Wraps the browser Web Speech API in a SSR-safe React hook.
 *
 * - Configures `continuous=true`, `interimResults=true`, `lang='en-US'`
 * - Gracefully recovers from transient `no-speech` / `aborted` events by
 *   auto-restarting while the user has not explicitly stopped.
 * - Surfaces friendly error messages for `not-allowed`, `network`, etc.
 * - Cleans up the recognizer on unmount to avoid leaked audio sessions.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const { lang = "en-US", continuous = true, interimResults = true } = options;

  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = React.useRef(false);
  const shouldRestartRef = React.useRef(false);

  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [interimTranscript, setInterimTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const isSupported = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const w = window as SpeechRecognitionWindow;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  React.useEffect(() => {
    if (!isSupported) return;
    const w = window as SpeechRecognitionWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interim += text;
        }
      }

      if (finalChunk) {
        setTranscript((prev) => {
          const trimmed = prev.trimEnd();
          const sep = trimmed ? " " : "";
          return (trimmed + sep + finalChunk).trimStart();
        });
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const code = event.error;
      let message: string | null = null;

      if (code === "not-allowed" || code === "service-not-allowed") {
        message =
          "Microphone permission denied. Allow access in your browser and try again.";
      } else if (code === "audio-capture") {
        message = "No microphone detected. Connect a mic and try again.";
      } else if (code === "network") {
        message =
          "Network error during speech recognition. Check your connection.";
      } else if (code === "no-speech" || code === "aborted") {
        // Transient — do not surface to the user.
        message = null;
      } else {
        message = `Speech recognition error: ${code}`;
      }

      if (message) {
        setError(message);
        // Stop the auto-restart loop once a real error surfaces.
        shouldRestartRef.current = false;
      }
    };

    recognition.onend = () => {
      // Auto-restart while the user has not explicitly stopped — this
      // recovers from the frequent `no-speech` timeouts that Chrome fires
      // even in continuous mode.
      if (shouldRestartRef.current && isListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Fall through to fully stopped state.
        }
      }
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      isListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try {
        recognition.abort();
      } catch {
        /* noop — already stopped */
      }
      recognitionRef.current = null;
    };
  }, [isSupported, lang, continuous, interimResults]);

  const start = React.useCallback(() => {
    if (!isSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition || isListeningRef.current) return;
    setError(null);
    setInterimTranscript("");
    shouldRestartRef.current = true;
    try {
      recognition.start();
    } catch {
      // start() throws if already started — safe to ignore.
    }
  }, [isSupported]);

  const stop = React.useCallback(() => {
    const recognition = recognitionRef.current;
    shouldRestartRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      /* noop */
    }
  }, []);

  const reset = React.useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    start,
    stop,
    reset,
    error,
  };
}
