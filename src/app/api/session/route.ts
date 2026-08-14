/**
 * GET /api/session?id=...       → full SessionPayload (with server-side authorization)
 * GET /api/session?list=true    → recent sessions summary (limit 10)
 * GET /api/session?stats=true   → real database analytics summary
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanupOldSessions, loadSession, isAuthorizedForSession } from "@/lib/session";
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const id = params.get("id");
  const list = params.get("list");
  const stats = params.get("stats");
  const user = await getAuthenticatedUser(req);

  // Stats mode: calculate genuine metrics directly from actual database records
  if (stats === "true") {
    const totalSessions = await db.session.count();
    const completedSessions = await db.session.count({ where: { status: "completed" } });
    const userCount = await db.user.count();

    // Calculate real average readiness index from rows with readinessJson
    const completedRows = await db.session.findMany({
      where: { readinessJson: { not: null } },
      select: { readinessJson: true },
    });

    let avgReadiness = 0;
    let validReadinessCount = 0;
    for (const r of completedRows) {
      if (r.readinessJson) {
        try {
          const parsed = JSON.parse(r.readinessJson);
          if (typeof parsed?.index === "number") {
            avgReadiness += parsed.index;
            validReadinessCount++;
          }
        } catch { /* ignore */ }
      }
    }
    const averageReadiness = validReadinessCount > 0 ? Math.round(avgReadiness / validReadinessCount) : null;

    return NextResponse.json({
      totalSessions,
      completedSessions,
      registeredUsers: userCount,
      averageReadiness,
    });
  }

  // List mode: return recent sessions
  if (list === "true") {
    void cleanupOldSessions().catch((err) => {
      console.warn("[HIREMIND] background session cleanup failed:", err);
    });

    // If user is logged in (non-admin), show their sessions + recent demo sessions
    // If admin, show all sessions
    // If guest, show only demo sessions for privacy
    const whereClause = user
      ? (user.role === "admin" ? {} : { OR: [{ userId: user.id }, { isDemo: true }] })
      : { isDemo: true };

    const rows = await db.session.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        userId: true,
        isDemo: true,
        status: true,
        createdAt: true,
        jobTitle: true,
        candidateProfileJson: true,
        matchJson: true,
        readinessJson: true,
      },
    });

    const sessions = rows.map((r) => {
      let candidateName: string | null = null;
      let matchIndex: number | null = null;
      let readinessIndex: number | null = null;
      try {
        const candidate = JSON.parse(r.candidateProfileJson);
        candidateName = candidate?.name || null;
      } catch { /* ignore */ }
      try {
        if (r.matchJson) {
          const match = JSON.parse(r.matchJson);
          matchIndex = match?.index ?? null;
        }
      } catch { /* ignore */ }
      try {
        if (r.readinessJson) {
          const readiness = JSON.parse(r.readinessJson);
          readinessIndex = typeof readiness?.index === "number" ? readiness.index : null;
        }
      } catch { /* ignore */ }

      return {
        id: r.id,
        userId: r.userId,
        isDemo: r.isDemo,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        jobTitle: r.jobTitle,
        candidateName,
        matchIndex,
        readinessIndex,
      };
    });

    return NextResponse.json({ sessions });
  }

  // Single session mode
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const payload = await loadSession(id);
  if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  // Server-side authorization check: ensure user owns this session if it's private
  if (!isAuthorizedForSession(payload, user)) {
    return NextResponse.json({ error: "Unauthorized access to this session." }, { status: 403 });
  }

  return NextResponse.json(payload);
}

export async function DELETE(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const id = params.get("id");
  const user = await getAuthenticatedUser(req);

  if (!id) return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  const payload = await loadSession(id);
  if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  // Server-side authorization check: ensure caller owns this session or is admin
  if (!isAuthorizedForSession(payload, user)) {
    return NextResponse.json({ error: "Unauthorized to delete this session." }, { status: 403 });
  }

  try {
    await db.session.delete({ where: { id } });

    // Record audit event (PII-free)
    await db.auditEvent.create({
      data: {
        userId: user?.id || null,
        sessionId: id,
        category: "db",
        action: "session_deleted",
        level: "info",
        message: `Session ${id} deleted by ${user ? `user ${user.email}` : "anonymous owner"}`,
      },
    }).catch(() => { /* non-blocking audit logging */ });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    console.error("[HIREMIND] session deletion error:", err);
    return NextResponse.json({ error: "Failed to delete session." }, { status: 500 });
  }
}

export { db };


