import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAppUrl, getStripe } from "@/lib/stripe";

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

  /*
   * Évite par exemple:
   * 2026-02-31 -> mars
   */
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
    /*                              Authentication                            */
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
    /*                             Required fields                            */
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
    /*                           Vehicle validation                           */
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
    /*                              Date validation                           */
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

    const now = new Date();

    const today = new Date(
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

    /*
     * Créneau aujourd'hui déjà passé.
     */
    if (
      ymdKeyLocal(
        appointmentDate,
      ) === ymdKeyLocal(now)
    ) {
      const [hours, minutes] =
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
    /*                                 Service                                */
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
    /*                                  Client                                */
    /* ---------------------------------------------------------------------- */

    let client =
      isClient
        ? await db.client.findUnique({
            where: {
              id: session.sub,
            },
          })
        : null;

    /*
     * CLIENT connecté via Clerk:
     * ses informations viennent uniquement
     * de PostgreSQL, jamais du formulaire.
     */
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
     * Permet de conserver la création
     * de rendez-vous par un admin.
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
              name: cleanName,
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
    /*                                  Promo                                 */
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
        promo.validFrom <= now &&
        (!promo.expiresAt ||
          promo.expiresAt >=
            now) &&
        (promo.maxUses ===
          null ||
          promo.usageCount <
            promo.maxUses);

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

      promoId =
        promo.id;
    }

    /* ---------------------------------------------------------------------- */
    /*                         Appointment transaction                        */
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
            /*
             * IMPORTANT:
             * Re-vérification dans la transaction.
             *
             * Cela évite que deux personnes
             * réservent le même créneau presque
             * simultanément.
             */

            const [
              capacity,
              activeCount,
              occupied,
            ] =
              await Promise.all([
                tx.dailyCapacity.findUnique(
                  {
                    where: {
                      date:
                        dayStart,
                    },
                  },
                ),

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

                tx.appointment.findFirst(
                  {
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
                  },
                ),
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
            /*                               Promo                            */
            /* -------------------------------------------------------------- */

            if (promoId) {
              const currentPromo =
                await tx.promoCode.findUnique(
                  {
                    where: {
                      id: promoId,
                    },
                  },
                );

              if (
                !currentPromo ||
                !currentPromo.active ||
                currentPromo.validFrom >
                  now ||
                (currentPromo.expiresAt &&
                  currentPromo.expiresAt <
                    now) ||
                (currentPromo.maxUses !==
                  null &&
                  currentPromo.usageCount >=
                    currentPromo.maxUses)
              ) {
                throw new Error(
                  "PROMO_UNAVAILABLE",
                );
              }

              await tx.promoCode.update({
                where: {
                  id: promoId,
                },

                data: {
                  usageCount: {
                    increment: 1,
                  },
                },
              });
            }

            /* -------------------------------------------------------------- */
            /*                         Queue number                           */
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

            /*
             * Code promo = acompte supprimé.
             */
            const depositAmountCents =
              isClient &&
              !promoId
                ? standardDepositAmountCents
                : 0;

            return tx.appointment.create(
              {
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
                    promoId
                      ? "APPROVED"
                      : "PENDING",

                  clientName:
                    client.name,

                  clientPhone:
                    client.phone,

                  vehiclePlate:
                    vehicle.plate,

                  vehicleDesc: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,

                  queueNumber:
                    countToday +
                    1,

                  totalAmountCents,

                  depositAmountCents,

                  amountPaidCents:
                    0,

                  balanceDueCents:
                    totalAmountCents,

                  paymentStatus:
                    !isClient
                      ? "NOT_REQUIRED"
                      : promoId
                        ? "WAIVED"
                        : "PENDING",

                  promoCodeId:
                    promoId,
                },

                include: {
                  category: true,
                  service: true,
                },
              },
            );
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
          "PROMO_UNAVAILABLE"
        ) {
          return NextResponse.json(
            {
              error:
                "Ce code d’exemption vient d’être épuisé",
            },
            {
              status: 409,
            },
          );
        }
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
    /*                       No Stripe payment required                       */
    /* ---------------------------------------------------------------------- */

    /*
     * Admin:
     * paiement géré à l'agence.
     *
     * Promo:
     * acompte exempté.
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
        },
        {
          status: 201,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                              Stripe Checkout                           */
    /* ---------------------------------------------------------------------- */

    try {
      const stripe =
        getStripe();

      const checkout =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            /*
             * L'email peut être nullable
             * dans certaines anciennes lignes DB.
             */
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
                    name: `Acompte 25 % — ${service.name}`,

                    description: `Rendez-vous ${code} · solde à régler à l’agence`,
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

            success_url: `${getAppUrl(
              request,
            )}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url: `${getAppUrl(
              request,
            )}/paiement/cancel?appointment=${appointment.id}`,

            /*
             * Durée du Checkout.
             */
            expires_at:
              Math.floor(
                Date.now() /
                  1000,
              ) +
              31 * 60,
          },
          {
            idempotencyKey: `appointment-${appointment.id}`,
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
       * Le Checkout n'a pas pu démarrer.
       * On libère immédiatement le créneau.
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
    } = new URL(
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

    const where: Prisma.AppointmentWhereInput =
      {};

    /* ---------------------------------------------------------------------- */
    /*                              Status filter                             */
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
    /*                               Date filter                              */
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
        gte: start,
        lte: end,
      };
    }

    /* ---------------------------------------------------------------------- */
    /*                              Search filter                             */
    /* ---------------------------------------------------------------------- */

    if (q) {
      where.OR = [
        {
          code: {
            contains: q,
          },
        },

        {
          clientName: {
            contains: q,
          },
        },

        {
          clientPhone: {
            contains: q,
          },
        },

        {
          vehiclePlate: {
            contains: q,
          },
        },
      ];
    }

    const appointments =
      await db.appointment.findMany({
        where,

        include: {
          category: true,
          service: true,
          result: true,
          payments: true,
          promoCode: true,
        },

        orderBy: [
          {
            date: "asc",
          },
          {
            slot: "asc",
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