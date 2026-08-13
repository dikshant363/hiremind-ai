/**
 * POST /api/analyze
 * Body: { resumeText: string, jobTitle: string, jobText: string, isDemo?: boolean }
 *
 * Runs candidate intelligence + job intelligence + semantic match + gap engine.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractResume, extractJob } from "@/lib/ai";
import { computeMatch, computeGaps } from "@/lib/engine";
import { createSessionRecord, persistSession } from "@/lib/session";
import { DEMO_RESUME, DEMO_JOB, DEMO_JOB_TITLE } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT = 20_000;

function sanitize(s: string, max = MAX_TEXT): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let resumeText = sanitize(String(body.resumeText ?? ""));
    let jobTitle = sanitize(String(body.jobTitle ?? "")).slice(0, 200);
    let jobText = sanitize(String(body.jobText ?? ""));
    const isDemo = Boolean(body.isDemo) || Boolean(body.demo);

    if (isDemo) {
      resumeText = DEMO_RESUME;
      jobTitle = DEMO_JOB_TITLE;
      jobText = DEMO_JOB;
    }

    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json({ error: "Resume text is too short or missing." }, { status: 400 });
    }
    if (!jobText || jobText.length < 20) {
      return NextResponse.json({ error: "Job description is too short or missing." }, { status: 400 });
    }
    if (!jobTitle) jobTitle = "Target Role";

    const [{ profile: candidate, usedFallback: rFallback }, { profile: job, usedFallback: jFallback }] = await Promise.all([
      extractResume(resumeText),
      extractJob(jobTitle, jobText),
    ]);

    const match = computeMatch(candidate, job);
    const gaps = computeGaps(match, candidate, job);

    const id = await createSessionRecord({
      resumeText,
      jobTitle,
      jobText,
      candidate,
      job,
      isDemo,
    });

    await persistSession(id, {
      matchJson: JSON.stringify(match),
      gapsJson: JSON.stringify(gaps),
    });

    return NextResponse.json({
      id,
      isDemo,
      candidate,
      job,
      match,
      gaps,
      meta: { resumeFallback: rFallback, jobFallback: jFallback },
    });
  } catch (err) {
    console.error("[HIREMIND] /api/analyze error:", err);
    return NextResponse.json(
      { error: "We couldn't analyze that resume and job. Please try again or load the demo candidate." },
      { status: 500 }
    );
  }
}
