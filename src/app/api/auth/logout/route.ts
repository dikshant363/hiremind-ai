/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */

import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true, message: "Logged out successfully." });
  clearAuthCookie(res);
  return res;
}
