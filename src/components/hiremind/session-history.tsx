"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, ChevronRight, Sparkles, BarChart3 } from "lucide-react";
import { useHireMind } from "@/lib/store";

interface SessionSummary {
  id: string;
  isDemo: boolean;
  status: string;
  createdAt: string;
  jobTitle: string;
  candidateName: string | null;
  matchIndex: number | null;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function SessionHistory() {
  const { hydrateSession } = useHireMind();
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session?list=true");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSessions(data.sessions || []);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8 sm:mt-10"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Recent sessions</h3>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {sessions.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => hydrateSession(s.id)}
              className="w-full hm-elevated rounded-xl p-3 sm:p-4 flex items-center gap-3 text-left group hover:bg-secondary/60 transition-colors"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                {s.isDemo ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium truncate">{s.candidateName || "Unknown candidate"}</span>
                  {s.isDemo && (
                    <span className="shrink-0 rounded-full bg-warning/15 text-warning-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase">Demo</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="truncate">{s.jobTitle}</span>
                  <span className="shrink-0">·</span>
                  <span className="shrink-0">{relativeTime(s.createdAt)}</span>
                </div>
              </div>
              {s.matchIndex !== null && (
                <div className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  <span className="tabular-nums">{s.matchIndex}</span>
                </div>
              )}
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
