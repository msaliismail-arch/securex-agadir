import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

/**
 * Admin login: email + password (bcrypt-verified), role-agnostic.
 * The role is derived from the admin account in DB (no client-side role claim).
 * Session TTL: 3h (set in lib/auth.ts).
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const admin = await db.adminUser.findFirst({
    where: { email: email.toLowerCase().trim(), active: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  await createSession({
    sub: admin.id,
    role: admin.role as AdminRole,
    name: admin.name,
    email: admin.email,
  });

  await audit({
    adminId: admin.id,
    adminName: admin.name,
    adminRole: admin.role,
    action: "ADMIN_LOGIN",
    target: admin.id,
    details: `Connexion ${ADMIN_ROLES[admin.role as AdminRole].label}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({
    ok: true,
    redirect: ADMIN_ROLES[admin.role as AdminRole].route,
    role: admin.role,
    name: admin.name,
  });
}
