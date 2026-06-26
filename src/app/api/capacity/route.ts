import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole, clientIp } from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import { DEFAULT_DAILY_CAPACITY } from "@/lib/constants";

/**
 * GET — public: returns for each day in the requested range:
 *  { date, capaciteMax, confirmedCount, isFull }
 * Used by the booking wizard to grey out full days.
 *
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = fromStr ? new Date(fromStr) : today;
  const to = toStr ? new Date(toStr) : new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // default +60 days

  // Fetch all capacities in range
  const caps = await db.dailyCapacity.findMany({
    where: { date: { gte: from, lte: to } },
  });
  const capMap = new Map(caps.map((c) => [c.date.toISOString().slice(0, 10), c.capaciteMax]));

  // Count confirmed (APPROVED) appointments per day in range
  const appts = await db.appointment.findMany({
    where: {
      date: { gte: from, lte: to },
      status: "APPROVED", // only confirmed counts toward capacity
    },
    select: { date: true },
  });
  const countMap = new Map<string, number>();
  for (const a of appts) {
    const key = a.date.toISOString().slice(0, 10);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  // Build the result array for every day in the range
  const result: { date: string; capaciteMax: number; confirmedCount: number; isFull: boolean }[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    const cap = capMap.get(key) ?? DEFAULT_DAILY_CAPACITY;
    const count = countMap.get(key) ?? 0;
    result.push({
      date: key,
      capaciteMax: cap,
      confirmedCount: count,
      isFull: count >= cap,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({ defaultCapacity: DEFAULT_DAILY_CAPACITY, days: result });
}

/**
 * PUT — RDV admin only: set the capacity for a specific date.
 * Body: { date: "YYYY-MM-DD", capaciteMax: number }
 */
export async function PUT(req: Request) {
  const guard = await requireAdminRole(["SUPER", "RDV"]);
  if (!guard.ok) return guard.res;

  const body = await req.json();
  const { date, capaciteMax } = body as { date?: string; capaciteMax?: number };

  if (!date || capaciteMax == null || capaciteMax < 1 || capaciteMax > 200) {
    return NextResponse.json({ error: "Date et capacité (1-200) requises" }, { status: 400 });
  }

  const day = new Date(date + "T00:00:00");
  const cap = await db.dailyCapacity.upsert({
    where: { date: day },
    update: { capaciteMax: Math.round(capaciteMax) },
    create: { date: day, capaciteMax: Math.round(capaciteMax) },
  });

  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "CAPACITY_SET", target: cap.id,
    details: `Capacité du ${date} définie à ${capaciteMax}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, date: cap.date, capaciteMax: cap.capaciteMax });
}

/**
 * DELETE — RDV admin only: reset capacity for a date back to default.
 * Query: ?date=YYYY-MM-DD
 */
export async function DELETE(req: Request) {
  const guard = await requireAdminRole(["SUPER", "RDV"]);
  if (!guard.ok) return guard.res;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) return NextResponse.json({ error: "Date requise" }, { status: 400 });

  const day = new Date(dateStr + "T00:00:00");
  await db.dailyCapacity.deleteMany({ where: { date: day } });

  await audit({
    adminId: guard.session.sub, adminName: guard.session.name, adminRole: guard.session.role,
    action: "CAPACITY_RESET", details: `Capacité du ${dateStr} réinitialisée (défaut ${DEFAULT_DAILY_CAPACITY})`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
