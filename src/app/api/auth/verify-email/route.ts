import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidMaPhone, normalizePhone } from "@/lib/utils";

export async function POST(request: Request) {
  const { email, token } = (await request.json()) as { email?: string; token?: string };
  if (!email || !token || !/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: "Code de vérification invalide" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: "signup" });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || "Code expiré ou incorrect" }, { status: 400 });
  }

  const metadata = data.user.user_metadata as { name?: string; phone?: string };
  const phone = metadata.phone ? normalizePhone(metadata.phone) : "";
  if (!metadata.name || !isValidMaPhone(phone)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Informations de profil incomplètes" }, { status: 400 });
  }

  const byUser = await db.client.findUnique({ where: { supabaseUserId: data.user.id } });
  const byEmail = await db.client.findUnique({ where: { email: normalizedEmail } });
  const client = byUser ?? (byEmail
    ? await db.client.update({
        where: { id: byEmail.id },
        data: { supabaseUserId: data.user.id, name: metadata.name, phone },
      })
    : await db.client.create({
        data: { supabaseUserId: data.user.id, email: normalizedEmail, name: metadata.name, phone },
      }));

  return NextResponse.json({ ok: true, name: client.name });
}
