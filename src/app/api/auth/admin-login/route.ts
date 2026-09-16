import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  verifyPassword,
  createSession,
} from "@/lib/auth";

import {
  ADMIN_ROLES,
  type AdminRole,
} from "@/lib/constants";

import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/api-auth";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function isAdminRole(
  value: string,
): value is AdminRole {
  return (
    value === "SUPER" ||
    value === "RDV" ||
    value === "RECEPTION"
  );
}

/* -------------------------------------------------------------------------- */
/*                               POST /login                                  */
/* -------------------------------------------------------------------------- */

/**
 * Admin login:
 *
 * - username + password
 * - password vérifié avec bcrypt
 * - rôle chargé depuis PostgreSQL
 * - session JWT admin créée via lib/auth.ts
 *
 * IMPORTANT:
 * Clerk n'est PAS utilisé pour les admins.
 */
export async function POST(
  request: Request,
) {
  try {
    let body: unknown;

    try {
      body =
        await request.json();
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

    if (
      !body ||
      typeof body !== "object"
    ) {
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
      username,
      password,
    } = body as {
      username?: unknown;
      password?: unknown;
    };

    if (
      typeof username !==
        "string" ||
      typeof password !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Identifiant et mot de passe requis",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedUsername =
      username
        .trim()
        .toLowerCase();

    /*
     * Pas de trim() sur le mot de passe:
     * les espaces peuvent faire partie
     * d'un vrai mot de passe.
     */
    if (
      normalizedUsername.length ===
        0 ||
      password.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Identifiant et mot de passe requis",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Protection simple contre
     * des entrées anormalement longues.
     */
    if (
      normalizedUsername.length >
        100 ||
      password.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "Identifiants incorrects",
        },
        {
          status: 401,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                              Find admin                                */
    /* ---------------------------------------------------------------------- */

    const admin =
      await db.adminUser.findFirst({
        where: {
          username:
            normalizedUsername,

          active:
            true,
        },
      });

    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Identifiants incorrects",
        },
        {
          status: 401,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                           Validate DB role                             */
    /* ---------------------------------------------------------------------- */

    if (
      !isAdminRole(
        admin.role,
      )
    ) {
      console.error(
        "[ADMIN_LOGIN_INVALID_ROLE]",
        {
          adminId:
            admin.id,

          role:
            admin.role,
        },
      );

      return NextResponse.json(
        {
          error:
            "Compte administrateur invalide",
        },
        {
          status: 403,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                           Verify password                              */
    /* ---------------------------------------------------------------------- */

    const passwordValid =
      await verifyPassword(
        password,
        admin.passwordHash,
      );

    if (
      !passwordValid
    ) {
      try {
        await audit({
          adminId:
            admin.id,

          adminName:
            admin.name,

          adminRole:
            admin.role,

          action:
            "ADMIN_LOGIN_FAILED",

          target:
            admin.id,

          details:
            "Mot de passe incorrect",

          ipAddress:
            clientIp(
              request,
            ),
        });
      } catch (
        auditError
      ) {
        console.error(
          "[ADMIN_LOGIN_AUDIT_FAILED]",
          auditError,
        );
      }

      return NextResponse.json(
        {
          error:
            "Identifiants incorrects",
        },
        {
          status: 401,
        },
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                         Create admin session                            */
    /* ---------------------------------------------------------------------- */

    await createSession({
      sub:
        admin.id,

      role:
        admin.role,

      name:
        admin.name,

      firstName:
        admin.firstName,

      lastName:
        admin.lastName,

      email:
        admin.email,

      username:
        admin.username,
    });

    /* ---------------------------------------------------------------------- */
    /*                                  Audit                                 */
    /* ---------------------------------------------------------------------- */

    try {
      await audit({
        adminId:
          admin.id,

        adminName:
          admin.name,

        adminRole:
          admin.role,

        action:
          "ADMIN_LOGIN",

        target:
          admin.id,

        details:
          `Connexion ${ADMIN_ROLES[admin.role].label}`,

        ipAddress:
          clientIp(
            request,
          ),
      });
    } catch (
      auditError
    ) {
      /*
       * Une panne du journal d'audit
       * ne doit pas casser une connexion
       * déjà authentifiée correctement.
       */
      console.error(
        "[ADMIN_LOGIN_AUDIT]",
        auditError,
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                                Success                                 */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        ok:
          true,

        redirect:
          ADMIN_ROLES[
            admin.role
          ].route,

        role:
          admin.role,

        name:
          admin.name,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_LOGIN]",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de vous connecter pour le moment",
      },
      {
        status: 500,
      },
    );
  }
}