import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { generateQrToken } from "@/lib/qr";

import {
  generateCode,
  normalizePhone,
  isValidMaPhone,
  isValidMaPlateArabic,
} from "@/lib/utils";

import {
  DEFAULT_DAILY_CAPACITY,
  getSlotsForDate,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type ClientChannel =
  | "SMS"
  | "EMAIL"
  | "WHATSAPP";

interface BookingBody {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;

  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number | string;
  vehicleCategory?: string;

  categoryId?: string;
  serviceId?: string;

  date?: string;
  slot?: string;

  channel?: ClientChannel;

  promoCode?: string;
}

const APPOINTMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

type AppointmentStatusFilter =
  (typeof APPOINTMENT_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function ymdKeyLocal(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseYmd(
  value: string,
): Date | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function isValidEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}

function normalizeChannel(
  channel: unknown,
): ClientChannel {
  if (
    channel === "EMAIL" ||
    channel === "WHATSAPP" ||
    channel === "SMS"
  ) {
    return channel;
  }

  return "SMS";
}

async function uniqueAppointmentCode() {
  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {
    const code =
      generateCode();

    const existing =
      await db.appointment.findUnique({
        where: {
          code,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return code;
    }
  }

  throw new Error(
    "Impossible de générer une référence unique",
  );
}

/* -------------------------------------------------------------------------- */
/*                                   POST                                     */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: Request,
) {
  try {
    /* ---------------------------------------------------------------------- */
    /*                           Authentication                               */
    /* ---------------------------------------------------------------------- */

    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Connectez-vous avant de réserver",
        },
        {
          status: 401,
        },
      );
    }

    const isClient =
      session.role === "CLIENT";

    /* ---------------------------------------------------------------------- */
    /*                                  Body                                  */
    /* ---------------------------------------------------------------------- */

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | BookingBody
        | null;

    if (!body) {
      return NextResponse.json(
        {
          error:
            "Requête invalide",
        },
        {
          status: 400,
        },
      );
    }

    const {
      clientName,
      clientPhone,
      clientEmail,

      vehiclePlate,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vehicleCategory,

      categoryId,
      serviceId,

      date,
      slot,

      channel,
      promoCode,
    } = body;

    /* ---------------------------------------------------------------------- */
    /*                           Required fields                              */
    /* ---------------------------------------------------------------------- */

    if (
      !vehiclePlate ||
      !vehicleBrand?.trim() ||
      !vehicleModel?.trim() ||
      vehicleYear ===
        undefined ||
      !categoryId ||
      !serviceId ||
      !date ||
      !slot
    ) {
      return NextResponse.json(
        {
          error:
            "Tous les champs du véhicule et du rendez-vous sont requis",
        },
        {
          status: 400,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                         Vehicle validation                             */
    /* ---------------------------------------------------------------------- */

    const cleanPlate =
      vehiclePlate.trim();

    if (
      !isValidMaPlateArabic(
        cleanPlate,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Immatriculation marocaine invalide",
        },
        {
          status: 400,
        },
      );
    }

    const parsedYear =
      typeof vehicleYear ===
      "number"
        ? vehicleYear
        : Number(vehicleYear);

    const currentYear =
      new Date().getFullYear();

    if (
      !Number.isInteger(
        parsedYear,
      ) ||
      parsedYear < 1980 ||
      parsedYear >
        currentYear + 1
    ) {
      return NextResponse.json(
        {
          error:
            "Année du véhicule invalide",
        },
        {
          status: 400,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                            Date validation                             */
    /* ---------------------------------------------------------------------- */

    const appointmentDate =
      parseYmd(date);

    if (!appointmentDate) {
      return NextResponse.json(
        {
          error:
            "Date invalide",
        },
        {
          status: 400,
        },
      );
    }

    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );

    if (
      appointmentDate <
      today
    ) {
      return NextResponse.json(
        {
          error:
            "Cette date est passée",
        },
        {
          status: 400,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                               Slot check                               */
    /* ---------------------------------------------------------------------- */

    const allowedSlots =
      getSlotsForDate(
        appointmentDate,
      );

    if (
      !allowedSlots.includes(
        slot,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ce créneau n'est pas disponible pour cette date",
        },
        {
          status: 400,
        },
      );
    }

    if (
      ymdKeyLocal(
        appointmentDate,
      ) ===
      ymdKeyLocal(now)
    ) {
      const [
        hours,
        minutes,
      ] =
        slot
          .split(":")
          .map(Number);

      if (
        !Number.isFinite(
          hours,
        ) ||
        !Number.isFinite(
          minutes,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Créneau invalide",
          },
          {
            status: 400,
          },
        );
      }

      const slotMinutes =
        hours * 60 +
        minutes;

      const currentMinutes =
        now.getHours() *
          60 +
        now.getMinutes();

      if (
        slotMinutes <=
        currentMinutes
      ) {
        return NextResponse.json(
          {
            error:
              "Ce créneau horaire est déjà passé",
          },
          {
            status: 400,
          },
        );
      }
    }

    const dayStart =
      new Date(
        appointmentDate,
      );

    dayStart.setHours(
      0,
      0,
      0,
      0,
    );

    const dayEnd =
      new Date(
        appointmentDate,
      );

    dayEnd.setHours(
      23,
      59,
      59,
      999,
    );

    /* ---------------------------------------------------------------------- */
    /*                                Service                                 */
    /* ---------------------------------------------------------------------- */

    const service =
      await db.service.findFirst({
        where: {
          id: serviceId,
          categoryId,
          active: true,
        },

        include: {
          category: true,
        },
      });

    if (!service) {
      return NextResponse.json(
        {
          error:
            "Service indisponible",
        },
        {
          status: 404,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                                 Client                                 */
    /* ---------------------------------------------------------------------- */

    let client =
      isClient
        ? await db.client.findUnique({
            where: {
              id: session.sub,
            },
          })
        : null;

    if (
      isClient &&
      !client
    ) {
      return NextResponse.json(
        {
          error:
            "Profil client introuvable",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Création de RDV depuis l'administration.
     */
    if (!client) {
      const cleanName =
        clientName?.trim() ??
        "";

      const rawPhone =
        clientPhone ?? "";

      const cleanEmail =
        clientEmail
          ?.trim()
          .toLowerCase() ??
        "";

      if (
        cleanName.length <
          2 ||
        !isValidMaPhone(
          rawPhone,
        ) ||
        !isValidEmail(
          cleanEmail,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Nom, email et téléphone client valides requis",
          },
          {
            status: 400,
          },
        );
      }

      const phone =
        normalizePhone(
          rawPhone,
        );

      client =
        await db.client.findFirst({
          where: {
            OR: [
              {
                phone,
              },
              {
                email:
                  cleanEmail,
              },
            ],
          },
        });

      if (!client) {
        client =
          await db.client.create({
            data: {
              name:
                cleanName,

              phone,

              email:
                cleanEmail,

              channel:
                normalizeChannel(
                  channel,
                ),
            },
          });
      }
    }

    /* ---------------------------------------------------------------------- */
    /*                                 Vehicle                                */
    /* ---------------------------------------------------------------------- */

    const plate =
      cleanPlate.toUpperCase();

    let vehicle =
      await db.vehicle.findFirst({
        where: {
          plate,
        },
      });

    if (
      vehicle &&
      vehicle.clientId !==
        client.id
    ) {
      return NextResponse.json(
        {
          error:
            "Cette immatriculation appartient à un autre compte",
        },
        {
          status: 409,
        },
      );
    }

    if (!vehicle) {
      vehicle =
        await db.vehicle.create({
          data: {
            clientId:
              client.id,

            plate,

            brand:
              vehicleBrand.trim(),

            model:
              vehicleModel.trim(),

            year:
              parsedYear,

            category:
              vehicleCategory?.trim() ||
              service.category.slug.toUpperCase(),
          },
        });
    }

    /* ---------------------------------------------------------------------- */
    /*                                Amounts                                 */
    /* ---------------------------------------------------------------------- */

    const totalAmountCents =
      Math.round(
        service.price * 100,
      );

    const standardDepositAmountCents =
      Math.round(
        totalAmountCents *
          0.25,
      );

    /* ---------------------------------------------------------------------- */
    /*                           Code d'exemption                             */
    /* ---------------------------------------------------------------------- */

    const normalizedPromo =
      promoCode
        ?.trim()
        .toUpperCase() ||
      null;

    let promoId:
      | string
      | null = null;

    if (
      isClient &&
      normalizedPromo
    ) {
      const promo =
        await db.promoCode.findUnique({
          where: {
            code:
              normalizedPromo,
          },
        });

      const valid =
        promo &&
        promo.active &&
        promo.validFrom <=
          now &&
        (
          !promo.expiresAt ||
          promo.expiresAt >=
            now
        ) &&
        (
          promo.maxUses ===
            null ||
          promo.usageCount <
            promo.maxUses
        );

      if (
        !valid ||
        !promo
      ) {
        return NextResponse.json(
          {
            error:
              "Code d’exemption invalide, expiré ou épuisé",
          },
          {
            status: 400,
          },
        );
      }

      /*
       * Vérification rapide avant transaction.
       * La contrainte UNIQUE de PostgreSQL reste
       * la vraie sécurité finale.
       */
      const alreadyUsed =
        await db.promoCodeUsage.findUnique({
          where: {
            promoCodeId_clientId: {
              promoCodeId:
                promo.id,
              clientId:
                client.id,
            },
          },

          select: {
            id: true,
          },
        });

      if (alreadyUsed) {
        return NextResponse.json(
          {
            error:
              "Ce code d’exemption a déjà été utilisé par votre compte",
          },
          {
            status: 409,
          },
        );
      }

      promoId =
        promo.id;
    }

    /* ---------------------------------------------------------------------- */
    /*                       Appointment transaction                          */
    /* ---------------------------------------------------------------------- */

    const code =
      await uniqueAppointmentCode();

    let appointment: Prisma.AppointmentGetPayload<{
      include: {
        category: true;
        service: true;
      };
    }>;

    try {
      appointment =
        await db.$transaction(
          async (tx) => {
            /* -------------------------------------------------------------- */
            /*                     Capacité / créneau                          */
            /* -------------------------------------------------------------- */

            const [
              capacity,
              activeCount,
              occupied,
            ] =
              await Promise.all([
                tx.dailyCapacity.findUnique({
                  where: {
                    date:
                      dayStart,
                  },
                }),

                tx.appointment.count({
                  where: {
                    date: {
                      gte:
                        dayStart,
                      lte:
                        dayEnd,
                    },

                    status: {
                      in: [
                        "PENDING",
                        "APPROVED",
                      ],
                    },
                  },
                }),

                tx.appointment.findFirst({
                  where: {
                    date: {
                      gte:
                        dayStart,
                      lte:
                        dayEnd,
                    },

                    slot,

                    status: {
                      in: [
                        "PENDING",
                        "APPROVED",
                      ],
                    },
                  },

                  select: {
                    id: true,
                  },
                }),
              ]);

            const maxCapacity =
              capacity?.capaciteMax ??
              DEFAULT_DAILY_CAPACITY;

            if (
              activeCount >=
              maxCapacity
            ) {
              throw new Error(
                "DAY_FULL",
              );
            }

            if (occupied) {
              throw new Error(
                "SLOT_TAKEN",
              );
            }

            /* -------------------------------------------------------------- */
            /*                       Promo verification                        */
            /* -------------------------------------------------------------- */

            let currentPromo:
              | Awaited<
                  ReturnType<
                    typeof tx.promoCode.findUnique
                  >
                >
              | null = null;

            if (promoId) {
              currentPromo =
                await tx.promoCode.findUnique({
                  where: {
                    id:
                      promoId,
                  },
                });

              if (
                !currentPromo ||
                !currentPromo.active ||
                currentPromo.validFrom >
                  now ||
                (
                  currentPromo.expiresAt &&
                  currentPromo.expiresAt <
                    now
                ) ||
                (
                  currentPromo.maxUses !==
                    null &&
                  currentPromo.usageCount >=
                    currentPromo.maxUses
                )
              ) {
                throw new Error(
                  "PROMO_UNAVAILABLE",
                );
              }

              const existingUsage =
                await tx.promoCodeUsage.findUnique({
                  where: {
                    promoCodeId_clientId: {
                      promoCodeId:
                        promoId,
                      clientId:
                        client.id,
                    },
                  },

                  select: {
                    id: true,
                  },
                });

              if (existingUsage) {
                throw new Error(
                  "PROMO_ALREADY_USED",
                );
              }
            }

            /* -------------------------------------------------------------- */
            /*                         Queue number                            */
            /* -------------------------------------------------------------- */

            const countToday =
              await tx.appointment.count({
                where: {
                  date: {
                    gte:
                      dayStart,
                    lte:
                      dayEnd,
                  },
                },
              });

            const usingPromo =
              Boolean(
                promoId,
              );

            /*
             * Client avec Stripe:
             * acompte = 25 %
             *
             * Client avec code:
             * acompte en ligne = 0
             *
             * Admin:
             * paiement en ligne non requis.
             */
            const depositAmountCents =
              isClient &&
              !usingPromo
                ? standardDepositAmountCents
                : 0;

            /*
             * QR immédiatement disponible
             * uniquement pour le code validé.
             *
             * Pour Stripe, le webhook le générera
             * après confirmation réelle du paiement.
             */
            const qrToken =
              usingPromo
                ? generateQrToken()
                : null;

            const qrGeneratedAt =
              usingPromo
                ? new Date()
                : null;

            /* -------------------------------------------------------------- */
            /*                    Création du rendez-vous                      */
            /* -------------------------------------------------------------- */

            const createdAppointment =
              await tx.appointment.create({
                data: {
                  code,

                  clientId:
                    client.id,

                  vehicleId:
                    vehicle.id,

                  categoryId,
                  serviceId,

                  date:
                    appointmentDate,

                  slot,

                  status:
                    usingPromo
                      ? "APPROVED"
                      : "PENDING",

                  qrToken,

                  qrGeneratedAt,

                  clientName:
                    client.name,

                  clientPhone:
                    client.phone,

                  vehiclePlate:
                    vehicle.plate,

                  vehicleDesc:
                    `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,

                  queueNumber:
                    countToday +
                    1,

                  totalAmountCents,

                  depositAmountCents,

                  amountPaidCents:
                    0,

                  /*
                   * Code exemption:
                   * rien payé en ligne,
                   * donc tout reste à payer à l'agence.
                   */
                  balanceDueCents:
                    totalAmountCents,

                  paymentStatus:
                    !isClient
                      ? "NOT_REQUIRED"
                      : usingPromo
                        ? "WAIVED"
                        : "PENDING",

                  promoCodeId:
                    promoId,
                },

                include: {
                  category: true,
                  service: true,
                },
              });

            /* -------------------------------------------------------------- */
            /*                    Enregistrement utilisation                   */
            /* -------------------------------------------------------------- */

            if (
              promoId &&
              currentPromo
            ) {
              try {
                await tx.promoCodeUsage.create({
                  data: {
                    promoCodeId:
                      promoId,

                    clientId:
                      client.id,

                    appointmentId:
                      createdAppointment.id,
                  },
                });
              } catch (error) {
                /*
                 * Sécurité finale:
                 * @@unique([promoCodeId, clientId])
                 */
                if (
                  error instanceof
                    Prisma.PrismaClientKnownRequestError &&
                  error.code ===
                    "P2002"
                ) {
                  throw new Error(
                    "PROMO_ALREADY_USED",
                  );
                }

                throw error;
              }

              /*
               * Optimistic locking:
               * usageCount doit être toujours
               * exactement celui qu'on vient de lire.
               *
               * Si une autre réservation utilise
               * la dernière place simultanément,
               * cette transaction échoue.
               */
              const incrementResult =
                await tx.promoCode.updateMany({
                  where: {
                    id:
                      promoId,

                    active:
                      true,

                    usageCount:
                      currentPromo.usageCount,
                  },

                  data: {
                    usageCount: {
                      increment: 1,
                    },
                  },
                });

              if (
                incrementResult.count !==
                1
              ) {
                throw new Error(
                  "PROMO_UNAVAILABLE",
                );
              }
            }

            return createdAppointment;
          },
          {
            isolationLevel:
              Prisma
                .TransactionIsolationLevel
                .Serializable,
          },
        );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        if (
          error.message ===
          "DAY_FULL"
        ) {
          return NextResponse.json(
            {
              error:
                "Cette journée est complète",
            },
            {
              status: 409,
            },
          );
        }

        if (
          error.message ===
          "SLOT_TAKEN"
        ) {
          return NextResponse.json(
            {
              error:
                "Ce créneau vient d’être réservé",
            },
            {
              status: 409,
            },
          );
        }

        if (
          error.message ===
          "PROMO_ALREADY_USED"
        ) {
          return NextResponse.json(
            {
              error:
                "Ce code d’exemption a déjà été utilisé par votre compte",
            },
            {
              status: 409,
            },
          );
        }

        if (
          error.message ===
          "PROMO_UNAVAILABLE"
        ) {
          return NextResponse.json(
            {
              error:
                "Ce code d’exemption est invalide, expiré ou vient d’être épuisé",
            },
            {
              status: 409,
            },
          );
        }
      }

      /*
       * PostgreSQL Serializable peut demander
       * de réessayer une transaction concurrente.
       */
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code ===
          "P2034"
      ) {
        return NextResponse.json(
          {
            error:
              "Une autre réservation vient d’être effectuée. Veuillez réessayer.",
          },
          {
            status: 409,
          },
        );
      }

      console.error(
        "[APPOINTMENT_CREATE]",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Le rendez-vous n’a pas pu être créé",
        },
        {
          status: 409,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                    Pas de Stripe nécessaire                            */
    /* ---------------------------------------------------------------------- */

    /*
     * Admin:
     * paiement géré à l'agence.
     *
     * Code d'exemption:
     * RDV confirmé immédiatement
     * + QR généré.
     */
    if (
      !isClient ||
      promoId
    ) {
      return NextResponse.json(
        {
          ...appointment,

          confirmed:
            Boolean(
              promoId,
            ),

          paymentRequired:
            false,
        },
        {
          status: 201,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                           Stripe Checkout                              */
    /* ---------------------------------------------------------------------- */

    try {
      const stripe =
        getStripe();

      const checkout =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            ...(client.email
              ? {
                  customer_email:
                    client.email,
                }
              : {}),

            line_items: [
              {
                quantity: 1,

                price_data: {
                  currency:
                    "mad",

                  unit_amount:
                    standardDepositAmountCents,

                  product_data: {
                    name:
                      `Acompte 25 % — ${service.name}`,

                    description:
                      `Rendez-vous ${code} · solde à régler à l’agence`,
                  },
                },
              },
            ],

            metadata: {
              appointmentId:
                appointment.id,

              clientId:
                client.id,
            },

            payment_intent_data: {
              metadata: {
                appointmentId:
                  appointment.id,

                clientId:
                  client.id,
              },
            },

            success_url:
              `${getAppUrl(
                request,
              )}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url:
              `${getAppUrl(
                request,
              )}/paiement/cancel?appointment=${appointment.id}`,

            expires_at:
              Math.floor(
                Date.now() /
                  1000,
              ) +
              31 * 60,
          },
          {
            idempotencyKey:
              `appointment-${appointment.id}`,
          },
        );

      if (!checkout.url) {
        throw new Error(
          "URL Checkout absente",
        );
      }

      await db.payment.create({
        data: {
          appointmentId:
            appointment.id,

          stripeCheckoutSessionId:
            checkout.id,

          amountCents:
            standardDepositAmountCents,

          currency:
            "mad",
        },
      });

      return NextResponse.json(
        {
          appointmentId:
            appointment.id,

          checkoutUrl:
            checkout.url,

          confirmed:
            false,

          paymentRequired:
            true,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      console.error(
        "[STRIPE_CHECKOUT_CREATE]",
        error,
      );

      /*
       * Impossible de démarrer Stripe:
       * libération immédiate du créneau.
       */
      await db.appointment
        .update({
          where: {
            id:
              appointment.id,
          },

          data: {
            status:
              "CANCELLED",

            paymentStatus:
              "FAILED",
          },
        })
        .catch(
          (updateError) => {
            console.error(
              "[APPOINTMENT_CANCEL_AFTER_STRIPE_ERROR]",
              updateError,
            );
          },
        );

      return NextResponse.json(
        {
          error:
            "Impossible de démarrer le paiement. Aucun débit n’a été effectué.",
        },
        {
          status: 502,
        },
      );
    }
  } catch (error) {
    console.error(
      "[APPOINTMENTS_POST]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erreur interne lors de la réservation",
      },
      {
        status: 500,
      },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

/**
 * Liste des rendez-vous pour l'administration.
 *
 * Les clients utilisent /api/clients/me.
 */
export async function GET(
  request: Request,
) {
  try {
    const session =
      await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Non authentifié",
        },
        {
          status: 401,
        },
      );
    }

    if (
      session.role ===
      "CLIENT"
    ) {
      return NextResponse.json(
        {
          error:
            "Accès refusé",
        },
        {
          status: 403,
        },
      );
    }

    const {
      searchParams,
    } =
      new URL(
        request.url,
      );

    const status =
      searchParams.get(
        "status",
      );

    const date =
      searchParams.get(
        "date",
      );

    const q =
      searchParams
        .get("q")
        ?.trim();

    const where:
      Prisma.AppointmentWhereInput =
      {};

    /* ---------------------------------------------------------------------- */
    /*                             Status filter                              */
    /* ---------------------------------------------------------------------- */

    if (status) {
      if (
        !APPOINTMENT_STATUSES.includes(
          status as AppointmentStatusFilter,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Statut invalide",
          },
          {
            status: 400,
          },
        );
      }

      where.status =
        status as AppointmentStatusFilter;
    }

    /* ---------------------------------------------------------------------- */
    /*                              Date filter                               */
    /* ---------------------------------------------------------------------- */

    if (date) {
      const parsedDate =
        parseYmd(date);

      if (!parsedDate) {
        return NextResponse.json(
          {
            error:
              "Date invalide",
          },
          {
            status: 400,
          },
        );
      }

      const start =
        new Date(
          parsedDate,
        );

      const end =
        new Date(
          parsedDate,
        );

      start.setHours(
        0,
        0,
        0,
        0,
      );

      end.setHours(
        23,
        59,
        59,
        999,
      );

      where.date = {
        gte:
          start,
        lte:
          end,
      };
    }

    /* ---------------------------------------------------------------------- */
    /*                             Search filter                              */
    /* ---------------------------------------------------------------------- */

    if (q) {
      where.OR = [
        {
          code: {
            contains:
              q,
          },
        },

        {
          clientName: {
            contains:
              q,
          },
        },

        {
          clientPhone: {
            contains:
              q,
          },
        },

        {
          vehiclePlate: {
            contains:
              q,
          },
        },
      ];
    }

    const appointments =
      await db.appointment.findMany({
        where,

        include: {
          category:
            true,

          service:
            true,

          result:
            true,

          payments:
            true,

          promoCode:
            true,

          promoUsage:
            true,
        },

        orderBy: [
          {
            date:
              "asc",
          },
          {
            slot:
              "asc",
          },
        ],

        take: 200,
      });

    return NextResponse.json(
      appointments,
    );
  } catch (error) {
    console.error(
      "[APPOINTMENTS_GET]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de charger les rendez-vous",
      },
      {
        status: 500,
      },
    );
  }
}