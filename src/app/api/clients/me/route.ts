import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getSession,
  getVerifiedClerkClientIdentity,
} from "@/lib/auth";
import {
  isValidMaPhone,
  normalizePhone,
} from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                               Shared helpers                               */
/* -------------------------------------------------------------------------- */

const clientInclude = {
  vehicles: true,
  appointments: {
    include: {
      category: true,
      service: true,
      result: true,
    },
    orderBy: {
      date: "desc" as const,
    },
  },
};

async function getCurrentClient() {
  /*
   * 1. Clerk est maintenant la méthode principale
   *    d'authentification des CLIENTS.
   */
  const identity = await getVerifiedClerkClientIdentity();

  if (identity) {
    const client = await db.client.findUnique({
      where: {
        email: identity.email,
      },
      include: clientInclude,
    });

    return {
      client,
      identity,
      authType: "clerk" as const,
    };
  }

  /*
   * 2. Fallback vers l'ancien système client.
   *    Cela évite de casser d'anciennes sessions pendant la migration.
   */
  const session = await getSession();

  if (session?.role === "CLIENT") {
    const client = await db.client.findUnique({
      where: {
        id: session.sub,
      },
      include: clientInclude,
    });

    return {
      client,
      identity: null,
      authType: "legacy" as const,
    };
  }

  return {
    client: null,
    identity: null,
    authType: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

/**
 * Retourne le profil du client connecté,
 * ses véhicules et ses rendez-vous.
 */
export async function GET() {
  try {
    const auth = await getCurrentClient();

    /*
     * Aucun utilisateur authentifié.
     */
    if (!auth.authType) {
      return NextResponse.json(
        {
          error: "Non authentifié",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Utilisateur Clerk valide mais aucun profil Client
     * n'existe encore dans PostgreSQL.
     */
    if (!auth.client && auth.authType === "clerk" && auth.identity) {
      return NextResponse.json(
        {
          error: "Profil client à compléter",
          code: "CLIENT_NOT_FOUND",
          needsOnboarding: true,
          email: auth.identity.email,
          name: auth.identity.name ?? "",
        },
        {
          status: 404,
        },
      );
    }

    if (!auth.client) {
      return NextResponse.json(
        {
          error: "Profil client introuvable",
          code: "CLIENT_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(auth.client);
  } catch (error) {
    console.error("[CLIENT_ME_GET]", error);

    return NextResponse.json(
      {
        error: "Impossible de charger le profil client",
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

/**
 * Crée le profil Client PostgreSQL après authentification Clerk.
 *
 * L'adresse email vient exclusivement de Clerk.
 * Elle n'est jamais acceptée depuis le body envoyé par le navigateur.
 */
export async function POST(req: Request) {
  try {
    const identity = await getVerifiedClerkClientIdentity();

    if (!identity) {
      return NextResponse.json(
        {
          error:
            "Vous devez être connecté avec une adresse email Clerk vérifiée.",
        },
        {
          status: 401,
        },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string;
      phone?: string;
    } | null;

    if (!body) {
      return NextResponse.json(
        {
          error: "Requête invalide",
        },
        {
          status: 400,
        },
      );
    }

    const name = body.name?.trim() ?? "";
    const phone = body.phone
      ? normalizePhone(body.phone)
      : "";

    if (name.length < 3) {
      return NextResponse.json(
        {
          error: "Le nom complet est requis",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidMaPhone(phone)) {
      return NextResponse.json(
        {
          error: "Numéro de téléphone marocain invalide",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Si un profil existe déjà avec l'email Clerk,
     * on le réutilise au lieu d'en créer un deuxième.
     */
    const existingByEmail = await db.client.findUnique({
      where: {
        email: identity.email,
      },
    });

    if (existingByEmail) {
      return NextResponse.json(existingByEmail);
    }

    /*
     * Le téléphone ne doit pas appartenir à un autre client.
     */
    const existingByPhone = await db.client.findUnique({
      where: {
        phone,
      },
    });

    if (existingByPhone) {
      return NextResponse.json(
        {
          error:
            "Ce numéro de téléphone appartient déjà à un autre compte.",
        },
        {
          status: 409,
        },
      );
    }

    const client = await db.client.create({
      data: {
        name,
        phone,
        email: identity.email,
      },
    });

    return NextResponse.json(client, {
      status: 201,
    });
  } catch (error) {
    console.error("[CLIENT_ME_POST]", error);

    return NextResponse.json(
      {
        error: "Impossible de créer le profil client",
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

/**
 * Met à jour le profil du client connecté.
 * Supporte Clerk et temporairement l'ancien système client.
 */
export async function PATCH(req: Request) {
  try {
    /*
     * Clerk en priorité.
     */
    const identity = await getVerifiedClerkClientIdentity();

    let clientId: string | null = null;

    if (identity) {
      const client = await db.client.findUnique({
        where: {
          email: identity.email,
        },
      });

      if (!client) {
        return NextResponse.json(
          {
            error: "Profil client introuvable",
            code: "CLIENT_NOT_FOUND",
          },
          {
            status: 404,
          },
        );
      }

      clientId = client.id;
    } else {
      /*
       * Fallback ancien système.
       */
      const session = await getSession();

      if (!session || session.role !== "CLIENT") {
        return NextResponse.json(
          {
            error: "Non authentifié",
          },
          {
            status: 401,
          },
        );
      }

      clientId = session.sub;
    }

    const body = (await req.json().catch(() => null)) as {
      channel?: string;
      name?: string;
    } | null;

    if (!body) {
      return NextResponse.json(
        {
          error: "Requête invalide",
        },
        {
          status: 400,
        },
      );
    }

    const current = await db.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!current) {
      return NextResponse.json(
        {
          error: "Profil client introuvable",
        },
        {
          status: 404,
        },
      );
    }

    const cleanName = body.name?.trim();

    if (body.name !== undefined && (!cleanName || cleanName.length < 3)) {
      return NextResponse.json(
        {
          error: "Le nom complet est invalide",
        },
        {
          status: 400,
        },
      );
    }

    const client = await db.client.update({
      where: {
        id: clientId,
      },
      data: {
        ...(body.channel
          ? {
              channel: body.channel,
            }
          : {}),

        ...(cleanName
          ? {
              name: cleanName,
            }
          : {}),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("[CLIENT_ME_PATCH]", error);

    return NextResponse.json(
      {
        error: "Impossible de mettre à jour le profil client",
      },
      {
        status: 500,
      },
    );
  }
}