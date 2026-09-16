import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function getPaymentIntentId(
  session: Stripe.Checkout.Session,
): string | null {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? null;
}

function getChargePaymentIntentId(
  charge: Stripe.Charge,
): string | null {
  if (typeof charge.payment_intent === "string") {
    return charge.payment_intent;
  }

  return charge.payment_intent?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                  Webhook                                   */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const signature = request.headers.get(
    "stripe-signature",
  );

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error(
      "[STRIPE_WEBHOOK] Signature ou STRIPE_WEBHOOK_SECRET absent",
    );

    return NextResponse.json(
      {
        error: "Configuration webhook manquante",
      },
      {
        status: 400,
      },
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         Verify Stripe signature                           */
  /* ------------------------------------------------------------------------ */

  let event: Stripe.Event;

  try {
    const rawBody =
      await request.text();

    event =
      getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
  } catch (error) {
    console.error(
      "[STRIPE_WEBHOOK_SIGNATURE]",
      error,
    );

    return NextResponse.json(
      {
        error: "Signature Stripe invalide",
      },
      {
        status: 400,
      },
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                              Process event                               */
  /* ------------------------------------------------------------------------ */

  try {
    await db.$transaction(
      async (tx) => {
        /*
         * Stripe peut renvoyer le même événement.
         *
         * On vérifie donc s'il a déjà été traité.
         */
        const alreadyProcessed =
          await tx.stripeWebhookEvent.findUnique({
            where: {
              stripeEventId: event.id,
            },
          });

        if (alreadyProcessed) {
          return;
        }

        /* ------------------------------------------------------------------ */
        /*                          PAYMENT SUCCESS                           */
        /* ------------------------------------------------------------------ */

        if (
          event.type ===
            "checkout.session.completed" ||
          event.type ===
            "checkout.session.async_payment_succeeded"
        ) {
          const session =
            event.data
              .object as Stripe.Checkout.Session;

          /*
           * checkout.session.completed peut aussi arriver
           * avant paiement final pour certains moyens
           * de paiement asynchrones.
           */
          if (
            session.payment_status ===
            "paid"
          ) {
            const payment =
              await tx.payment.findUnique({
                where: {
                  stripeCheckoutSessionId:
                    session.id,
                },
              });

            /*
             * Stripe peut être plus rapide que notre
             * insertion du Payment en DB.
             *
             * On retourne 500 plus bas afin que Stripe
             * retente le webhook.
             */
            if (!payment) {
              throw new Error(
                "PAYMENT_NOT_READY",
              );
            }

            /*
             * Ne jamais appliquer le paiement deux fois.
             */
            if (
              payment.status !== "PAID" &&
              payment.status !== "REFUNDED"
            ) {
              const appointment =
                await tx.appointment.findUnique({
                  where: {
                    id:
                      payment.appointmentId,
                  },

                  select: {
                    id: true,
                    totalAmountCents:
                      true,
                  },
                });

              if (!appointment) {
                throw new Error(
                  "APPOINTMENT_NOT_FOUND",
                );
              }

              const paidAmount =
                payment.amountCents;

              const remainingBalance =
                Math.max(
                  0,
                  appointment.totalAmountCents -
                    paidAmount,
                );

              await tx.payment.update({
                where: {
                  id: payment.id,
                },

                data: {
                  status: "PAID",

                  paidAt:
                    new Date(),

                  stripePaymentIntentId:
                    getPaymentIntentId(
                      session,
                    ),
                },
              });

              await tx.appointment.update({
                where: {
                  id:
                    payment.appointmentId,
                },

                data: {
                  /*
                   * Paiement de l'acompte confirmé:
                   * le rendez-vous est validé.
                   */
                  status: "APPROVED",

                  paymentStatus:
                    "PAID",

                  amountPaidCents:
                    paidAmount,

                  balanceDueCents:
                    remainingBalance,
                },
              });
            }
          }
        }

        /* ------------------------------------------------------------------ */
        /*                           PAYMENT FAILED                            */
        /* ------------------------------------------------------------------ */

        else if (
          event.type ===
          "checkout.session.async_payment_failed"
        ) {
          const session =
            event.data
              .object as Stripe.Checkout.Session;

          const payment =
            await tx.payment.findUnique({
              where: {
                stripeCheckoutSessionId:
                  session.id,
              },
            });

          if (
            payment &&
            payment.status !== "PAID" &&
            payment.status !== "REFUNDED"
          ) {
            await tx.payment.update({
              where: {
                id: payment.id,
              },

              data: {
                status: "FAILED",
              },
            });

            /*
             * Important:
             * on annule le rendez-vous afin de libérer
             * le créneau.
             */
            await tx.appointment.updateMany({
              where: {
                id:
                  payment.appointmentId,

                paymentStatus:
                  "PENDING",
              },

              data: {
                status: "CANCELLED",

                paymentStatus:
                  "FAILED",
              },
            });
          }
        }

        /* ------------------------------------------------------------------ */
        /*                         CHECKOUT EXPIRED                            */
        /* ------------------------------------------------------------------ */

        else if (
          event.type ===
          "checkout.session.expired"
        ) {
          const session =
            event.data
              .object as Stripe.Checkout.Session;

          const payment =
            await tx.payment.findUnique({
              where: {
                stripeCheckoutSessionId:
                  session.id,
              },
            });

          if (
            payment &&
            payment.status !== "PAID" &&
            payment.status !== "REFUNDED"
          ) {
            await tx.payment.update({
              where: {
                id: payment.id,
              },

              data: {
                status: "EXPIRED",
              },
            });

            /*
             * Le Checkout a expiré.
             * Le créneau doit être libéré.
             */
            await tx.appointment.updateMany({
              where: {
                id:
                  payment.appointmentId,

                paymentStatus:
                  "PENDING",
              },

              data: {
                status: "CANCELLED",

                paymentStatus:
                  "EXPIRED",
              },
            });
          }
        }

        /* ------------------------------------------------------------------ */
        /*                               REFUND                                */
        /* ------------------------------------------------------------------ */

        else if (
          event.type ===
          "charge.refunded"
        ) {
          const charge =
            event.data
              .object as Stripe.Charge;

          const paymentIntentId =
            getChargePaymentIntentId(
              charge,
            );

          if (paymentIntentId) {
            const payment =
              await tx.payment.findUnique({
                where: {
                  stripePaymentIntentId:
                    paymentIntentId,
                },
              });

            if (payment) {
              const appointment =
                await tx.appointment.findUnique({
                  where: {
                    id:
                      payment.appointmentId,
                  },

                  select: {
                    id: true,
                    totalAmountCents:
                      true,
                  },
                });

              if (appointment) {
                /*
                 * Stripe peut envoyer un refund partiel.
                 */
                const refundedAmount =
                  Math.min(
                    charge.amount_refunded,
                    payment.amountCents,
                  );

                const remainingPaid =
                  Math.max(
                    0,
                    payment.amountCents -
                      refundedAmount,
                  );

                const remainingBalance =
                  Math.max(
                    0,
                    appointment.totalAmountCents -
                      remainingPaid,
                  );

                const fullRefund =
                  refundedAmount >=
                  payment.amountCents;

                /*
                 * Notre schema n'a pas forcément
                 * PARTIALLY_REFUNDED.
                 *
                 * Donc:
                 * - remboursement total → REFUNDED
                 * - remboursement partiel → garde PAID
                 */
                if (
                  fullRefund &&
                  payment.status !==
                    "REFUNDED"
                ) {
                  await tx.payment.update({
                    where: {
                      id: payment.id,
                    },

                    data: {
                      status:
                        "REFUNDED",
                    },
                  });
                }

                await tx.appointment.update({
                  where: {
                    id:
                      payment.appointmentId,
                  },

                  data: {
                    paymentStatus:
                      fullRefund
                        ? "REFUNDED"
                        : "PAID",

                    amountPaidCents:
                      remainingPaid,

                    balanceDueCents:
                      remainingBalance,
                  },
                });
              }
            }
          }
        }

        /* ------------------------------------------------------------------ */
        /*                          Mark event done                            */
        /* ------------------------------------------------------------------ */

        await tx.stripeWebhookEvent.create({
          data: {
            stripeEventId:
              event.id,

            type:
              event.type,
          },
        });
      },
      {
        isolationLevel:
          Prisma
            .TransactionIsolationLevel
            .Serializable,
      },
    );
  } catch (error) {
    /*
     * Deux exécutions simultanées du même
     * webhook peuvent tenter d'insérer
     * stripeEventId en même temps.
     */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    console.error(
      `[STRIPE_WEBHOOK_${event.type}]`,
      error,
    );

    /*
     * Important:
     * PAYMENT_NOT_READY retourne volontairement 500.
     *
     * Stripe pourra alors retenter l'événement.
     */
    return NextResponse.json(
      {
        error:
          "Traitement du webhook impossible",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    received: true,
  });
}