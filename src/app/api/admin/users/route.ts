import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";

export async function GET() {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { email, name, role, phone } = body;
  if (!email || !name || !role || !ADMIN_ROLES[role as AdminRole]) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }
  try {
    const user = await db.adminUser.create({
      data: { email: email.toLowerCase().trim(), name, role, phone: phone || null },
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "ADMIN_USER_CREATE", target: user.id, details: `Admin créé: ${name} (${role})`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const body = await req.json();
  const { id, name, role, phone, active } = body;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  const user = await db.adminUser.update({
    where: { id },
    data: { name, role, phone, active },
  });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "ADMIN_USER_UPDATE", target: id, details: `Admin modifié: ${name}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json(user);
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
