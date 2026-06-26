import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

/**
 * Admin login: username + password (bcrypt-verified).
 * Single-step — 2FA verification codes have been removed per spec.
 * The role is derived from the admin account in DB.
 * Session TTL: 3h (set in lib/auth.ts).
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
  }

  const admin = await db.adminUser.findFirst({
    where: { username: username.trim().toLowerCase(), active: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    await audit({
      adminId: admin.id, adminName: admin.name, adminRole: admin.role,
      action: "ADMIN_LOGIN_FAILED", target: admin.id,
      details: "Mot de passe incorrect", ipAddress: clientIp(req),
    });
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  await createSession({
    sub: admin.id,
    role: admin.role as AdminRole,
    name: admin.name,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    username: admin.username,
  });

  await audit({
    adminId: admin.id, adminName: admin.name, adminRole: admin.role,
    action: "ADMIN_LOGIN", target: admin.id,
    details: `Connexion ${ADMIN_ROLES[admin.role as AdminRole]?.label ?? admin.role}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({
    ok: true,
    redirect: ADMIN_ROLES[admin.role as AdminRole].route,
    role: admin.role,
    name: admin.name,
  });
}
