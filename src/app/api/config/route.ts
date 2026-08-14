/**
 * GET /api/config  → returns active system configuration
 * PUT /api/config  → updates system configuration (admin only)
 * POST /api/config → resets configuration to factory defaults (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSystemConfig, updateSystemConfig, resetSystemConfig } from "@/lib/config";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const config = await getSystemConfig();
    const user = await getAuthenticatedUser(req);

    // If admin requested, also include recent audit events
    let auditEvents: unknown[] = [];
    if (user && user.role === "admin") {
      auditEvents = await db.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
      });
    }

    return NextResponse.json({
      config,
      auditEvents,
      isAdmin: user?.role === "admin",
    });
  } catch (err) {
    console.error("[HIREMIND] /api/config GET error:", err);
    return NextResponse.json({ error: "Failed to load configuration." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Administrative privileges required to modify system configuration." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updated = await updateSystemConfig(body, user);
    return NextResponse.json({ config: updated, message: "Configuration updated successfully." });
  } catch (err) {
    console.error("[HIREMIND] /api/config PUT error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to update configuration." },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Administrative privileges required to reset system configuration." },
        { status: 403 }
      );
    }

    const reset = await resetSystemConfig(user);
    return NextResponse.json({ config: reset, message: "Configuration reset to factory defaults." });
  } catch (err) {
    console.error("[HIREMIND] /api/config POST (reset) error:", err);
    return NextResponse.json({ error: "Failed to reset configuration." }, { status: 500 });
  }
}
