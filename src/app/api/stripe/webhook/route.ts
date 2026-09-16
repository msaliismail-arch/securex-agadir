import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { generateQrToken } from "@/lib/qr";

export const runtime = "nodejs";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function getPaymentIntentId(
  session: Stripe.Checkout.Session,
): string | null {
  if (
    typeof session.payment_intent ===
    "string"
  ) {
    return session.payment_intent;
  }

  return (
    session.payment_intent?.id ??
    null
  );
}

function getChargePaymentIntentId(
  charge: Stripe.Charge,
): string | null {
  if (
    typeof charge.payment_intent ===
    "string"
  ) {
    return charge.payment_intent;
  }

  return (
    charge.payment_intent?.id ??
    null
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Webhook                                   */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: Request,
) {
  const signature =
    request.headers.get(
      "stripe-signature",
    );

  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  if (
    !signature ||
    !webhookSecret
  ) {
    console.error(
      "[STRIPE_WEBHOOK] Signature ou STRIPE_WEBHOOK_SECRET absent",
    );

    return NextResponse.json(
      {
        error:
          "Configuration webhook manquante",
      },
      {
        status: 400,
      },
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                      Vérification signature Stripe                       */
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
        error:
          "Signature Stripe invalide",
      },
      {
        status: 400,
      },
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         Traitement événement                             */
  /* ------------------------------------------------------------------------ */

  try {
    await db.$transaction(
      async (tx) => {
        /*
         * Stripe peut renvoyer le même événement
         * plusieurs fois.
         */
        const alreadyProcessed =
          await tx.stripeWebhookEvent.findUnique({
            where: {
              stripeEventId:
                event.id,
            },
          });

        if (alreadyProcessed) {
          return;
        }

        /* ------------------------------------------------------------------ */
        /*                           PAYMENT SUCCESS                          */
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
           * checkout.session.completed peut exister
           * même avant le paiement final pour certains
           * moyens de paiement.
           *
           * On confirme uniquement si Stripe dit PAID.
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
             * Stripe peut recevoir le webhook
             * juste avant que notre Payment soit
             * disponible en DB.
             *
             * On provoque donc un 500 pour que
             * Stripe retente automatiquement.
             */
            if (!payment) {
              throw new Error(
                "PAYMENT_NOT_READY",
              );
            }

            /*
             * Ne jamais créditer le paiement
             * une deuxième fois.
             */
            if (
              payment.status !==
                "PAID" &&
              payment.status !==
                "REFUNDED"
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

                    qrToken:
                      true,

                    qrGeneratedAt:
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

              /*
               * Même logique que le code
               * d'exemption :
               *
               * validation = RDV APPROVED + QR.
               */
              const qrToken =
                appointment.qrToken ??
                generateQrToken();

              const qrGeneratedAt =
                appointment.qrGeneratedAt ??
                new Date();

              await tx.payment.update({
                where: {
                  id:
                    payment.id,
                },

                data: {
                  status:
                    "PAID",

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
                   * Stripe a réellement confirmé
                   * l'acompte.
                   */
                  status:
                    "APPROVED",

                  paymentStatus:
                    "PAID",

                  amountPaidCents:
                    paidAmount,

                  balanceDueCents:
                    remainingBalance,

                  /*
                   * QR généré uniquement après
                   * confirmation réelle Stripe.
                   */
                  qrToken,

                  qrGeneratedAt,
                },
              });
            }
          }
        }

        /* ------------------------------------------------------------------ */
        /*                           PAYMENT FAILED                           */
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
            payment.status !==
              "PAID" &&
            payment.status !==
              "REFUNDED"
          ) {
            await tx.payment.update({
              where: {
                id:
                  payment.id,
              },

              data: {
                status:
                  "FAILED",
              },
            });

            /*
             * Paiement échoué:
             * on libère le créneau.
             */
            await tx.appointment.updateMany({
              where: {
                id:
                  payment.appointmentId,

                paymentStatus:
                  "PENDING",
              },

              data: {
                status:
                  "CANCELLED",

                paymentStatus:
                  "FAILED",
              },
            });
          }
        }

        /* ------------------------------------------------------------------ */
        /*                         CHECKOUT EXPIRED                           */
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
            payment.status !==
              "PAID" &&
            payment.status !==
              "REFUNDED"
          ) {
            await tx.payment.update({
              where: {
                id:
                  payment.id,
              },

              data: {
                status:
                  "EXPIRED",
              },
            });

            /*
             * Checkout expiré:
             * on libère le créneau.
             */
            await tx.appointment.updateMany({
              where: {
                id:
                  payment.appointmentId,

                paymentStatus:
                  "PENDING",
              },

              data: {
                status:
                  "CANCELLED",

                paymentStatus:
                  "EXPIRED",
              },
            });
          }
        }

        /* ------------------------------------------------------------------ */
        /*                                REFUND                              */
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
                    id:
                      true,

                    totalAmountCents:
                      true,
                  },
                });

              if (appointment) {
                /*
                 * Stripe peut faire un
                 * remboursement partiel.
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
                 * Pas de statut
                 * PARTIALLY_REFUNDED
                 * dans notre schéma.
                 *
                 * Total:
                 * REFUNDED
                 *
                 * Partiel:
                 * PAID
                 */
                if (
                  fullRefund &&
                  payment.status !==
                    "REFUNDED"
                ) {
                  await tx.payment.update({
                    where: {
                      id:
                        payment.id,
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
        /*                         Event traité                               */
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
      error.code ===
        "P2002"
    ) {
      return NextResponse.json({
        received:
          true,

        duplicate:
          true,
      });
    }

    /*
     * Transaction concurrente PostgreSQL.
     * On retourne 500 afin que Stripe
     * puisse retenter.
     */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2034"
    ) {
      console.error(
        `[STRIPE_WEBHOOK_CONCURRENCY_${event.type}]`,
        error,
      );

      return NextResponse.json(
        {
          error:
            "Transaction concurrente, nouvelle tentative nécessaire",
        },
        {
          status: 500,
        },
      );
    }

    console.error(
      `[STRIPE_WEBHOOK_${event.type}]`,
      error,
    );

    /*
     * PAYMENT_NOT_READY retourne
     * volontairement 500.
     *
     * Stripe va retenter.
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
    received:
      true,
  });
}