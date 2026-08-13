/**
 * HIREMIND AI — Session helpers (DB persistence + payload assembly).
 */

import { db } from "@/lib/db";
import type {
  CandidateProfile,
  JobProfile,
  MatchResult,
  SkillGap,
  InterviewState,
  ReadinessResult,
  Roadmap,
  SessionPayload,
} from "@/lib/types";

export async function persistSession(
  id: string,
  patch: Partial<{
    resumeText: string;
    jobTitle: string;
    jobText: string;
    candidateProfileJson: string;
    jobProfileJson: string;
    matchJson: string;
    gapsJson: string;
    interviewJson: string;
    readinessJson: string;
    roadmapJson: string;
    isDemo: boolean;
    status: string;
  }>
) {
  await db.session.update({ where: { id }, data: patch });
}

export async function loadSession(id: string): Promise<SessionPayload | null> {
  const row = await db.session.findUnique({ where: { id } });
  if (!row) return null;
  return rowToPayload(row);
}

export function rowToPayload(row: {
  id: string;
  isDemo: boolean;
  status: string;
  createdAt: Date;
  resumeText: string;
  jobTitle: string;
  jobText: string;
  candidateProfileJson: string;
  jobProfileJson: string;
  matchJson: string | null;
  gapsJson: string | null;
  interviewJson: string | null;
  readinessJson: string | null;
  roadmapJson: string | null;
}): SessionPayload {
  const candidate = JSON.parse(row.candidateProfileJson) as CandidateProfile;
  const jobProfile = JSON.parse(row.jobProfileJson) as JobProfile;
  const match = row.matchJson ? (JSON.parse(row.matchJson) as MatchResult) : null;
  const gaps = row.gapsJson ? (JSON.parse(row.gapsJson) as SkillGap[]) : null;
  const interview = row.interviewJson ? (JSON.parse(row.interviewJson) as InterviewState) : null;
  const readiness = row.readinessJson ? (JSON.parse(row.readinessJson) as ReadinessResult) : null;
  const roadmap = row.roadmapJson ? (JSON.parse(row.roadmapJson) as Roadmap) : null;

  return {
    id: row.id,
    isDemo: row.isDemo,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resume: {
      name: candidate.name,
      summary: candidate.summary,
      lines: candidate.raw.lines,
    },
    job: {
      title: jobProfile.title,
      summary: jobProfile.summary,
      lines: jobProfile.raw.lines,
    },
    candidate,
    jobProfile,
    match,
    gaps,
    interview,
    readiness,
    roadmap,
  };
}

export async function createSessionRecord(opts: {
  resumeText: string;
  jobTitle: string;
  jobText: string;
  candidate: CandidateProfile;
  job: JobProfile;
  isDemo: boolean;
}): Promise<string> {
  const row = await db.session.create({
    data: {
      resumeText: opts.resumeText,
      jobTitle: opts.jobTitle,
      jobText: opts.jobText,
      candidateProfileJson: JSON.stringify(opts.candidate),
      jobProfileJson: JSON.stringify(opts.job),
      isDemo: opts.isDemo,
      status: "analyzed",
    },
  });
  return row.id;
}

/**
 * Cleanup old sessions.
 *
 * - Sessions older than `maxAgeHours` (default 24h) are deleted.
 * - The 10 most recent sessions are ALWAYS preserved (regardless of age).
 * - The 5 most recent demo sessions are ALWAYS preserved (regardless of age),
 *   so the "Load demo candidate" CTA on the home page always has fresh seed data.
 *
 * Returns the count of deleted rows, the remaining row count, and the ISO8601
 * cutoff timestamp that was used. Safe to call fire-and-forget from the session
 * list endpoint — every home page load triggers a background sweep.
 */
export async function cleanupOldSessions(
  maxAgeHours = 24
): Promise<{ deleted: number; remaining: number; cutoff: string }> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  // Preserve the 10 most recent sessions (any kind) and the 5 most recent demo
  // sessions. Run both lookups in parallel — they hit different sort orders but
  // both touch the same index so this is cheap.
  const [recentSessions, recentDemoSessions] = await Promise.all([
    db.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true },
    }),
    db.session.findMany({
      where: { isDemo: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true },
    }),
  ]);

  const preserveIds = [
    ...recentSessions.map((s) => s.id),
    ...recentDemoSessions.map((s) => s.id),
  ];

  const result = await db.session.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      id: { notIn: preserveIds },
    },
  });

  const remaining = await db.session.count();

  return {
    deleted: result.count,
    remaining,
    cutoff: cutoff.toISOString(),
  };
}
