import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { normalizePhone, isValidMaPhone } from "@/lib/utils";

/**
 * Client registration: requires name, phone (+212), email, password.
 * Email AND phone are both unique. On success, creates a session.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { name, phone, email, password } = body as {
    name?: string; phone?: string; email?: string; password?: string;
  };

  if (!name || !phone || !email || !password) {
    return NextResponse.json({ error: "Tous les champs sont requis (nom, téléphone, email, mot de passe)" }, { status: 400 });
  }
  if (!isValidMaPhone(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone marocain invalide (format +212)" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = email.toLowerCase().trim();

  // Check uniqueness of both phone and email
  const existing = await db.client.findFirst({
    where: { OR: [{ phone: normalizedPhone }, { email: normalizedEmail }] },
  });
  if (existing) {
    if (existing.phone === normalizedPhone) {
      return NextResponse.json({ error: "Ce numéro de téléphone est déjà utilisé" }, { status: 409 });
    }
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const client = await db.client.create({
    data: {
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
    },
  });

  await createSession({
    sub: client.id,
    role: "CLIENT",
    name: client.name,
    email: client.email,
    phone: client.phone,
  });

  return NextResponse.json({ ok: true, redirect: "/espace-client", name: client.name }, { status: 201 });
}
