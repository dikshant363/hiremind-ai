/**
 * GET /api/session/compare?a=<sessionId>&b=<sessionId>
 *
 * Returns a side-by-side comparison payload of two past sessions plus
 * the deltas between their key prototype indices:
 *
 *   {
 *     a:      { id, jobTitle, createdAt, isDemo, matchIndex, readinessIndex,
 *               gapCount, topGaps: string[], interviewScore: number | null },
 *     b:      { ...same shape },
 *     deltas: { matchDelta, readinessDelta, gapDelta, interviewScoreDelta }
 *   }
 *
 * Status codes:
 *   200 — success
 *   400 — missing a or b query param
 *   404 — either session not found
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { MatchResult, SkillGap, InterviewState } from "@/lib/types";

export const runtime = "nodejs";

interface SessionSummary {
  id: string;
  jobTitle: string;
  createdAt: string;
  isDemo: boolean;
  matchIndex: number | null;
  readinessIndex: number | null;
  gapCount: number;
  topGaps: string[];
  interviewScore: number | null;
}

/** Build the lightweight comparison summary for a single session row. */
function buildSummary(row: {
  id: string;
  isDemo: boolean;
  createdAt: Date;
  jobTitle: string;
  matchJson: string | null;
  gapsJson: string | null;
  readinessJson: string | null;
  interviewJson: string | null;
}): SessionSummary {
  let matchIndex: number | null = null;
  let readinessIndex: number | null = null;
  let gapCount = 0;
  let topGaps: string[] = [];
  let interviewScore: number | null = null;

  try {
    if (row.matchJson) {
      const match = JSON.parse(row.matchJson) as MatchResult;
      if (match && typeof match.index === "number") matchIndex = match.index;
    }
  } catch {
    /* ignore */
  }

  try {
    if (row.gapsJson) {
      const gaps = JSON.parse(row.gapsJson) as SkillGap[];
      if (Array.isArray(gaps)) {
        gapCount = gaps.length;
        // Sort by priorityScore descending (already typically sorted, but be safe)
        const sorted = [...gaps].sort(
          (x, y) => (y.priorityScore ?? 0) - (x.priorityScore ?? 0)
        );
        topGaps = sorted.slice(0, 3).map((g) => g.competency);
      }
    }
  } catch {
    /* ignore */
  }

  try {
    if (row.readinessJson) {
      const readiness = JSON.parse(row.readinessJson);
      if (readiness && typeof readiness.index === "number") {
        readinessIndex = readiness.index;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    if (row.interviewJson) {
      const interview = JSON.parse(row.interviewJson) as InterviewState;
      if (interview && Array.isArray(interview.evaluations) && interview.evaluations.length > 0) {
        const sum = interview.evaluations.reduce(
          (acc, e) => acc + (typeof e.overall === "number" ? e.overall : 0),
          0
        );
        // overall is 0..1; normalize to a 0..100 score for display
        interviewScore = Math.round((sum / interview.evaluations.length) * 100);
      }
    }
  } catch {
    /* ignore */
  }

  return {
    id: row.id,
    jobTitle: row.jobTitle,
    createdAt: row.createdAt.toISOString(),
    isDemo: row.isDemo,
    matchIndex,
    readinessIndex,
    gapCount,
    topGaps,
    interviewScore,
  };
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const aId = params.get("a");
  const bId = params.get("b");

  if (!aId || !bId) {
    return NextResponse.json(
      { error: "Missing 'a' or 'b' session id." },
      { status: 400 }
    );
  }
  if (aId === bId) {
    return NextResponse.json(
      { error: "Pick two different sessions to compare." },
      { status: 400 }
    );
  }

  const [rowA, rowB] = await Promise.all([
    db.session.findUnique({
      where: { id: aId },
      select: {
        id: true,
        isDemo: true,
        createdAt: true,
        jobTitle: true,
        matchJson: true,
        gapsJson: true,
        readinessJson: true,
        interviewJson: true,
      },
    }),
    db.session.findUnique({
      where: { id: bId },
      select: {
        id: true,
        isDemo: true,
        createdAt: true,
        jobTitle: true,
        matchJson: true,
        gapsJson: true,
        readinessJson: true,
        interviewJson: true,
      },
    }),
  ]);

  if (!rowA || !rowB) {
    return NextResponse.json(
      { error: "One or both sessions not found." },
      { status: 404 }
    );
  }

  // Normalize ordering: chronologically older session becomes "a", newer becomes "b".
  // This way deltas are always (newer - older) → positive = improvement, which is
  // the most intuitive mental model for a "growth over time" view. We still return
  // the originally-requested ids in the labels so the picker UI stays consistent.
  const olderFirst =
    rowA.createdAt.getTime() <= rowB.createdAt.getTime()
      ? { a: rowA, b: rowB }
      : { a: rowB, b: rowA };

  const a = buildSummary(olderFirst.a);
  const b = buildSummary(olderFirst.b);

  const matchDelta =
    a.matchIndex !== null && b.matchIndex !== null ? b.matchIndex - a.matchIndex : null;
  const readinessDelta =
    a.readinessIndex !== null && b.readinessIndex !== null
      ? b.readinessIndex - a.readinessIndex
      : null;
  // For gaps: fewer is better. Delta is (a - b) so positive = improvement (reduced gaps).
  const gapDelta = a.gapCount - b.gapCount;
  const interviewScoreDelta =
    a.interviewScore !== null && b.interviewScore !== null
      ? b.interviewScore - a.interviewScore
      : null;

  return NextResponse.json({
    a,
    b,
    deltas: {
      matchDelta,
      readinessDelta,
      gapDelta,
      interviewScoreDelta,
    },
  });
}

export { db };
