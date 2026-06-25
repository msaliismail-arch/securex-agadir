import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPendingSession, createSession, destroyPendingSession } from "@/lib/auth";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

/**
 * Step 2 of admin login: 2FA verification code.
 * Reads the pending session (set by step 1), checks the admin's stored
 * twoFactorCode against the submitted code, and — on match — creates the
 * real 3-hour session and returns the redirect target.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { code } = body as { code?: string };

  if (!code) {
    return NextResponse.json({ error: "Code de vérification requis" }, { status: 400 });
  }

  const pending = await getPendingSession();
  if (!pending) {
    return NextResponse.json({ error: "Session expirée — recommencez la connexion" }, { status: 401 });
  }

  const admin = await db.adminUser.findUnique({ where: { id: pending.sub } });
  if (!admin || !admin.active) {
    await destroyPendingSession();
    return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
  }

  // Constant-time-ish comparison of the 2FA code
  if (admin.twoFactorCode !== code.trim()) {
    await audit({
      adminId: admin.id, adminName: admin.name, adminRole: admin.role,
      action: "ADMIN_2FA_FAILED", target: admin.id,
      details: "Code de vérification incorrect (étape 2)", ipAddress: clientIp(req),
    });
    return NextResponse.json({ error: "Code de vérification incorrect" }, { status: 401 });
  }

  // 2FA OK — create the real session
  await createSession({
    sub: admin.id,
    role: admin.role as AdminRole,
    name: admin.name,
    email: admin.email,
    username: admin.username,
  });
  await destroyPendingSession();

  await audit({
    adminId: admin.id, adminName: admin.name, adminRole: admin.role,
    action: "ADMIN_LOGIN", target: admin.id,
    details: `Connexion ${ADMIN_ROLES[admin.role as AdminRole].label} (2FA validée)`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({
    ok: true,
    redirect: ADMIN_ROLES[admin.role as AdminRole].route,
    role: admin.role,
    name: admin.name,
  });
}
