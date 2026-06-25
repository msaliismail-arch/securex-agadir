import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { AdminRole } from "./constants";

const SESSION_COOKIE = "sx_session";
const PENDING_COOKIE = "sx_pending";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "securex-connect-dev-secret-change-in-production-32b"
);

/** Session lifetime: 3 hours (per spec). */
const SESSION_TTL_SECONDS = 60 * 60 * 3;
/** Pending (pre-2FA) session: 5 minutes to enter the 2FA code. */
const PENDING_TTL_SECONDS = 60 * 5;

export type SessionRole = AdminRole | "CLIENT";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
  name: string;
  email?: string;
  phone?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

/** Pending payload — issued after step 1 (username + password) verified. */
export interface PendingPayload {
  sub: string;
  username: string;
  role: string;
  name: string;
  email: string;
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

const PENDING_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: PENDING_TTL_SECONDS,
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

/** Step 1 passed — issue a short-lived pending token (NOT a real session). */
export async function createPendingSession(payload: Omit<PendingPayload, "iat" | "exp">) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(SESSION_SECRET);
  const store = await cookies();
  store.set(PENDING_COOKIE, token, PENDING_OPTS);
  return token;
}

/** Read + verify the pending token (step 2). Returns null if invalid/expired. */
export async function getPendingSession(): Promise<PendingPayload | null> {
  const store = await cookies();
  const token = store.get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as PendingPayload;
  } catch {
    return null;
  }
}

export async function destroyPendingSession() {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
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
  store.delete(PENDING_COOKIE);
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
