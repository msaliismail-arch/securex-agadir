import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Session manquante" }, { status: 400 });

  const payment = await db.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: { appointment: { include: { category: true, service: true } } },
  });
  if (!payment || payment.appointment.clientId !== session.sub) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    status: payment.status,
    appointment: {
      id: payment.appointment.id,
      code: payment.appointment.code,
      status: payment.appointment.status,
      paymentStatus: payment.appointment.paymentStatus,
      date: payment.appointment.date,
      slot: payment.appointment.slot,
      serviceName: payment.appointment.service.name,
      depositAmountCents: payment.appointment.depositAmountCents,
      balanceDueCents: payment.appointment.balanceDueCents,
    },
  });
}
