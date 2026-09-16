import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { auth, currentUser } from "@clerk/nextjs/server";

import type { AdminRole } from "./constants";
import { db } from "@/lib/db";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const SESSION_COOKIE = "sx_session";
const PENDING_COOKIE = "sx_pending";

const SESSION_TTL_SECONDS = 60 * 60 * 3;
const PENDING_TTL_SECONDS = 60 * 5;

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

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

export interface PendingPayload {
  sub: string;
  username: string;
  role: string;
  name: string;
  email: string;

  iat?: number;
  exp?: number;
}

/* -------------------------------------------------------------------------- */
/*                              Session secret                                */
/* -------------------------------------------------------------------------- */

function sessionSecret() {
  const value = process.env.SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET doit contenir au moins 32 caractères",
    );
  }

  return new TextEncoder().encode(value);
}

/* -------------------------------------------------------------------------- */
/*                               Cookie options                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                             Password helpers                               */
/* -------------------------------------------------------------------------- */

export async function hashPassword(
  plain: string,
): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* -------------------------------------------------------------------------- */
/*                           Legacy/Admin session                             */
/* -------------------------------------------------------------------------- */

export async function createSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("3h")
    .sign(sessionSecret());

  const store = await cookies();

  store.set(
    SESSION_COOKIE,
    token,
    COOKIE_OPTS,
  );

  return token;
}

/**
 * Lit uniquement l'ancienne session JWT locale.
 *
 * Important:
 * cette fonction ne touche jamais Clerk.
 * Elle est utilisée notamment par l'authentification admin.
 */
async function getLegacySession(): Promise<SessionPayload | null> {
  const store = await cookies();

  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      sessionSecret(),
    );

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                            Pending admin session                           */
/* -------------------------------------------------------------------------- */

export async function createPendingSession(
  payload: Omit<PendingPayload, "iat" | "exp">,
) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(sessionSecret());

  const store = await cookies();

  store.set(
    PENDING_COOKIE,
    token,
    PENDING_OPTS,
  );

  return token;
}

export async function getPendingSession(): Promise<PendingPayload | null> {
  const store = await cookies();

  const token = store.get(PENDING_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      sessionSecret(),
    );

    return payload as unknown as PendingPayload;
  } catch {
    return null;
  }
}

export async function destroyPendingSession() {
  const store = await cookies();

  store.delete(PENDING_COOKIE);
}

/* -------------------------------------------------------------------------- */
/*                               Clerk client                                 */
/* -------------------------------------------------------------------------- */

/**
 * Retourne l'identité d'un client Clerk uniquement si:
 *
 * - l'utilisateur est connecté;
 * - son utilisateur Clerk existe;
 * - son adresse email principale est vérifiée.
 */
export async function getVerifiedClerkClientIdentity(): Promise<ClerkClientIdentity | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const user = await currentUser();

    if (!user) {
      return null;
    }

    const primaryEmail = user.emailAddresses.find(
      (address) =>
        address.id === user.primaryEmailAddressId,
    );

    if (!primaryEmail) {
      return null;
    }

    if (primaryEmail.verification?.status !== "verified") {
      return null;
    }

    const email = primaryEmail.emailAddress
      .trim()
      .toLowerCase();

    if (!email) {
      return null;
    }

    const name =
      user.fullName?.trim() ||
      [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      email.split("@")[0];

    return {
      userId,
      email,
      name,
    };
  } catch (error) {
    console.error(
      "[CLERK_CLIENT_IDENTITY]",
      error,
    );

    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                      Unified compatibility session                         */
/* -------------------------------------------------------------------------- */

/**
 * Compatibilité avec l'ancien code.
 *
 * 1. Cherche d'abord l'ancienne session.
 * 2. Sinon regarde si un utilisateur Clerk est connecté.
 * 3. Cherche son profil Client PostgreSQL par email.
 *
 * Cela permet aux anciennes APIs utilisant getSession()
 * de continuer à fonctionner pendant la migration vers Clerk.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const legacySession = await getLegacySession();

  if (legacySession) {
    return legacySession;
  }

  try {
    const identity =
      await getVerifiedClerkClientIdentity();

    if (!identity) {
      return null;
    }

    const client = await db.client.findUnique({
      where: {
        email: identity.email,
      },
    });

    if (!client) {
      return null;
    }

    return {
      sub: client.id,
      role: "CLIENT",
      name: client.name,
      email: client.email,
      phone: client.phone,
    };
  } catch (error) {
    console.error(
      "[GET_CLIENT_SESSION]",
      error,
    );

    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Destroy session                               */
/* -------------------------------------------------------------------------- */

/**
 * Supprime uniquement les cookies de l'ancien système.
 *
 * Clerk logout doit être géré avec Clerk (SignOutButton/signOut).
 */
export async function destroySession() {
  const store = await cookies();

  store.delete(SESSION_COOKIE);
  store.delete(PENDING_COOKIE);
}

/* -------------------------------------------------------------------------- */
/*                                Admin guard                                 */
/* -------------------------------------------------------------------------- */

/**
 * Admin = ancien JWT uniquement.
 *
 * Clerk ne doit jamais authentifier un administrateur.
 */
export async function requireAdmin(
  allowed: AdminRole[],
): Promise<SessionPayload | null> {
  const session = await getLegacySession();

  if (!session) {
    return null;
  }

  if (session.role === "CLIENT") {
    return null;
  }

  if (!allowed.includes(session.role as AdminRole)) {
    return null;
  }

  return session;
}

/* -------------------------------------------------------------------------- */
/*                        Browser session compatibility                       */
/* -------------------------------------------------------------------------- */

/**
 * Ancien helper encore utilisé éventuellement par certains composants.
 *
 * À terme, pour les clients Clerk, préférer directement:
 * useUser(), useAuth(), SignedIn, SignedOut...
 */
export async function getClientSession(): Promise<SessionPayload | null> {
  try {
    const response = await fetch("/api/auth/me", {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();

    if (!text) {
      return null;
    }

    return JSON.parse(text) as SessionPayload;
  } catch {
    return null;
  }
}