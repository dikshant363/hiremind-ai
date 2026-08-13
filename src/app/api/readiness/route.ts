/**
 * POST /api/readiness
 * Body: { sessionId: string }
 *
 * Computes the Prototype Job Readiness Index + roadmap from the current
 * match / gaps / interview evidence, and persists them to the session.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeReadiness, computeRoadmap } from "@/lib/engine";
import { loadSession, persistSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json().catch(() => ({}));
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });

    const payload = await loadSession(sessionId);
    if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (!payload.match || !payload.gaps) {
      return NextResponse.json({ error: "Run analysis first." }, { status: 400 });
    }

    const readiness = computeReadiness(payload.match, payload.gaps, payload.interview);
    const roadmap = computeRoadmap(payload.gaps, payload.interview, readiness);

    await persistSession(sessionId, {
      readinessJson: JSON.stringify(readiness),
      roadmapJson: JSON.stringify(roadmap),
      status: "completed",
    });

    return NextResponse.json({ readiness, roadmap });
  } catch (err) {
    console.error("[HIREMIND] /api/readiness error:", err);
    return NextResponse.json({ error: "Couldn't compute readiness." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "hiremind-readiness" });
}

export { db };
