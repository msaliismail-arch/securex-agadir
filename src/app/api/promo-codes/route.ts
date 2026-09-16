import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  requireAdminRole,
  clientIp,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface PromoCreateBody {
  code?: string;
  description?: string;
  maxUses?: number | null;
  expiresAt?: string | null;
}

interface PromoUpdateBody {
  id?: string;
  active?: boolean;
  description?: string;
  maxUses?: number | null;
  expiresAt?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function generateCode(): string {
  return `SX-${randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

function cleanPromoCode(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

function parseMaxUses(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    throw new Error(
      "INVALID_MAX_USES",
    );
  }

  return Math.floor(parsed);
}

function parseExpiration(
  value: unknown,
): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "INVALID_EXPIRATION",
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "INVALID_EXPIRATION",
    );
  }

  return date;
}

function isUniqueConflict(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET() {
  const guard =
    await requireAdminRole([
      "SUPER",
    ]);

  if (!guard.ok) {
    return guard.res;
  }

  try {
    const promoCodes =
      await db.promoCode.findMany({
        orderBy: {
          createdAt:
            "desc",
        },
      });

    return NextResponse.json(
      promoCodes,
    );
  } catch (error) {
    console.error(
      "[PROMO_CODES_GET]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de charger les codes",
      },
      {
        status: 500,
      },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: Request,
) {
  const guard =
    await requireAdminRole([
      "SUPER",
    ]);

  if (!guard.ok) {
    return guard.res;
  }

  let body:
    | PromoCreateBody
    | null = null;

  try {
    body =
      (await request.json()) as PromoCreateBody;
  } catch {
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

  try {
    const description =
      body.description
        ?.trim() ||
      null;

    const maxUses =
      parseMaxUses(
        body.maxUses,
      );

    const expiresAt =
      parseExpiration(
        body.expiresAt,
      );

    if (
      expiresAt &&
      expiresAt <=
        new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "La date d’expiration doit être dans le futur",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Si un code manuel est envoyé,
     * on le respecte.
     *
     * Sinon le serveur génère automatiquement
     * un code sécurisé et unique.
     */
    const customCode =
      body.code
        ? cleanPromoCode(
            body.code,
          )
        : null;

    if (
      customCode &&
      (
        customCode.length <
          4 ||
        customCode.length >
          32
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Code invalide",
        },
        {
          status: 400,
        },
      );
    }

    let promo:
      | Awaited<
          ReturnType<
            typeof db.promoCode.create
          >
        >
      | null = null;

    /*
     * Code manuel:
     * une seule tentative.
     *
     * Code automatique:
     * plusieurs tentatives en cas
     * de collision extrêmement rare.
     */
    const maxAttempts =
      customCode
        ? 1
        : 12;

    for (
      let attempt = 0;
      attempt <
      maxAttempts;
      attempt++
    ) {
      const code =
        customCode ??
        generateCode();

      try {
        promo =
          await db.promoCode.create({
            data: {
              code,

              description,

              maxUses,

              expiresAt,

              createdById:
                guard.session
                  .sub,

              createdByName:
                guard.session
                  .name,
            },
          });

        break;
      } catch (error) {
        if (
          isUniqueConflict(
            error,
          )
        ) {
          /*
           * Code manuel déjà existant.
           */
          if (customCode) {
            return NextResponse.json(
              {
                error:
                  "Ce code existe déjà",
              },
              {
                status: 409,
              },
            );
          }

          /*
           * Code automatique:
           * on génère simplement
           * un autre code.
           */
          continue;
        }

        throw error;
      }
    }

    if (!promo) {
      return NextResponse.json(
        {
          error:
            "Impossible de générer un code unique. Réessayez.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * L'audit ne doit jamais faire échouer
     * la création du code si le code est
     * déjà correctement enregistré en DB.
     */
    try {
      await audit({
        adminId:
          guard.session.sub,

        adminName:
          guard.session.name,

        adminRole:
          guard.session.role,

        action:
          "PROMO_CODE_CREATE",

        target:
          promo.id,

        details:
          `Code d’exemption ${promo.code} créé`,

        ipAddress:
          clientIp(
            request,
          ),
      });
    } catch (auditError) {
      console.error(
        "[PROMO_CODE_AUDIT_CREATE]",
        auditError,
      );
    }

    return NextResponse.json(
      promo,
      {
        status: 201,
      },
    );
  } catch (error) {
    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "INVALID_MAX_USES"
      ) {
        return NextResponse.json(
          {
            error:
              "Nombre d’utilisations invalide",
          },
          {
            status: 400,
          },
        );
      }

      if (
        error.message ===
        "INVALID_EXPIRATION"
      ) {
        return NextResponse.json(
          {
            error:
              "Date d’expiration invalide",
          },
          {
            status: 400,
          },
        );
      }
    }

    console.error(
      "[PROMO_CODE_CREATE]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de créer le code pour le moment",
      },
      {
        status: 500,
      },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                   PATCH                                    */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  request: Request,
) {
  const guard =
    await requireAdminRole([
      "SUPER",
    ]);

  if (!guard.ok) {
    return guard.res;
  }

  let body:
    | PromoUpdateBody
    | null = null;

  try {
    body =
      (await request.json()) as PromoUpdateBody;
  } catch {
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

  if (!body.id) {
    return NextResponse.json(
      {
        error:
          "Identifiant requis",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const data:
      Prisma.PromoCodeUpdateInput =
      {};

    if (
      typeof body.active ===
      "boolean"
    ) {
      data.active =
        body.active;
    }

    if (
      body.description !==
      undefined
    ) {
      data.description =
        body.description
          ?.trim() ||
        null;
    }

    if (
      body.maxUses !==
      undefined
    ) {
      data.maxUses =
        parseMaxUses(
          body.maxUses,
        );
    }

    if (
      body.expiresAt !==
      undefined
    ) {
      const expiresAt =
        parseExpiration(
          body.expiresAt,
        );

      if (
        expiresAt &&
        expiresAt <=
          new Date()
      ) {
        return NextResponse.json(
          {
            error:
              "La date d’expiration doit être dans le futur",
          },
          {
            status: 400,
          },
        );
      }

      data.expiresAt =
        expiresAt;
    }

    const promo =
      await db.promoCode.update({
        where: {
          id:
            body.id,
        },

        data,
      });

    try {
      await audit({
        adminId:
          guard.session.sub,

        adminName:
          guard.session.name,

        adminRole:
          guard.session.role,

        action:
          "PROMO_CODE_UPDATE",

        target:
          promo.id,

        details:
          `Code ${promo.code} mis à jour`,

        ipAddress:
          clientIp(
            request,
          ),
      });
    } catch (auditError) {
      console.error(
        "[PROMO_CODE_AUDIT_UPDATE]",
        auditError,
      );
    }

    return NextResponse.json(
      promo,
    );
  } catch (error) {
    if (
      error instanceof Error
    ) {
      if (
        error.message ===
        "INVALID_MAX_USES"
      ) {
        return NextResponse.json(
          {
            error:
              "Nombre d’utilisations invalide",
          },
          {
            status: 400,
          },
        );
      }

      if (
        error.message ===
        "INVALID_EXPIRATION"
      ) {
        return NextResponse.json(
          {
            error:
              "Date d’expiration invalide",
          },
          {
            status: 400,
          },
        );
      }
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2025"
    ) {
      return NextResponse.json(
        {
          error:
            "Code introuvable",
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "[PROMO_CODE_UPDATE]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de modifier le code",
      },
      {
        status: 500,
      },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  request: Request,
) {
  const guard =
    await requireAdminRole([
      "SUPER",
    ]);

  if (!guard.ok) {
    return guard.res;
  }

  const id =
    new URL(
      request.url,
    ).searchParams.get(
      "id",
    );

  if (!id) {
    return NextResponse.json(
      {
        error:
          "Identifiant requis",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const promo =
      await db.promoCode.findUnique({
        where: {
          id,
        },
      });

    if (!promo) {
      return NextResponse.json(
        {
          error:
            "Code introuvable",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * On ne supprime pas physiquement le code.
     * On le désactive afin de conserver
     * l'historique des rendez-vous.
     */
    await db.promoCode.update({
      where: {
        id,
      },

      data: {
        active:
          false,
      },
    });

    try {
      await audit({
        adminId:
          guard.session.sub,

        adminName:
          guard.session.name,

        adminRole:
          guard.session.role,

        action:
          "PROMO_CODE_DISABLE",

        target:
          id,

        details:
          `Code ${promo.code} désactivé`,

        ipAddress:
          clientIp(
            request,
          ),
      });
    } catch (auditError) {
      console.error(
        "[PROMO_CODE_AUDIT_DISABLE]",
        auditError,
      );
    }

    return NextResponse.json({
      ok:
        true,
    });
  } catch (error) {
    console.error(
      "[PROMO_CODE_DISABLE]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de désactiver le code",
      },
      {
        status: 500,
      },
    );
  }
}