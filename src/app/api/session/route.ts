/**
 * GET /api/session?id=...
 * Returns the full SessionPayload for a given session id.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const payload = await loadSession(id);
  if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json(payload);
}

export { db };
