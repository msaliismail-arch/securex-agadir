import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { generateCode, normalizePhone, isValidMaPhone } from "@/lib/utils";
import { DEFAULT_DAILY_CAPACITY } from "@/lib/constants";

function ymdKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function uniqueAppointmentCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    if (!(await db.appointment.findUnique({ where: { code } }))) return code;
  }
  throw new Error("Impossible de générer une référence unique");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Connectez-vous avant de réserver" }, { status: 401 });

  const body = await request.json();
  const {
    clientName, clientPhone, clientEmail,
    vehiclePlate, vehicleBrand, vehicleModel, vehicleYear, vehicleCategory,
    categoryId, serviceId, date, slot, channel, promoCode,
  } = body as Record<string, string | undefined>;

  if (!vehiclePlate || !categoryId || !serviceId || !date || !slot) {
    return NextResponse.json({ error: "Tous les champs du véhicule et du rendez-vous sont requis" }, { status: 400 });
  }

  const appointmentDate = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (appointmentDate < today) {
    return NextResponse.json({ error: "Cette date est passée" }, { status: 400 });
  }
  if (ymdKeyLocal(appointmentDate) === ymdKeyLocal(now)) {
    const [hours, minutes] = slot.split(":").map(Number);
    if (hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes()) {
      return NextResponse.json({ error: "Ce créneau horaire est déjà passé" }, { status: 400 });
    }
  }

  const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);
  const [confirmedCount, capacity, occupied, service] = await Promise.all([
    db.appointment.count({ where: { date: { gte: dayStart, lte: dayEnd }, status: "APPROVED" } }),
    db.dailyCapacity.findUnique({ where: { date: dayStart } }),
    db.appointment.findFirst({
      where: { date: { gte: dayStart, lte: dayEnd }, slot, status: { in: ["PENDING", "APPROVED"] } },
    }),
    db.service.findFirst({ where: { id: serviceId, categoryId, active: true }, include: { category: true } }),
  ]);
  if (confirmedCount >= (capacity?.capaciteMax ?? DEFAULT_DAILY_CAPACITY)) {
    return NextResponse.json({ error: "Cette journée est complète" }, { status: 409 });
  }
  if (occupied) return NextResponse.json({ error: "Ce créneau vient d’être réservé" }, { status: 409 });
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 404 });

  const isClient = session.role === "CLIENT";
  let client = isClient ? await db.client.findUnique({ where: { id: session.sub } }) : null;
  if (!client) {
    if (isClient) return NextResponse.json({ error: "Profil client introuvable" }, { status: 404 });
    if (!clientName || !clientPhone || !clientEmail || !isValidMaPhone(clientPhone)) {
      return NextResponse.json({ error: "Nom, email et téléphone client valides requis" }, { status: 400 });
    }
    const phone = normalizePhone(clientPhone);
    const email = clientEmail.toLowerCase().trim();
    client = await db.client.findFirst({ where: { OR: [{ phone }, { email }] } });
    client ??= await db.client.create({ data: { name: clientName.trim(), phone, email, channel: channel || "SMS" } });
  }

  const plate = vehiclePlate.trim().toUpperCase();
  let vehicle = await db.vehicle.findFirst({ where: { plate } });
  if (vehicle && vehicle.clientId !== client.id) {
    return NextResponse.json({ error: "Cette immatriculation appartient à un autre compte" }, { status: 409 });
  }
  vehicle ??= await db.vehicle.create({
    data: {
      clientId: client.id,
      plate,
      brand: vehicleBrand?.trim() || "—",
      model: vehicleModel?.trim() || "—",
      year: vehicleYear ? Number(vehicleYear) : new Date().getFullYear(),
      category: vehicleCategory || service.category.slug.toUpperCase(),
    },
  });

  const totalAmountCents = Math.round(service.price * 100);
  const depositAmountCents = Math.round(totalAmountCents * 0.25);
  const normalizedPromo = promoCode?.trim().toUpperCase() || null;
  const code = await uniqueAppointmentCode();
  const countToday = await db.appointment.count({ where: { date: { gte: dayStart, lte: dayEnd } } });

  let promoId: string | null = null;
  if (isClient && normalizedPromo) {
    const promo = await db.promoCode.findUnique({ where: { code: normalizedPromo } });
    const valid = promo && promo.active && promo.validFrom <= now &&
      (!promo.expiresAt || promo.expiresAt >= now) &&
      (promo.maxUses === null || promo.usageCount < promo.maxUses);
    if (!valid) return NextResponse.json({ error: "Code d’exemption invalide, expiré ou épuisé" }, { status: 400 });
    promoId = promo.id;
  }

  let appointment: Prisma.AppointmentGetPayload<{ include: { category: true; service: true } }>;
  try {
    appointment = await db.$transaction(async (tx) => {
      if (promoId) {
        const currentPromo = await tx.promoCode.findUnique({ where: { id: promoId } });
        if (!currentPromo || !currentPromo.active || currentPromo.validFrom > now ||
            (currentPromo.expiresAt && currentPromo.expiresAt < now) ||
            (currentPromo.maxUses !== null && currentPromo.usageCount >= currentPromo.maxUses)) {
          throw new Error("PROMO_UNAVAILABLE");
        }
        await tx.promoCode.update({ where: { id: promoId }, data: { usageCount: { increment: 1 } } });
      }

      return tx.appointment.create({
        data: {
          code,
          clientId: client.id,
          vehicleId: vehicle.id,
          categoryId,
          serviceId,
          date: appointmentDate,
          slot,
          status: promoId ? "APPROVED" : "PENDING",
          clientName: client.name,
          clientPhone: client.phone,
          vehiclePlate: vehicle.plate,
          vehicleDesc: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
          queueNumber: countToday + 1,
          totalAmountCents,
          depositAmountCents: isClient ? depositAmountCents : 0,
          amountPaidCents: 0,
          balanceDueCents: totalAmountCents,
          paymentStatus: !isClient ? "NOT_REQUIRED" : promoId ? "WAIVED" : "PENDING",
          promoCodeId: promoId,
        },
        include: { category: true, service: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch {
    return NextResponse.json({ error: promoId ? "Ce code d’exemption vient d’être épuisé" : "Le rendez-vous n’a pas pu être créé" }, { status: 409 });
  }

  if (!isClient || promoId) {
    return NextResponse.json({ ...appointment, confirmed: Boolean(promoId) }, { status: 201 });
  }

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: client.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "mad",
          unit_amount: depositAmountCents,
          product_data: {
            name: `Acompte 25 % — ${service.name}`,
            description: `Rendez-vous ${code} · solde à régler à l’agence`,
          },
        },
      }],
      metadata: { appointmentId: appointment.id, clientId: client.id },
      payment_intent_data: { metadata: { appointmentId: appointment.id, clientId: client.id } },
      success_url: `${getAppUrl(request)}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl(request)}/paiement/cancel?appointment=${appointment.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    }, { idempotencyKey: `appointment-${appointment.id}` });
    if (!checkout.url) throw new Error("URL Checkout absente");

    await db.payment.create({
      data: {
        appointmentId: appointment.id,
        stripeCheckoutSessionId: checkout.id,
        amountCents: depositAmountCents,
        currency: "mad",
      },
    });
    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl: checkout.url }, { status: 201 });
  } catch {
    await db.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Impossible de démarrer le paiement. Aucun débit n’a été effectué." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: session ? "Accès refusé" : "Non authentifié" }, { status: session ? 403 : 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const q = searchParams.get("q");
  const where: Prisma.AppointmentWhereInput = {};
  if (status) where.status = status;
  if (date) {
    const d = new Date(date); const start = new Date(d); const end = new Date(d);
    start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  if (q) where.OR = [
    { code: { contains: q } }, { clientName: { contains: q } },
    { clientPhone: { contains: q } }, { vehiclePlate: { contains: q } },
  ];
  const appointments = await db.appointment.findMany({
    where,
    include: { category: true, service: true, result: true, payments: true, promoCode: true },
    orderBy: [{ date: "asc" }, { slot: "asc" }],
    take: 200,
  });
  return NextResponse.json(appointments);
}
