import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

/**
 * Client login: email + password (bcrypt-verified).
 * Replaces the old phone + OTP flow. Session TTL: 3h.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const client = await db.client.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!client) {
    return NextResponse.json({ error: "Aucun compte trouvé pour cet email" }, { status: 404 });
  }

  const ok = await verifyPassword(password, client.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await createSession({
    sub: client.id,
    role: "CLIENT",
    name: client.name,
    email: client.email,
    phone: client.phone,
  });

  return NextResponse.json({ ok: true, redirect: "/espace-client", name: client.name });
}
