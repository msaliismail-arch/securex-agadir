import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, createSession } from "@/lib/auth";
import { generateCode, normalizePhone, isValidMaPhone } from "@/lib/utils";

/** Public booking: create appointment + auto-register client/vehicle. */
export async function POST(req: Request) {
  const body = await req.json();
  const {
    clientName, clientPhone, clientEmail,
    vehiclePlate, vehicleBrand, vehicleModel, vehicleYear, vehicleCategory,
    categoryId, serviceId, date, slot,
    channel,
  } = body;

  // Validation
  if (!clientName || !clientPhone || !vehiclePlate || !categoryId || !serviceId || !date || !slot) {
    return NextResponse.json({ error: "Tous les champs requis doivent être renseignés" }, { status: 400 });
  }
  if (!isValidMaPhone(clientPhone)) {
    return NextResponse.json({ error: "Numéro de téléphone marocain invalide (format +212)" }, { status: 400 });
  }
  const phone = normalizePhone(clientPhone);

  // Ensure code is unique
  let code = generateCode();
  let tries = 0;
  while (await db.appointment.findUnique({ where: { code } }) && tries < 10) {
    code = generateCode();
    tries++;
  }

  const apptDate = new Date(date);

  // Upsert client
  let client = await db.client.findUnique({ where: { phone } });
  if (!client) {
    client = await db.client.create({
      data: { phone, name: clientName, email: clientEmail || null, channel: channel || "SMS" },
    });
  } else {
    client = await db.client.update({
      where: { id: client.id },
      data: { name: clientName, email: clientEmail || client.email, channel: channel || client.channel },
    });
  }

  // Upsert vehicle
  let vehicle = await db.vehicle.findFirst({ where: { plate: vehiclePlate.toUpperCase() } });
  if (!vehicle) {
    vehicle = await db.vehicle.create({
      data: {
        clientId: client.id,
        plate: vehiclePlate.toUpperCase(),
        brand: vehicleBrand || "—",
        model: vehicleModel || "—",
        year: vehicleYear ? Number(vehicleYear) : new Date().getFullYear(),
        category: vehicleCategory || "VOITURE",
      },
    });
  }

  // queue number for the day
  const dayStart = new Date(apptDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(apptDate); dayEnd.setHours(23, 59, 59, 999);
  const countToday = await db.appointment.count({ where: { date: { gte: dayStart, lte: dayEnd } } });

  const appt = await db.appointment.create({
    data: {
      code,
      clientId: client.id,
      vehicleId: vehicle.id,
      categoryId,
      serviceId,
      date: apptDate,
      slot,
      status: "PENDING",
      clientName: client.name,
      clientPhone: client.phone,
      vehiclePlate: vehicle.plate,
      vehicleDesc: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
      queueNumber: countToday + 1,
    },
    include: { category: true, service: true },
  });

  return NextResponse.json(appt, { status: 201 });
}

/** Admin list with filters. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.role === "CLIENT") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const q = searchParams.get("q");

  const where: any = {};
  if (status) where.status = status;
  if (date) {
    const d = new Date(date);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  if (q) {
    where.OR = [
      { code: { contains: q } },
      { clientName: { contains: q } },
      { clientPhone: { contains: q } },
      { vehiclePlate: { contains: q } },
    ];
  }

  const appts = await db.appointment.findMany({
    where,
    include: { category: true, service: true, result: true },
    orderBy: [{ date: "asc" }, { slot: "asc" }],
    take: 200,
  });
  return NextResponse.json(appts);
}
