import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json([]);

  // Conversion locale s7i7a lwa9t dyal Maghreb
  const [y, m, d] = date.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59);

  try {
    // Jib ghir les sa3at li makhersin (PENDING wla APPROVED)
    const taken = await db.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: { slot: true },
    });

    // Rje3 ghir les sa3at bhal tableau: ["09:00", "10:30"]
    return NextResponse.json(taken.map(a => a.slot));
  } catch (error) {
    return NextResponse.json([]);
  }
}