import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole } from "@/lib/api-auth";

export async function GET(req: Request) {
  const guard = await requireAdminRole(["SUPER", "VALIDATION"]);
  if (!guard.ok) return guard.res;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const where = q
    ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] }
    : undefined;
  const clients = await db.client.findMany({
    where,
    include: { vehicles: true, _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(clients);
}
