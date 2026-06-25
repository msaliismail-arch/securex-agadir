import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

/**
 * Reception verification: by 6-char code OR by qrToken.
 * Returns the appointment + result so the reception screen can render success/fail.
 */
export async function POST(req: Request) {
  const guard = await requireAdminRole(["SUPER", "RECEPTION"]);
  if (!guard.ok) return guard.res;

  const body = await req.json();
  const { code, qrToken } = body as { code?: string; qrToken?: string };

  let appt = null as any;
  if (qrToken) {
    appt = await db.appointment.findFirst({
      where: { qrToken },
      include: { category: true, service: true, result: true },
    });
  } else if (code) {
    const normalized = code.trim().toUpperCase();
    appt = await db.appointment.findFirst({
      where: { code: normalized },
      include: { category: true, service: true, result: true },
    });
  }

  if (!appt) {
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "CHECKIN_FAILED", details: `Code/QR introuvable: ${code || qrToken}`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json({ found: false, message: "Aucune réservation trouvée pour ce code." }, { status: 200 });
  }

  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "CHECKIN_SUCCESS", target: appt.id, details: `Vérification RDV ${appt.code} (${appt.status})`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ found: true, appointment: appt });
}
