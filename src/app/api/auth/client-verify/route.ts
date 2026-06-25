import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();
  const { phone, code } = body as { phone?: string; code?: string };

  if (!phone || !code) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  const otp = await db.otpRequest.findFirst({
    where: { key: normalized, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.code !== code || otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code OTP invalide ou expiré" }, { status: 400 });
  }

  const client = await db.client.findUnique({ where: { phone: normalized } });
  if (!client) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  await db.otpRequest.update({ where: { id: otp.id }, data: { consumed: true } });

  await createSession({
    sub: client.id,
    role: "CLIENT",
    name: client.name,
    phone: client.phone,
    email: client.email || undefined,
  });

  return NextResponse.json({ ok: true, redirect: "/espace-client" });
}
