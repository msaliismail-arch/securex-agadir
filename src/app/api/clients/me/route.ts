import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Client's own profile + vehicles + appointments (for the client space). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const client = await db.client.findUnique({
    where: { phone: session.phone! },
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
  const { channel, email, name } = body;
  const client = await db.client.update({
    where: { phone: session.phone! },
    data: { channel, email, name },
  });
  return NextResponse.json(client);
}
