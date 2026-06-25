import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createPendingSession, destroyPendingSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

/**
 * Step 1 of admin login: username + password.
 * On success, issues a short-lived (5 min) pending session token (NOT a real
 * session) so step 2 (/api/auth/admin-verify) can complete the 2FA check.
 * The 2FA code is NEVER sent back to the client.
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
      details: "Mot de passe incorrect (étape 1)", ipAddress: clientIp(req),
    });
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  // Step 1 OK — issue pending token (5 min). Client must now enter 2FA code.
  await createPendingSession({
    sub: admin.id,
    username: admin.username,
    role: admin.role,
    name: admin.name,
    email: admin.email,
  });

  return NextResponse.json({
    pending: true,
    name: admin.name,
    role: admin.role,
  });
}

/** Cancel a pending 2FA session (e.g. user clicks "back"). */
export async function DELETE() {
  await destroyPendingSession();
  return NextResponse.json({ ok: true });
}
