/**
 * HIREMIND AI — Authentication & Authorization Engine
 *
 * Real server-side authentication using cryptographic password hashing (PBKDF2-SHA512)
 * and signed HMAC-SHA256 session tokens. Zero mock tokens, zero fake sessions.
 */

import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const AUTH_SECRET = process.env.AUTH_SECRET || "hiremind-production-auth-secret-key-2026-secure";
export const AUTH_COOKIE_NAME = "hm_auth_token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
  exp: number;
}

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512 and a cryptographically
 * secure random 16-byte salt. Format: `salt:iterations:derivedKeyHex`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100_000;
  const keylen = 64;
  const digest = "sha512";
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return `${salt}:${iterations}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [salt, iterationsStr, originalKey] = parts;
    const iterations = parseInt(iterationsStr, 10);
    if (isNaN(iterations)) return false;
    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(originalKey, "hex"));
  } catch {
    return false;
  }
}

/**
 * Signs a payload into a secure URL-safe HMAC-SHA256 token.
 */
export function signAuthToken(user: { id: string; email: string; role: string }): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as "user" | "admin",
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/**
 * Verifies and decodes a signed auth token. Returns null if invalid or expired.
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts the auth token from cookies or Authorization: Bearer header.
 */
export function getAuthTokenFromRequest(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  // Check Cookie header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Resolves the authenticated user from a Request or Next.js server context.
 */
export async function getAuthenticatedUser(req?: Request): Promise<AuthUser | null> {
  let token: string | null = null;
  if (req) {
    token = getAuthTokenFromRequest(req);
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
    } catch {
      token = null;
    }
  }

  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "user" | "admin",
    };
  } catch {
    return null;
  }
}

/**
 * Attaches the auth cookie to a NextResponse.
 */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the auth cookie on a NextResponse.
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
