import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { generateCode, normalizePhone, isValidMaPhone } from "@/lib/utils";
import { DEFAULT_DAILY_CAPACITY } from "@/lib/constants";

/** Build a local YYYY-MM-DD key (no UTC shift) for date comparison. */
function ymdKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Public booking: create appointment + register/login client with email+password. */
export async function POST(req: Request) {
  const body = await req.json();
  const {
    clientName, clientPhone, clientEmail, clientPassword,
    vehiclePlate, vehicleBrand, vehicleModel, vehicleYear, vehicleCategory,
    categoryId, serviceId, date, slot,
    channel,
  } = body;

  // Validation — phone (+212) AND email AND password all required
  if (!clientName || !clientPhone || !clientEmail || !clientPassword || !vehiclePlate || !categoryId || !serviceId || !date || !slot) {
    return NextResponse.json({ error: "Tous les champs requis doivent être renseignés (nom, téléphone, email, mot de passe)" }, { status: 400 });
  }
  if (!isValidMaPhone(clientPhone)) {
    return NextResponse.json({ error: "Numéro de téléphone marocain invalide (format +212)" }, { status: 400 });
  }
  if (clientPassword.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
  }
  const phone = normalizePhone(clientPhone);
  const email = clientEmail.toLowerCase().trim();

  // === RULE 3: Block past time slots (same day only) ===
  // The client sends a local YYYY-MM-DD string (no timezone shift). Reconstruct
  // a local Date so the comparison with "today" is correct regardless of the
  // server's timezone.
  const apptDate = new Date(date + "T00:00:00");
  const now = new Date();
  const isToday = ymdKeyLocal(apptDate) === ymdKeyLocal(now);
  if (isToday) {
    const [slotH, slotM] = slot.split(":").map(Number);
    const slotMinutes = slotH * 60 + slotM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (slotMinutes <= nowMinutes) {
      return NextResponse.json({ error: "Ce créneau horaire est déjà passé. Veuillez choisir un créneau ultérieur." }, { status: 400 });
    }
  }
  // Block past dates entirely
  if (apptDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return NextResponse.json({ error: "Cette date est passée. Veuillez choisir une date future." }, { status: 400 });
  }

  // === RULE 2: Capacity check — only CONFIRMED (APPROVED) appointments count ===
  const dayStart = new Date(apptDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(apptDate); dayEnd.setHours(23, 59, 59, 999);
  const confirmedCount = await db.appointment.count({
    where: { date: { gte: dayStart, lte: dayEnd }, status: "APPROVED" },
  });
  const capRecord = await db.dailyCapacity.findUnique({ where: { date: dayStart } });
  const capaciteMax = capRecord?.capaciteMax ?? DEFAULT_DAILY_CAPACITY;
  if (confirmedCount >= capaciteMax) {
    return NextResponse.json({
      error: `Ce jour est complet (${confirmedCount}/${capaciteMax} rendez-vous confirmés). Veuillez choisir une autre date.`,
    }, { status: 400 });
  }

  // Ensure code is unique
  let code = generateCode();
  let tries = 0;
  while (await db.appointment.findUnique({ where: { code } }) && tries < 10) {
    code = generateCode();
    tries++;
  }

  // Upsert client by phone OR email — if new, create with email+password
  let client = await db.client.findFirst({ where: { OR: [{ phone }, { email }] } });
  if (!client) {
    client = await db.client.create({
      data: {
        phone, name: clientName, email,
        passwordHash: await hashPassword(clientPassword),
        channel: channel || "SMS",
      },
    });
  } else {
    // Existing client — update info but keep existing password hash
    client = await db.client.update({
      where: { id: client.id },
      data: { name: clientName, phone, email, channel: channel || client.channel },
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

  // queue number for the day (dayStart/dayEnd already computed above for capacity check)
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
