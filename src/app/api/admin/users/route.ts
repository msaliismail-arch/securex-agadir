import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";

export async function GET() {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "desc" } });
  // Never expose passwordHash
  return NextResponse.json(users.map(({ passwordHash, ...u }) => u));
}

export async function POST(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { email, name, role, phone, password } = body;
  if (!email || !name || !role || !ADMIN_ROLES[role as AdminRole]) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Mot de passe requis (min. 6 caractères)" }, { status: 400 });
  }
  try {
    const passwordHash = await hashPassword(password);
    const user = await db.adminUser.create({
      data: { email: email.toLowerCase().trim(), name, role, phone: phone || null, passwordHash },
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "ADMIN_USER_CREATE", target: user.id, details: `Admin créé: ${name} (${role})`,
      ipAddress: clientIp(req),
    });
    const { passwordHash: _ph, ...safe } = user;
    return NextResponse.json(safe, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { id, name, role, phone, active, password } = body;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  const data: any = { name, role, phone, active };
  if (password && password.length >= 6) {
    data.passwordHash = await hashPassword(password);
  }
  const user = await db.adminUser.update({ where: { id }, data });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "ADMIN_USER_UPDATE", target: id, details: `Admin modifié: ${name}${password ? " (+mot de passe)" : ""}`,
    ipAddress: clientIp(req),
  });
  const { passwordHash: _ph, ...safe } = user;
  return NextResponse.json(safe);
}

export async function DELETE(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  await db.adminUser.delete({ where: { id } });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "ADMIN_USER_DELETE", target: id, details: `Admin supprimé`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
