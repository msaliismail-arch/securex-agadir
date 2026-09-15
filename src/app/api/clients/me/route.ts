import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Client's own profile + vehicles + appointments (for the client space). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
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

/** Update client preferences (channel). */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const body = await req.json();
  const { channel, email, name } = body as { channel?: string; email?: string; name?: string };
  const current = await db.client.findUnique({ where: { id: session.sub } });
  if (!current) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let emailConfirmationRequired = false;
  if (email && email.toLowerCase().trim() !== current.email) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ email: email.toLowerCase().trim() });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    emailConfirmationRequired = true;
  }
  const client = await db.client.update({
    where: { id: session.sub },
    data: {
      ...(channel ? { channel } : {}),
      ...(name?.trim() ? { name: name.trim() } : {}),
    },
  });
  return NextResponse.json({ ...client, emailConfirmationRequired });
}
