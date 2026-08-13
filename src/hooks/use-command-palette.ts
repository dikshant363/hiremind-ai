"use client";

/**
 * useCommandPalette — manages the open/closed state of the Cmd+K command
 * palette and wires up the global keyboard listeners.
 *
 * Listens for:
 *  - Cmd+K (Mac) / Ctrl+K (Windows/Linux): toggles the palette. Works even
 *    when an input/textarea is focused (unlike the general keyboard-shortcuts
 *    hook, which deliberately ignores keys while typing).
 *  - Escape: closes the palette. Uses the *capture* phase + stopPropagation so
 *    it takes priority over the general keyboard-shortcuts hook's Escape
 *    handler (which would otherwise also flip the view back to "home").
 *
 * Also listens for the `hm-open-command-palette` custom DOM event so the
 * header "Search commands…" button (or any other UI) can open the palette
 * without needing direct prop access to the state.
 */
import { useCallback, useEffect, useState } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Global Cmd+K / Ctrl+K + Escape listener (capture phase).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K toggles the palette from anywhere.
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
        return;
      }
      // Escape closes — but only when the palette is open. We stopPropagation
      // so the general keyboard-shortcuts hook doesn't *also* run its Escape
      // handler (which navigates back to the home view).
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    // capture: true so we intercept before the bubble-phase keyboard-shortcuts
    // listener on the same window target.
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [toggle, open]);

  // Allow other components (e.g. the header search button) to open the palette
  // via a custom event, keeping this hook as the single source of truth.
  useEffect(() => {
    const openHandler = () => setOpen(true);
    document.addEventListener("hm-open-command-palette", openHandler);
    return () => document.removeEventListener("hm-open-command-palette", openHandler);
  }, []);

  return { open, setOpen };
}
