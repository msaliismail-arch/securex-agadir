import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidMaPhone, normalizePhone } from "@/lib/utils";

export async function POST(request: Request) {
  const { name, phone, email, password } = (await request.json()) as {
    name?: string; phone?: string; email?: string; password?: string;
  };
  if (!name?.trim() || !phone || !email?.trim() || !password) {
    return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
  }
  if (!isValidMaPhone(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone marocain invalide" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.client.findFirst({
    where: { OR: [{ phone: normalizedPhone }, { email: normalizedEmail }] },
  });
  if (existing?.supabaseUserId || (existing && existing.email !== normalizedEmail)) {
    return NextResponse.json({ error: "Un compte existe déjà pour cet email ou ce téléphone" }, { status: 409 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: { data: { name: name.trim(), phone: normalizedPhone } },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    confirmationRequired: !data.session,
    email: normalizedEmail,
  }, { status: 201 });
}
