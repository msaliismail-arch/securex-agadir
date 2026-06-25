import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { AdminRole } from "./constants";

const SESSION_COOKIE = "sx_session";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "securex-connect-dev-secret-change-in-production-32b"
);

/** Session lifetime: 3 hours (per spec). */
const SESSION_TTL_SECONDS = 60 * 60 * 3;

export type SessionRole = AdminRole | "CLIENT";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
  name: string;
  email?: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** Hash a password (used by seed + create-user flows). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Verify a password against a hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(SESSION_SECRET);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, COOKIE_OPTS);
  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Server-side guard for admin roles. Returns session or null. */
export async function requireAdmin(allowed: AdminRole[]): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "CLIENT") return null;
  if (!allowed.includes(session.role as AdminRole)) return null;
  return session;
}

/** Client-side token reader (for browser components). */
export async function getClientSession(): Promise<SessionPayload | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
