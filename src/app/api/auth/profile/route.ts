import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

/**
 * Admin self-profile: any admin (SUPER | RDV | RECEPTION) can read and update
 * their own firstName, lastName, phone, email, and password.
 * The role/username/active flags are NOT editable here (Super Admin owns those
 * via /api/admin/users).
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const admin = await db.adminUser.findUnique({ where: { id: session.sub } });
  if (!admin) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  // Never expose secrets
  const { passwordHash, twoFactorCode, ...safe } = admin;
  return NextResponse.json(safe);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const body = await req.json();
  const { firstName, lastName, phone, email, password } = body as {
    firstName?: string; lastName?: string; phone?: string; email?: string; password?: string;
  };

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Le prénom et le nom sont requis" }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
  }
  if (password && password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 });
  }

  const name = `${firstName.trim()} ${lastName.trim()}`;
  const data: any = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    name,
    phone: phone?.trim() || null,
    email: email.toLowerCase().trim(),
  };
  if (password) {
    data.passwordHash = await hashPassword(password);
  }

  try {
    const admin = await db.adminUser.update({ where: { id: session.sub }, data });
  } catch {
    return NextResponse.json({ error: "Email déjà utilisé par un autre compte" }, { status: 409 });
  }

  await audit({
    adminId: session.sub, adminName: name, adminRole: session.role,
    action: "ADMIN_PROFILE_UPDATE", target: session.sub,
    details: `Profil mis à jour: ${name}${password ? " (+mot de passe)" : ""}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({
    ok: true,
    name,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
  });
}
