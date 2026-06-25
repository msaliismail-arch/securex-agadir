import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminRole } from "./constants";

const SESSION_COOKIE = "sx_session";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "securex-connect-dev-secret-change-in-production-32b"
);

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
  maxAge: 60 * 60 * 12, // 12h
};

export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
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
