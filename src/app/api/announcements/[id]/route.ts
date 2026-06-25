import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  const body = await req.json();
  const { title, content, pinned, visible, category } = body;
  const item = await db.announcement.update({
    where: { id },
    data: { title, content, pinned, visible, category },
  });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "ANNOUNCEMENT_UPDATE", target: id, details: `Annonce modifiée: ${title}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  await db.announcement.delete({ where: { id } });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "ANNOUNCEMENT_DELETE", target: id, details: `Annonce supprimée`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
