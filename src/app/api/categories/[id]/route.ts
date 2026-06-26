import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  const body = await req.json();
  const { name, slug, description, icon, color, sort } = body;
  try {
    const cat = await db.category.update({
      where: { id },
      data: { name, slug, description, icon, color, sort },
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "CATEGORY_UPDATE", target: id, details: `Catégorie modifiée: ${name}`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json(cat);
  } catch {
    return NextResponse.json({ error: "Impossible de modifier" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  const cat = await db.category.findUnique({ where: { id }, include: { services: true } });
  if (!cat) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await db.category.delete({ where: { id } });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "CATEGORY_DELETE", target: id, details: `Catégorie supprimée: ${cat.name}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
