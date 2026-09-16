import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Non authentifié",
        },
        {
          status: 401,
        },
      );
    }

    if (session.role !== "CLIENT") {
      return NextResponse.json(
        {
          error: "Accès refusé",
        },
        {
          status: 403,
        },
      );
    }

    const { searchParams } = new URL(request.url);

    const sessionId = searchParams
      .get("session_id")
      ?.trim();

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Session Stripe manquante",
        },
        {
          status: 400,
        },
      );
    }

    const payment = await db.payment.findUnique({
      where: {
        stripeCheckoutSessionId: sessionId,
      },

      include: {
        appointment: {
          include: {
            category: true,
            service: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          error: "Paiement introuvable",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Sécurité:
     * un client ne peut consulter que
     * le paiement de son propre rendez-vous.
     */
    if (
      payment.appointment.clientId !== session.sub
    ) {
      return NextResponse.json(
        {
          error: "Paiement introuvable",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      status: payment.status,

      appointment: {
        id: payment.appointment.id,
        code: payment.appointment.code,

        status: payment.appointment.status,

        paymentStatus:
          payment.appointment.paymentStatus,

        date: payment.appointment.date,
        slot: payment.appointment.slot,

        serviceName:
          payment.appointment.service.name,

        categoryName:
          payment.appointment.category.name,

        totalAmountCents:
          payment.appointment.totalAmountCents,

        depositAmountCents:
          payment.appointment.depositAmountCents,

        amountPaidCents:
          payment.appointment.amountPaidCents,

        balanceDueCents:
          payment.appointment.balanceDueCents,
      },
    });
  } catch (error) {
    console.error(
      "[PAYMENT_STATUS_GET]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de vérifier le statut du paiement",
      },
      {
        status: 500,
      },
    );
  }
}