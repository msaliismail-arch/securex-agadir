import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import { generateQrToken } from "@/lib/qr";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const appt = await db.appointment.findUnique({
    where: { id },
    include: { category: true, service: true, result: true, client: true, vehicle: true },
  });
  if (!appt) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  // Clients can only see their own
  if (session.role === "CLIENT" && appt.clientPhone !== session.phone) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return NextResponse.json(appt);
}

/** Update appointment (status change, edit). SUPER + VALIDATION. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER", "VALIDATION"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  const body = await req.json();
  const { status, date, slot, notes, categoryId, serviceId, clientName, clientPhone, vehiclePlate, vehicleDesc } = body;

  const existing = await db.appointment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const data: any = {};
  if (status) data.status = status;
  if (date) data.date = new Date(date);
  if (slot) data.slot = slot;
  if (notes !== undefined) data.notes = notes;
  if (categoryId) data.categoryId = categoryId;
  if (serviceId) data.serviceId = serviceId;
  if (clientName) data.clientName = clientName;
  if (clientPhone) data.clientPhone = clientPhone;
  if (vehiclePlate) data.vehiclePlate = vehiclePlate;
  if (vehicleDesc) data.vehicleDesc = vehicleDesc;

  // When approving → generate QR token (the validation QR)
  if (status === "APPROVED" && !existing.qrToken) {
    data.qrToken = generateQrToken();
    data.qrGeneratedAt = new Date();
  }

  const appt = await db.appointment.update({ where: { id }, data, include: { category: true, service: true } });

  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: status ? `APPOINTMENT_${status}` : "APPOINTMENT_UPDATE",
    target: id, details: `RDV ${existing.code} → ${status || "modifié"}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json(appt);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRole(["SUPER", "VALIDATION"]);
  if (!guard.ok) return guard.res;
  const { id } = await params;
  const existing = await db.appointment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await db.appointment.delete({ where: { id } });
  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "APPOINTMENT_DELETE", target: id, details: `RDV ${existing.code} supprimé`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
