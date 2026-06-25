import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone, isValidMaPhone } from "@/lib/utils";

/** Client login: validate phone, issue OTP. */
export async function POST(req: Request) {
  const body = await req.json();
  const { phone } = body as { phone?: string };

  if (!phone || !isValidMaPhone(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone marocain invalide" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  const client = await db.client.findUnique({ where: { phone: normalized } });
  if (!client) {
    return NextResponse.json({ error: "Aucun compte client trouvé pour ce numéro. Prenez d'abord un rendez-vous." }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.otpRequest.deleteMany({ where: { key: normalized } });
  await db.otpRequest.create({ data: { key: normalized, code: "123456", expiresAt } });

  return NextResponse.json({ ok: true, name: client.name, demoOtp: "123456" });
}
