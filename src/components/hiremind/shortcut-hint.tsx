"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: "1–7", action: "Switch view (1=Home, 2=Candidate, …)" },
  { keys: "d", action: "Load demo candidate (from Home)" },
  { keys: "p", action: "Toggle presentation mode" },
  { keys: "t", action: "Toggle dark/light theme" },
  { keys: "Esc", action: "Go back to Home view" },
  { keys: "?", action: "Show this shortcut reference" },
];

export function ShortcutHint({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="hm-card p-6 max-w-sm w-full pointer-events-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-[14px] font-semibold">Keyboard Shortcuts</h3>
              </div>
              <div className="space-y-2">
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{s.action}</span>
                    <kbd className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground tabular-nums">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Press <kbd className="inline-flex rounded border border-border bg-muted px-1 py-0 text-[10px] font-mono">?</kbd> or <kbd className="inline-flex rounded border border-border bg-muted px-1 py-0 text-[10px] font-mono">Esc</kbd> to close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
