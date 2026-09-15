import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, getVerifiedClerkClientIdentity } from "@/lib/auth";
import { isValidMaPhone, normalizePhone } from "@/lib/utils";

/** Client's own profile + vehicles + appointments (for the client space). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    const identity = await getVerifiedClerkClientIdentity();
    if (identity) {
      return NextResponse.json(
        { error: "Profil client à compléter", needsOnboarding: true, email: identity.email, name: identity.name },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const client = await db.client.findUnique({
    where: { id: session.sub },
    include: {
      vehicles: true,
      appointments: {
        include: { category: true, service: true, result: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!client) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(client);
}

/** Create or attach the local CLIENT profile after Clerk authentication. */
export async function POST(req: Request) {
  const identity = await getVerifiedClerkClientIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Adresse email Clerk non vérifiée" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { name?: string; phone?: string } | null;
  const name = body?.name?.trim();
  const phone = body?.phone ? normalizePhone(body.phone) : "";
  if (!name || name.length < 3) {
    return NextResponse.json({ error: "Le nom complet est requis" }, { status: 400 });
  }
  if (!isValidMaPhone(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone marocain invalide" }, { status: 400 });
  }

  const existingByEmail = await db.client.findUnique({ where: { email: identity.email } });
  if (existingByEmail) return NextResponse.json(existingByEmail);

  const existingByPhone = await db.client.findUnique({ where: { phone } });
  if (existingByPhone) {
    return NextResponse.json(
      { error: "Ce numéro de téléphone appartient déjà à un autre compte" },
      { status: 409 }
    );
  }

  const client = await db.client.create({
    data: { name, phone, email: identity.email },
  });
  return NextResponse.json(client, { status: 201 });
}

/** Update client preferences (channel). */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const body = await req.json();
  const { channel, name } = body as { channel?: string; name?: string };
  const current = await db.client.findUnique({ where: { id: session.sub } });
  if (!current) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const client = await db.client.update({
    where: { id: session.sub },
    data: {
      ...(channel ? { channel } : {}),
      ...(name?.trim() ? { name: name.trim() } : {}),
    },
  });
  return NextResponse.json(client);
}
