import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  const body = await req.json();
  const { name, slug, description, durationMin, price, active } = body;
  try {
    const svc = await db.service.update({
      where: { id },
      data: { name, slug, description, durationMin, price: price != null ? Number(price) : undefined, active },
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "SERVICE_UPDATE", target: id, details: `Service modifié: ${name}`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json(svc);
  } catch {
    return NextResponse.json({ error: "Impossible de modifier" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  await db.service.delete({ where: { id } });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "SERVICE_DELETE", target: id, details: `Service supprimé`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
