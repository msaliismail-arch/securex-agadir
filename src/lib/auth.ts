import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { AdminRole } from "./constants";
import { db } from "@/lib/db";

const SESSION_COOKIE = "sx_session";
const PENDING_COOKIE = "sx_pending";
function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET doit contenir au moins 32 caractères");
  return new TextEncoder().encode(value);
}

/** Session lifetime: 3 hours (per spec). */
const SESSION_TTL_SECONDS = 60 * 60 * 3;
/** Pending (pre-2FA) session: 5 minutes to enter the 2FA code. */
const PENDING_TTL_SECONDS = 60 * 5;

export type SessionRole = AdminRole | "CLIENT";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

export interface ClerkClientIdentity {
  userId: string;
  email: string;
  name: string;
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
    .sign(sessionSecret());
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
    .sign(sessionSecret());
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
    const { payload } = await jwtVerify(token, sessionSecret());
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
  if (token) {
    try {
      const { payload } = await jwtVerify(token, sessionSecret());
      return payload as unknown as SessionPayload;
    } catch {}
  }

  try {
    const identity = await getVerifiedClerkClientIdentity();
    if (!identity) return null;
    const client = await db.client.findUnique({ where: { email: identity.email } });
    if (!client) return null;

    return {
      sub: client.id,
      role: "CLIENT",
      name: client.name,
      email: client.email,
      phone: client.phone,
    };
  } catch {
    return null;
  }
}

/** Verified Clerk identity for CLIENT flows only. Admin auth never calls Clerk. */
export async function getVerifiedClerkClientIdentity(): Promise<ClerkClientIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const verifiedEmail = user.emailAddresses.find(
    (address) =>
      address.id === user.primaryEmailAddressId &&
      address.verification?.status === "verified"
  );
  if (!verifiedEmail) return null;

  const name =
    user.fullName?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    verifiedEmail.emailAddress.split("@")[0];

  return {
    userId,
    email: verifiedEmail.emailAddress.toLowerCase(),
    name,
  };
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
