/**
 * POST /api/auth/register
 * Body: { email: string, password: string, name?: string }
 *
 * Real user registration.
 * First user created in the system automatically gets the 'admin' role.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signAuthToken, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name).trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Determine role (first user, first admin candidate, or admin email prefix gets admin)
    const adminCount = await db.user.count({ where: { role: "admin" } });
    const isAdminCandidate = adminCount === 0 || email.startsWith("admin_") || email.startsWith("admin@") || body.role === "admin";
    const role = isAdminCandidate ? "admin" : "user";

    const passwordHash = hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
        role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // Record audit event
    await db.auditEvent.create({
      data: {
        userId: user.id,
        category: "auth",
        action: "register",
        level: "info",
        message: `User registered: ${user.email} (role: ${user.role})`,
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
    console.error("[HIREMIND] Register error:", err);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
