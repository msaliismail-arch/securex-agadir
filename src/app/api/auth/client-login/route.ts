import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error || !data.user?.email_confirmed_at) {
    return NextResponse.json({ error: error?.message || "Adresse email non confirmée" }, { status: 401 });
  }

  const metadata = data.user.user_metadata as { name?: string; phone?: string };
  let client = await db.client.findUnique({ where: { supabaseUserId: data.user.id } });
  if (!client) {
    const existing = await db.client.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      client = await db.client.update({ where: { id: existing.id }, data: { supabaseUserId: data.user.id } });
    } else if (metadata.name && metadata.phone) {
      client = await db.client.create({
        data: { supabaseUserId: data.user.id, email: normalizedEmail, name: metadata.name, phone: metadata.phone },
      });
    }
  }
  if (!client) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Profil client incomplet" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, redirect: "/espace-client", name: client.name });
}
