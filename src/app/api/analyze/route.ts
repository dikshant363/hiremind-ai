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
import { getAuthenticatedUser } from "@/lib/auth";
import { getSystemConfig } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT = 20_000;

function sanitize(s: string, max = MAX_TEXT): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`analyze:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many analysis requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }
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

    const [config, { profile: candidate, usedFallback: rFallback, source: rSource }, { profile: job, usedFallback: jFallback, source: jSource }] = await Promise.all([
      getSystemConfig(),
      extractResume(resumeText),
      extractJob(jobTitle, jobText),
    ]);

    const match = computeMatch(candidate, job, config.scoringWeights);
    const gaps = computeGaps(match, candidate, job);

    const user = await getAuthenticatedUser(req);

    const id = await createSessionRecord({
      userId: user?.id ?? null,
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

    const analysisSource = (!rFallback && !jFallback && (rSource === "live-ai" || jSource === "live-ai")) ? "live-ai" : "deterministic-fallback";

    return NextResponse.json({
      id,
      isDemo,
      candidate,
      job,
      match,
      gaps,
      meta: {
        analysisSource,
        resumeFallback: rFallback,
        jobFallback: jFallback,
        resumeSource: rSource,
        jobSource: jSource,
      },
    });
  } catch (err) {
    console.error("[HIREMIND] /api/analyze error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Analysis is temporarily unavailable. The service could not reach its production data service. Please try again." },
      { status: 500 }
    );
  }
}
