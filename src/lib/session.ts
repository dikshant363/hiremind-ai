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
