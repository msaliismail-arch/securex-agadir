import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature Stripe invalide" }, { status: 400 });
  }

  try {
    await db.$transaction(async (tx) => {
      if (await tx.stripeWebhookEvent.findUnique({ where: { stripeEventId: event.id } })) return;

      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          const payment = await tx.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
          if (!payment) throw new Error("PAYMENT_NOT_READY");
          if (payment && payment.status !== "PAID") {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: "PAID", paidAt: new Date(), stripePaymentIntentId: paymentIntentId(session) },
            });
            await tx.appointment.update({
              where: { id: payment.appointmentId },
              data: {
                status: "APPROVED",
                paymentStatus: "PAID",
                amountPaidCents: payment.amountCents,
                balanceDueCents: { decrement: payment.amountCents },
              },
            });
          }
        }
      } else if (event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const payment = await tx.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
        if (payment) {
          await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
          await tx.appointment.update({ where: { id: payment.appointmentId }, data: { paymentStatus: "FAILED" } });
        }
      } else if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        const payment = await tx.payment.findUnique({ where: { stripeCheckoutSessionId: session.id } });
        if (payment) {
          await tx.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
          await tx.appointment.updateMany({
            where: { id: payment.appointmentId, paymentStatus: "PENDING" },
            data: { status: "CANCELLED", paymentStatus: "EXPIRED" },
          });
        }
      } else if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (intentId) {
          const payment = await tx.payment.findUnique({ where: { stripePaymentIntentId: intentId } });
          if (payment && payment.status !== "REFUNDED") {
            await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
            await tx.appointment.update({
              where: { id: payment.appointmentId },
              data: { paymentStatus: "REFUNDED", amountPaidCents: 0, balanceDueCents: { increment: payment.amountCents } },
            });
          }
        }
      }

      await tx.stripeWebhookEvent.create({
        data: { stripeEventId: event.id, type: event.type },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: "Traitement du webhook impossible" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
