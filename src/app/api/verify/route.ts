import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

/**
 * Reception verification: by 6-char code OR by qrToken.
 *
 * ONE-TIME USE: each code/QR can be verified only once. After the first
 * successful check-in, `checkedInAt` is set and any subsequent attempt
 * (by the same code OR the same QR token) is rejected with a clear message.
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

  // ONE-TIME USE: reject if already checked in (only for valid appointments)
  if (appt.checkedInAt && (appt.status === "APPROVED" || appt.status === "COMPLETED")) {
    const when = new Date(appt.checkedInAt).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    await audit({
      adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
      action: "CHECKIN_REPLAY_BLOCKED", target: appt.id,
      details: `RDV ${appt.code} déjà vérifié le ${when} — seconde tentative bloquée`,
      ipAddress: clientIp(req),
    });
    return NextResponse.json({
      found: false,
      alreadyCheckedIn: true,
      message: `Ce code a déjà été vérifié le ${when}. Chaque code n'est valable qu'une seule fois.`,
    }, { status: 200 });
  }

  // Only consume the one-time use for VALID appointments (APPROVED / COMPLETED).
  // PENDING / CANCELLED appointments don't burn the code — the client can come
  // back after confirmation.
  if (appt.status === "APPROVED" || appt.status === "COMPLETED") {
    await db.appointment.update({
      where: { id: appt.id },
      data: {
        checkedInAt: new Date(),
        checkedInBy: guard.session.name,
      },
    });
  }

  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "CHECKIN_SUCCESS", target: appt.id, details: `Vérification RDV ${appt.code} (${appt.status})${appt.status === "APPROVED" || appt.status === "COMPLETED" ? " — usage unique consommé" : ""}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ found: true, appointment: appt });
}
