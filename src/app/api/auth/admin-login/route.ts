import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";

/** Admin login: validate email belongs to an admin of the given role, issue OTP. */
export async function POST(req: Request) {
  const body = await req.json();
  const { email, role } = body as { email?: string; role?: AdminRole };

  if (!email || !role || !ADMIN_ROLES[role]) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const admin = await db.adminUser.findFirst({ where: { email: email.toLowerCase().trim(), role, active: true } });
  if (!admin) {
    return NextResponse.json({ error: "Compte administrateur introuvable pour ce rôle" }, { status: 404 });
  }

  // Simulated OTP — store 123456 (demo). In production this would be emailed/SMSed.
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.otpRequest.deleteMany({ where: { key: admin.email } });
  await db.otpRequest.create({ data: { key: admin.email, code: "123456", expiresAt } });

  return NextResponse.json({ ok: true, email: admin.email, name: admin.name, role: admin.role, demoOtp: "123456" });
}
