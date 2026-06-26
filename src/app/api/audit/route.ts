import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole } from "@/lib/api-auth";

export async function GET(req: Request) {
  const guard = await requireAdminRole(["SUPER"]);
  if (!guard.ok) return guard.res;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 100);
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
  });
  return NextResponse.json(logs);
}
