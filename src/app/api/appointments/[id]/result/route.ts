import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

/**
 * Create / update the inspection result for an appointment AND mark the
 * appointment as COMPLETED. SUPER + VALIDATION roles only.
 *
 * Body: {
 *   overallResult: "PASS" | "FAIL",
 *   brakes, lights, tires, emissions, bodywork: "PASS" | "FAIL",
 *   inspector?: string,
 *   notes?: string,
 * }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminRole(["SUPER", "VALIDATION"]);
  if (!guard.ok) return guard.res;

  const { id } = await params;
  const body = await req.json();
  const { overallResult, brakes, lights, tires, emissions, bodywork, inspector, notes } = body as {
    overallResult?: string;
    brakes?: string;
    lights?: string;
    tires?: string;
    emissions?: string;
    bodywork?: string;
    inspector?: string;
    notes?: string;
  };

  if (!overallResult || (overallResult !== "PASS" && overallResult !== "FAIL")) {
    return NextResponse.json({ error: "Résultat global requis (PASS/FAIL)" }, { status: 400 });
  }

  const existing = await db.appointment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

  // Auto-compute overall = FAIL if any sub-result is FAIL (defensive — client already does this).
  const subs = [brakes, lights, tires, emissions, bodywork];
  const anyFail = subs.some((s) => s === "FAIL");
  const computedOverall = anyFail ? "FAIL" : overallResult;

  const result = await db.inspectionResult.upsert({
    where: { appointmentId: id },
    create: {
      appointmentId: id,
      overallResult: computedOverall,
      brakes: brakes || "PASS",
      lights: lights || "PASS",
      tires: tires || "PASS",
      emissions: emissions || "PASS",
      bodywork: bodywork || "PASS",
      inspector: inspector || guard.session.name,
      notes: notes || null,
    },
    update: {
      overallResult: computedOverall,
      brakes: brakes || "PASS",
      lights: lights || "PASS",
      tires: tires || "PASS",
      emissions: emissions || "PASS",
      bodywork: bodywork || "PASS",
      inspector: inspector || guard.session.name,
      notes: notes || null,
    },
  });

  const appt = await db.appointment.update({
    where: { id },
    data: { status: "COMPLETED" },
    include: { category: true, service: true, result: true },
  });

  await audit({
    adminId: guard.session.sub,
    adminName: guard.session.name,
    adminRole: guard.session.role,
    action: "APPOINTMENT_COMPLETED",
    target: id,
    details: `RDV ${existing.code} terminé · Résultat: ${computedOverall}`,
    ipAddress: clientIp(req),
  });
  await audit({
    adminId: guard.session.sub,
    adminName: guard.session.name,
    adminRole: guard.session.role,
    action: "INSPECTION_RESULT",
    target: id,
    details: `Contrôle enregistré pour RDV ${existing.code} · ${computedOverall} (F:${brakes}/${lights}/${tires}/${emissions}/${bodywork})`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ appointment: appt, result }, { status: 201 });
}

/** Return the inspection result for an appointment. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const result = await db.inspectionResult.findUnique({ where: { appointmentId: id } });
  if (!result) return NextResponse.json({ error: "Aucun résultat" }, { status: 404 });
  return NextResponse.json(result);
}
