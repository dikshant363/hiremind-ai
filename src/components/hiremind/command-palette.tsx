"use client";

/**
 * CommandPalette — premium Cmd+K / Ctrl+K quick-navigation overlay.
 *
 * Opens via the `useCommandPalette` hook (which owns the global key listener).
 * Renders a centered, glass-morphism modal with:
 *  - autofocus search input
 *  - filtered, sectioned command list (Navigation / Actions / Theme)
 *  - full keyboard navigation (Arrow Up/Down, Enter, Tab trap)
 *  - Framer Motion scale + fade entrance
 *  - backdrop click + Escape to close
 *
 * Session-dependent commands are disabled (not hidden) when no session is
 * active, so the palette always works as a wayfinder.
 */
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  Home,
  User,
  Briefcase,
  Target,
  MessageSquare,
  Gauge,
  Map as MapIcon,
  GitCompare,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Laptop,
  Keyboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { useHireMind, type View } from "@/lib/store";
import { useTheme } from "next-themes";
import { DEMO_RESUME, DEMO_JOB, DEMO_JOB_TITLE } from "@/lib/demo";
import { cn } from "@/lib/utils";

type Section = "Navigation" | "Actions" | "Theme";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  section: Section;
  shortcut?: string[];
  action: () => void;
  disabled?: boolean;
}

const SECTION_ORDER: Section[] = ["Navigation", "Actions", "Theme"];

const NAV_DEFS: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  view: View;
  shortcut: string;
}[] = [
  { id: "nav-home", title: "Go to Overview", description: "Return to the home screen", icon: Home, view: "home", shortcut: "1" },
  { id: "nav-candidate", title: "Go to Candidate", description: "View the extracted candidate profile", icon: User, view: "candidate", shortcut: "2" },
  { id: "nav-match", title: "Go to Job Match", description: "See how well you align with the role", icon: Briefcase, view: "match", shortcut: "3" },
  { id: "nav-gaps", title: "Go to Skill Gaps", description: "Review identified skill gaps", icon: Target, view: "gaps", shortcut: "4" },
  { id: "nav-interview", title: "Go to Interview", description: "Continue or review your interview", icon: MessageSquare, view: "interview", shortcut: "5" },
  { id: "nav-readiness", title: "Go to Readiness", description: "Check your overall readiness score", icon: Gauge, view: "readiness", shortcut: "6" },
  { id: "nav-roadmap", title: "Go to Roadmap", description: "View your personalized study roadmap", icon: MapIcon, view: "roadmap", shortcut: "7" },
  { id: "nav-compare", title: "Go to Compare", description: "Compare two past sessions side by side", icon: GitCompare, view: "compare", shortcut: "8" },
];

/** Views that require an active session. Compare is gated separately by the
 *  shell (needs ≥ 2 stored sessions) but we keep it enabled here — the
 *  compare view itself shows a friendly empty state if there aren't enough. */
const SESSION_REQUIRED_VIEWS: View[] = [
  "candidate",
  "match",
  "gaps",
  "interview",
  "readiness",
  "roadmap",
];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const {
    setView,
    sessionId,
    reset,
    togglePresentationMode,
    setResumeText,
    setJobTitle,
    setJobText,
    analyze,
  } = useHireMind();
  const { theme, setTheme } = useTheme();

  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Reset query + selection and focus the input each time the palette opens.
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // Build the full command list (memoized on the inputs that affect it).
  const commands: Command[] = React.useMemo(() => {
    const close = () => setOpen(false);

    const nav: Command[] = NAV_DEFS.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      icon: n.icon,
      section: "Navigation",
      shortcut: [n.shortcut],
      disabled: SESSION_REQUIRED_VIEWS.includes(n.view) && !sessionId,
      action: () => {
        setView(n.view);
        close();
      },
    }));

    const actions: Command[] = [
      {
        id: "act-demo",
        title: "Load Demo Candidate",
        description: "Run a sample analysis end-to-end",
        icon: Sparkles,
        section: "Actions",
        shortcut: ["D"],
        action: () => {
          setResumeText(DEMO_RESUME);
          setJobTitle(DEMO_JOB_TITLE);
          setJobText(DEMO_JOB);
          analyze({ demo: true });
          close();
        },
      },
      {
        id: "act-reset",
        title: "Start Over",
        description: "Clear the current session and return home",
        icon: RotateCcw,
        section: "Actions",
        disabled: !sessionId,
        action: () => {
          reset();
          close();
        },
      },
      {
        id: "act-theme-toggle",
        title: "Toggle Theme",
        description: "Switch between light and dark mode",
        icon: theme === "dark" ? Sun : Moon,
        section: "Actions",
        shortcut: ["T"],
        action: () => {
          // Delegates to the same listener the keyboard shortcut uses, so
          // theme + any synced UI update in one place.
          document.dispatchEvent(new CustomEvent("hm-toggle-theme"));
          close();
        },
      },
      {
        id: "act-presentation",
        title: "Toggle Presentation Mode",
        description: "Optimize the UI for live demos",
        icon: Monitor,
        section: "Actions",
        shortcut: ["P"],
        action: () => {
          togglePresentationMode();
          close();
        },
      },
      {
        id: "act-shortcuts",
        title: "Show Keyboard Shortcuts",
        description: "Open the shortcut reference overlay",
        icon: Keyboard,
        section: "Actions",
        shortcut: ["?"],
        action: () => {
          document.dispatchEvent(new CustomEvent("hm-show-shortcuts"));
          close();
        },
      },
    ];

    const themeCmds: Command[] = [
      {
        id: "theme-light",
        title: "Light Mode",
        description: "Switch to the light theme",
        icon: Sun,
        section: "Theme",
        action: () => {
          setTheme("light");
          close();
        },
      },
      {
        id: "theme-dark",
        title: "Dark Mode",
        description: "Switch to the dark theme",
        icon: Moon,
        section: "Theme",
        action: () => {
          setTheme("dark");
          close();
        },
      },
      {
        id: "theme-system",
        title: "System Mode",
        description: "Follow the OS color preference",
        icon: Laptop,
        section: "Theme",
        action: () => {
          setTheme("system");
          close();
        },
      },
    ];

    return [...nav, ...actions, ...themeCmds];
  }, [
    sessionId,
    setView,
    reset,
    togglePresentationMode,
    setResumeText,
    setJobTitle,
    setJobText,
    analyze,
    theme,
    setTheme,
    setOpen,
  ]);

  // Filter by query (title + description + section).
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.title} ${c.description ?? ""} ${c.section}`.toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  // Group filtered commands by section, preserving the canonical order.
  const grouped = React.useMemo(() => {
    const map = new Map<Section, Command[]>();
    for (const s of SECTION_ORDER) map.set(s, []);
    for (const c of filtered) map.get(c.section)?.push(c);
    return SECTION_ORDER.map((s) => ({ section: s, items: map.get(s) ?? [] })).filter(
      (g) => g.items.length > 0
    );
  }, [filtered]);

  // Clamp the active index whenever the filtered list shrinks.
  React.useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Scroll the active row into view when it changes.
  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Keyboard navigation inside the input.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd && !cmd.disabled) cmd.action();
    } else if (e.key === "Tab") {
      // Focus trap: keep focus inside the modal (on the search input).
      e.preventDefault();
    }
  };

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 backdrop-blur-sm p-4 pt-[12vh]"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="relative flex items-center border-b border-border/70">
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands…"
                className="h-12 w-full bg-transparent pl-11 pr-16 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="off"
                spellCheck={false}
                aria-label="Search commands"
                aria-autocomplete="list"
                aria-controls="command-list"
              />
              <kbd className="absolute right-3 hidden items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground sm:inline-flex">
                Esc
              </kbd>
            </div>

            {/* Command list */}
            <div
              ref={listRef}
              id="command-list"
              className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
              role="listbox"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-12 text-center text-[13px] text-muted-foreground">
                  No commands found
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.section} className="mb-1">
                    <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.section}
                    </div>
                    {group.items.map((cmd) => {
                      const idx = filtered.indexOf(cmd);
                      const selected = idx === activeIndex;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          data-cmd-idx={idx}
                          role="option"
                          aria-selected={selected}
                          disabled={cmd.disabled}
                          onMouseMove={() => setActiveIndex(idx)}
                          onClick={() => {
                            if (!cmd.disabled) cmd.action();
                          }}
                          className={cn(
                            "group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                            selected && !cmd.disabled && "bg-secondary",
                            cmd.disabled
                              ? "cursor-not-allowed opacity-40"
                              : "cursor-pointer hover:bg-secondary/70"
                          )}
                        >
                          {selected && !cmd.disabled && (
                            <span
                              className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-accent-blue"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                              selected
                                ? "bg-background text-foreground"
                                : "bg-secondary/60 text-muted-foreground"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-foreground">
                              {cmd.title}
                            </span>
                            {cmd.description && (
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {cmd.description}
                              </span>
                            )}
                          </span>
                          {cmd.shortcut && cmd.shortcut.length > 0 && (
                            <span className="flex shrink-0 items-center gap-1">
                              {cmd.shortcut.map((k) => (
                                <kbd
                                  key={k}
                                  className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground"
                                >
                                  {k}
                                </kbd>
                              ))}
                            </span>
                          )}
                          {selected && !cmd.disabled && !cmd.shortcut && (
                            <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint bar */}
            <div className="flex items-center justify-between border-t border-border/70 px-3 py-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0 font-mono">↑</kbd>
                  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0 font-mono">↓</kbd>
                  <span className="ml-0.5">Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0 font-mono">↵</kbd>
                  <span className="ml-0.5">Select</span>
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1 py-0 font-mono">esc</kbd>
                  <span className="ml-0.5">Close</span>
                </span>
              </div>
              <span className="hidden items-center gap-1 sm:flex">
                HireMind <span className="font-semibold text-foreground">AI</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
