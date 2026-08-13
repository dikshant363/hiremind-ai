"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Copy,
  Check,
  FileDown,
  FileJson,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHireMind } from "@/lib/store";
import { toast } from "sonner";
import { PrintReport } from "./print-report";

/** Trigger a client-side file download from a string payload. */
function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportResults() {
  const { candidate, job, match, gaps, interview, readiness, roadmap } = useHireMind();
  const [copied, setCopied] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState<string | null>(null);
  const [printing, setPrinting] = React.useState(false);

  /* ─── Print flow ──────────────────────────────────────────────────
   * 1. Set printing=true so <PrintReport /> mounts (offscreen via CSS).
   * 2. Wait one animation frame + a short tick so React commits + the
   *    browser paints the report before we open the print dialog.
   * 3. Call window.print().
   * 4. Listen for `onafterprint` to tear down the report. A timeout
   *    fallback covers browsers/Safari that don't fire afterprint when
   *    the user cancels the dialog.
   * ────────────────────────────────────────────────────────────────── */
  const printingRef = React.useRef(false);

  const handleDownloadPdf = React.useCallback(() => {
    if (printingRef.current) return;
    printingRef.current = true;
    setPrinting(true);
    toast.success("Opening print dialog… Save as PDF to download.");

    const cleanup = () => {
      printingRef.current = false;
      setPrinting(false);
      window.removeEventListener("afterprint", onAfterPrint);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };

    const onAfterPrint = () => cleanup();
    let fallbackTimer: number | undefined;
    window.addEventListener("afterprint", onAfterPrint, { once: true });

    // Use double-rAF so React commits, the DOM paints, then we print.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Extra 50ms safety margin for slow painters / large reports.
        fallbackTimer = window.setTimeout(() => {
          // If afterprint never fires (e.g. user dismisses dialog in some
          // browsers), tear down after a generous 30s so we don't leak.
        }, 30000);
        try {
          window.print();
        } catch {
          // window.print() can throw in restricted contexts — tear down.
          cleanup();
        }
      });
    });
  }, []);

  /** Build the full markdown assessment report as a single string.
   *  Shared by the clipboard + .md download paths so the two outputs
   *  are guaranteed to be identical. */
  const buildMarkdown = React.useCallback(() => {
    const lines: string[] = [];

    lines.push("# HireMind AI — Assessment Report");
    lines.push("");

    // Candidate info
    lines.push("## Candidate");
    lines.push(`**Name:** ${candidate?.name ?? "Not provided"}`);
    lines.push(`**Target Role:** ${job?.title ?? "Not specified"}`);
    lines.push("");

    // Match
    if (match) {
      lines.push("## Job Match Index");
      lines.push(`**Score:** ${match.index}/100 (${match.band})`);
      lines.push(`**Headline:** ${match.headline}`);
      lines.push("");
      lines.push("### Components");
      for (const c of match.components) {
        lines.push(`- ${c.label}: ${Math.round(c.score * 100)}% (weight ${Math.round(c.weight * 100)}%) — ${c.detail}`);
      }
      lines.push("");
    }

    // Gaps
    if (gaps && gaps.length > 0) {
      lines.push("## Skill Gaps");
      for (const g of gaps) {
        lines.push(`- **${g.competency}** (${g.priority}): ${g.reason}`);
      }
      lines.push("");
    }

    // Interview
    if (interview && interview.evaluations.length > 0) {
      lines.push("## Adaptive Interview");
      lines.push(`**Questions answered:** ${interview.evaluations.length}`);
      lines.push("");
      for (let i = 0; i < interview.evaluations.length; i++) {
        const ev = interview.evaluations[i];
        const q = interview.questions.find((qq) => qq.id === ev.questionId);
        const a = interview.answers.find((aa) => aa.questionId === ev.questionId);
        lines.push(`### Q${i + 1}: ${q?.competency ?? "Unknown"}`);
        if (q) lines.push(`**Question:** ${q.text}`);
        if (a) lines.push(`**Answer:** ${a.text.length > 200 ? a.text.slice(0, 200) + "…" : a.text}`);
        lines.push(`**Overall:** ${Math.round(ev.overall * 100)}%`);
        if (ev.strengths.length > 0) lines.push(`**Strengths:** ${ev.strengths.join(", ")}`);
        if (ev.weaknesses.length > 0) lines.push(`**Weaknesses:** ${ev.weaknesses.join(", ")}`);
        if (ev.nextFocus) lines.push(`**Next focus:** ${ev.nextFocus}`);
        lines.push("");
      }

      // Competency states
      const changed = interview.competencyStates.filter(
        (c) => c.resumeLevel !== c.interviewLevel && c.interviewLevel !== "unknown"
      );
      if (changed.length > 0) {
        lines.push("### Competency State Changes");
        for (const c of changed) {
          lines.push(`- ${c.competency}: ${c.resumeLevel} → ${c.interviewLevel} (${c.status})`);
        }
        lines.push("");
      }
    }

    // Readiness
    if (readiness) {
      lines.push("## Job Readiness Index");
      lines.push(`**Score:** ${readiness.index}/100 (${readiness.band})`);
      lines.push(`**Headline:** ${readiness.headline}`);
      lines.push("");
      for (const d of readiness.dimensions) {
        lines.push(`- ${d.label}: ${Math.round(d.score * 100)}% — ${d.detail}`);
      }
      if (readiness.criticalBlockers.length > 0) {
        lines.push("");
        lines.push("**Critical blockers:**");
        for (const b of readiness.criticalBlockers) {
          lines.push(`- ${b}`);
        }
      }
      lines.push(`**Next best action:** ${readiness.nextBestAction}`);
      lines.push("");
    }

    // Roadmap
    if (roadmap) {
      lines.push("## Improvement Roadmap");
      lines.push(`**Current gap:** ${roadmap.currentGap}`);
      lines.push("");
      for (const s of roadmap.steps) {
        lines.push(`### ${s.phase} — ${s.competency}`);
        lines.push(`**Focus:** ${s.focus}`);
        lines.push(`**Reason:** ${s.reason}`);
        if (s.practice.length > 0) {
          lines.push("**Practice:**");
          for (const p of s.practice) {
            lines.push(`- ${p}`);
          }
        }
        lines.push("");
      }
    }

    lines.push("---");
    lines.push("*Generated by HireMind AI — Assessment support, not a hiring verdict.*");
    lines.push("*Prototype indices · AI-assisted evaluation*");

    return lines.join("\n");
  }, [candidate, job, match, gaps, interview, readiness, roadmap]);

  const handleCopyMarkdown = React.useCallback(() => {
    const text = buildMarkdown();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Results copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Could not copy to clipboard");
    });
  }, [buildMarkdown]);

  const handleDownloadMarkdown = React.useCallback(() => {
    const text = buildMarkdown();
    downloadBlob(text, "hiremind-assessment.md", "text/markdown;charset=utf-8");
    toast.success("Markdown downloaded");
    setDownloaded("md");
    setTimeout(() => setDownloaded(null), 2000);
  }, [buildMarkdown]);

  const handleDownloadJson = React.useCallback(() => {
    const payload = {
      generatedAt: new Date().toISOString(),
      app: "HireMind AI",
      version: "1.0",
      candidate: candidate ?? null,
      job: job ?? null,
      match: match ?? null,
      gaps: gaps ?? null,
      interview: interview ?? null,
      readiness: readiness ?? null,
      roadmap: roadmap ?? null,
    };
    const text = JSON.stringify(payload, null, 2);
    downloadBlob(text, "hiremind-assessment.json", "application/json;charset=utf-8");
    toast.success("JSON downloaded");
    setDownloaded("json");
    setTimeout(() => setDownloaded(null), 2000);
  }, [candidate, job, match, gaps, interview, readiness, roadmap]);

  if (!readiness) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <FileDown className="h-3.5 w-3.5" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Export format
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyMarkdown} className="gap-2 cursor-pointer">
              {copied ? <Check className="h-3.5 w-3.5 text-success-foreground" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy Markdown"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadMarkdown} className="gap-2 cursor-pointer">
              {downloaded === "md" ? (
                <Check className="h-3.5 w-3.5 text-success-foreground" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span>{downloaded === "md" ? "Downloaded" : "Download .md"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadJson} className="gap-2 cursor-pointer">
              {downloaded === "json" ? (
                <Check className="h-3.5 w-3.5 text-success-foreground" />
              ) : (
                <FileJson className="h-3.5 w-3.5" />
              )}
              <span>{downloaded === "json" ? "Downloaded" : "Download .json"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={printing}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span>{printing ? "Preparing…" : "Download PDF"}</span>
        </Button>
      </div>

      {/* Print-only report — rendered into document.body via portal so
          ancestor positioning / overflow can never interfere with the
          offscreen (left:-9999px) placement or the print CSS reset.
          Visibility/positioning is fully controlled by .hm-print-report
          in globals.css. */}
      {printing && typeof document !== "undefined"
        ? createPortal(<PrintReport />, document.body)
        : null}
    </>
  );
}
