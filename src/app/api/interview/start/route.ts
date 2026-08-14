/**
 * POST /api/interview/start
 * Body: { sessionId: string, difficultyPreference?: "auto" | "easy" | "medium" | "hard" }
 *
 * Initializes the adaptive interview state machine from the session's gaps.
 * The first question targets the highest-impact gap.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initInterview } from "@/lib/engine";
import { loadSession, persistSession, isAuthorizedForSession } from "@/lib/session";
import { getAuthenticatedUser } from "@/lib/auth";
import type { InterviewDifficulty } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;
    const difficultyPreference: InterviewDifficulty =
      ["auto", "easy", "medium", "hard"].includes(body.difficultyPreference)
        ? (body.difficultyPreference as InterviewDifficulty)
        : "auto";

    if (!sessionId) return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });

    const payload = await loadSession(sessionId);
    if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    const user = await getAuthenticatedUser(req);
    if (!isAuthorizedForSession(payload, user)) {
      return NextResponse.json({ error: "Unauthorized access to this session." }, { status: 403 });
    }

    if (!payload.match || !payload.gaps) {
      return NextResponse.json({ error: "Run analysis first." }, { status: 400 });
    }

    const interview = initInterview(payload.gaps, payload.candidate, payload.match, difficultyPreference);
    await persistSession(sessionId, { interviewJson: JSON.stringify(interview), status: "interviewed" });

    return NextResponse.json({ interview });
  } catch (err) {
    console.error("[HIREMIND] /api/interview/start error:", err);
    return NextResponse.json({ error: "Couldn't start the interview." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "hiremind-interview-start" });
}

// Re-export db to keep tree-shaking happy
export { db };
