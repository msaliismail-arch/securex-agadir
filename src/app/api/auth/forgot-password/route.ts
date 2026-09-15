import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/stripe";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo: `${getAppUrl(request)}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });
  return NextResponse.json({ ok: true });
}
