import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, role, code } = body as { email?: string; role?: AdminRole; code?: string };

  if (!email || !role || !code) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const otp = await db.otpRequest.findFirst({
    where: { key: email.toLowerCase().trim(), consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.code !== code || otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code OTP invalide ou expiré" }, { status: 400 });
  }

  const admin = await db.adminUser.findFirst({ where: { email: email.toLowerCase().trim(), role } });
  if (!admin || !admin.active) {
    return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
  }

  await db.otpRequest.update({ where: { id: otp.id }, data: { consumed: true } });

  await createSession({
    sub: admin.id,
    role: admin.role as AdminRole,
    name: admin.name,
    email: admin.email,
  });

  await audit({
    adminId: admin.id, adminName: admin.name, adminRole: admin.role,
    action: "ADMIN_LOGIN", target: admin.id, details: `Connexion ${ADMIN_ROLES[admin.role as AdminRole].label}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, redirect: ADMIN_ROLES[admin.role as AdminRole].route });
}
