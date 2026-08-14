/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 *
 * Real user login with PBKDF2 password verification and HTTP-only cookie session token.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signAuthToken, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      // Record failed login audit event
      await db.auditEvent.create({
        data: {
          userId: user.id,
          category: "auth",
          action: "login_failed",
          level: "warn",
          message: `Failed login attempt for ${user.email}`,
        },
      }).catch(() => {});

      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Record successful login audit event
    await db.auditEvent.create({
      data: {
        userId: user.id,
        category: "auth",
        action: "login_success",
        level: "info",
        message: `User logged in: ${user.email}`,
      },
    }).catch(() => {});

    const token = signAuthToken(user);
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });

    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error("[HIREMIND] Login error:", err);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}
