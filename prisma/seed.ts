import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateQrToken } from "../src/lib/qr";

const db = new PrismaClient();

// Real admin accounts with hashed passwords (per role).
const ADMIN_PASSWORD = "Securex@2026";
const admins = [
  { email: "admin.general@securex-connect.ma", name: "Youssef El Amrani", role: "SUPER", phone: "+212661234567" },
  { email: "validation.rdv@securex-connect.ma", name: "Fatima Zahra Benali", role: "VALIDATION", phone: "+212662345678" },
  { email: "reception@securex-connect.ma", name: "Karim Idrissi", role: "RECEPTION", phone: "+212663456789" },
];

// Editable website content (Super Admin "Gestion du site").
const websiteContent: Record<string, string> = {
  "hero.badge": "Agréé Ministère du Transport",
  "hero.title": "Contrôle technique automobile agréé à Agadir",
  "hero.titleHighlight": "agréé",
  "hero.subtitle": "Sécurité, fiabilité et conformité pour tous vos véhicules. Prenez rendez-vous en ligne et recevez votre certificat officiel en 30 minutes.",
  "hero.ctaPrimary": "Prendre rendez-vous",
  "hero.ctaSecondary": "Voir les tarifs",
  "stats.controls": "15000",
  "stats.controlsSuffix": "+",
  "stats.controlsLabel": "Contrôles réalisés",
  "stats.satisfaction": "49",
  "stats.satisfactionSuffix": "/50",
  "stats.satisfactionLabel": "Satisfaction client",
  "stats.duration": "30",
  "stats.durationSuffix": " min",
  "stats.durationLabel": "Durée moyenne",
  "stats.certified": "100",
  "stats.certifiedSuffix": "%",
  "stats.certifiedLabel": "Agréé & conforme",
  "steps.title": "Comment ça marche ?",
  "steps.subtitle": "Quatre étapes pour un contrôle technique sans tracas.",
  "features.title": "Pourquoi nous choisir ?",
  "features.subtitle": "Une expérience de contrôle technique moderne, fiable et sans surprise.",
  "testimonials.title": "Ils nous font confiance",
  "contact.title": "Nous trouver à Agadir",
  "contact.subtitle": "Facile d'accès au Quartier Industriel d'Agadir.",
  "cta.title": "Prêt à passer le contrôle technique ?",
  "cta.subtitle": "Réservez votre créneau en ligne dès maintenant et évitez l'attente. Certification officielle garantie.",
};

const categories = [
  { name: "Voiture Particulière", slug: "voiture", description: "Contrôle technique pour véhicules particuliers (PV <= 3,5T).", icon: "Car", color: "blue", sort: 1 },
  { name: "Véhicule Utilitaire", slug: "utilitaire", description: "Pour utilitaires et camionnettes de moins de 3,5T.", icon: "Truck", color: "orange", sort: 2 },
  { name: "Moto & Two-Roues", slug: "moto", description: "Contrôle des motos, scooters et cyclos.", icon: "Bike", color: "purple", sort: 3 },
  { name: "Poids Lourd & Camion", slug: "poids-lourd", description: "Camions, bus et véhicules de plus de 3,5T.", icon: "Bus", color: "red", sort: 4 },
];

const servicesByCategory: Record<string, { name: string; slug: string; description: string; durationMin: number; price: number }[]> = {
  voiture: [
    { name: "Visite Technique Périodique", slug: "vt-periodique", description: "Contrôle technique réglementaire annuel.", durationMin: 30, price: 350 },
    { name: "Contre-visite", slug: "contre-visite", description: "Re-vérification après réparation.", durationMin: 20, price: 100 },
    { name: "Visite de cession", slug: "cession", description: "Contrôle lors de la vente du véhicule.", durationMin: 30, price: 400 },
  ],
  utilitaire: [
    { name: "Visite Technique Utilitaire", slug: "vt-utilitaire", description: "Contrôle pour utilitaires < 3,5T.", durationMin: 40, price: 450 },
    { name: "Contre-visite Utilitaire", slug: "cv-utilitaire", description: "Re-vérification après réparation.", durationMin: 25, price: 120 },
  ],
  moto: [
    { name: "Visite Technique Moto", slug: "vt-moto", description: "Contrôle des deux-roues motorisés.", durationMin: 20, price: 200 },
    { name: "Contre-visite Moto", slug: "cv-moto", description: "Re-vérification moto.", durationMin: 15, price: 70 },
  ],
  "poids-lourd": [
    { name: "Visite Technique Poids Lourd", slug: "vt-pl", description: "Contrôle des véhicules > 3,5T.", durationMin: 60, price: 800 },
    { name: "Visite Technique Bus", slug: "vt-bus", description: "Contrôle des autobus et cars.", durationMin: 60, price: 900 },
  ],
};

const clients = [
  { phone: "+212661112233", name: "Mehdi Tazi", email: "mehdi.tazi@gmail.com", channel: "SMS", vehicles: [{ plate: "12345-A-6", brand: "Dacia", model: "Logan", year: 2019, category: "VOITURE", fuel: "Diesel" }] },
  { phone: "+212662223344", name: "Salma Ouazzani", email: "salma.ouazzani@gmail.com", channel: "WHATSAPP", vehicles: [{ plate: "44781-B-1", brand: "Renault", model: "Clio", year: 2020, category: "VOITURE", fuel: "Essence" }] },
  { phone: "+212663334455", name: "Hicham Berrada", email: "h.berrada@gmail.com", channel: "EMAIL", vehicles: [{ plate: "7821-WW-6", brand: "Volkswagen", model: "Caddy", year: 2018, category: "UTILITAIRE", fuel: "Diesel" }] },
  { phone: "+212664445566", name: "Nadia El Fassi", email: "nadia.fassi@gmail.com", channel: "SMS", vehicles: [{ plate: "55-A-12", brand: "Yamaha", model: "YZF-R3", year: 2021, category: "MOTO", fuel: "Essence" }] },
  { phone: "+212665556677", name: "Omar Sefrioui", email: "omar.sef@gmail.com", channel: "SMS", vehicles: [{ plate: "33-C-44", brand: "Iveco", model: "Daily", year: 2017, category: "CAMION", fuel: "Diesel" }] },
];

const announcements = [
  { title: "Promo Contre-visite -50%", content: "Pour tout contrôle technique effectué ce mois, la contre-visite est à moitié prix. Offre valable jusqu'à la fin du mois.", pinned: true, visible: true, category: "PROMO" },
  { title: "Nouveau créneau samedi matin", content: "Nous ouvrons 4 créneaux supplémentaires le samedi matin de 8h à 13h pour mieux vous accueillir.", pinned: false, visible: true, category: "INFO" },
  { title: "Maintenance système le dimanche", content: "Le centre sera exceptionnellement fermé ce dimanche pour maintenance des équipements.", pinned: false, visible: true, category: "MAINTENANCE" },
];

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function main() {
  console.log("Seeding SÉCUREX CONNECT...");

  // Wipe
  await db.auditLog.deleteMany();
  await db.appointment.deleteMany();
  await db.inspectionResult.deleteMany();
  await db.service.deleteMany();
  await db.category.deleteMany();
  await db.vehicle.deleteMany();
  await db.client.deleteMany();
  await db.adminUser.deleteMany();
  await db.announcement.deleteMany();
  await db.setting.deleteMany();
  await db.otpRequest.deleteMany();
  await db.websiteContent.deleteMany();

  // Admins (with hashed passwords)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  for (const a of admins) {
    await db.adminUser.create({ data: { ...a, passwordHash } });
  }
  console.log(`  ✓ ${admins.length} admins (password: ${ADMIN_PASSWORD})`);

  // Website content (editable by Super Admin)
  for (const [k, v] of Object.entries(websiteContent)) {
    await db.websiteContent.create({ data: { id: k, value: v } });
  }
  console.log(`  ✓ ${Object.keys(websiteContent).length} website content blocks`);

  // Settings
  const settings: Record<string, string> = {
    "contact.address": "14 rue Cadi Ayad, Q.I., Agadir",
    "contact.phone": "+212 528 84 12 34",
    "contact.email": "contact@securex-connect.ma",
    "contact.facebook": "https://facebook.com/securexconnect",
    "contact.instagram": "https://instagram.com/securexconnect",
    "contact.linkedin": "https://linkedin.com/company/securexconnect",
    "contact.tiktok": "https://tiktok.com/@securexconnect",
    "hours.week": "08:00-18:00",
    "hours.sat": "08:00-13:00",
    "hours.sun": "Fermé",
    "slot.duration": "30",
  };
  for (const [k, v] of Object.entries(settings)) {
    await db.setting.create({ data: { id: k, value: v } });
  }
  console.log(`  ✓ ${Object.keys(settings).length} settings`);

  // Categories + services
  for (const c of categories) {
    const created = await db.category.create({ data: c });
    const svcs = servicesByCategory[c.slug] || [];
    for (const s of svcs) {
      await db.service.create({ data: { ...s, categoryId: created.id } });
    }
  }
  console.log(`  ✓ categories & services`);

  // Clients + vehicles
  for (const cl of clients) {
    const { vehicles, ...cdata } = cl;
    const created = await db.client.create({ data: cdata });
    for (const v of vehicles) {
      await db.vehicle.create({ data: { ...v, clientId: created.id } });
    }
  }
  console.log(`  ✓ clients & vehicles`);

  // Appointments across statuses
  const allClients = await db.client.findMany({ include: { vehicles: true } });
  const allServices = await db.service.findMany({ include: { category: true } });
  const now = new Date();

  const apptSpecs: { status: string; dayOffset: number; slot: string; idx: number; generateQr?: boolean }[] = [
    { status: "PENDING", dayOffset: 2, slot: "09:30", idx: 0 },
    { status: "PENDING", dayOffset: 3, slot: "14:00", idx: 1 },
    { status: "PENDING", dayOffset: 4, slot: "11:00", idx: 2 },
    { status: "APPROVED", dayOffset: -1, slot: "10:00", idx: 0, generateQr: true },
    { status: "APPROVED", dayOffset: -2, slot: "15:30", idx: 3, generateQr: true },
    { status: "COMPLETED", dayOffset: -7, slot: "09:00", idx: 0, generateQr: true },
    { status: "COMPLETED", dayOffset: -10, slot: "16:00", idx: 1, generateQr: true },
    { status: "REJECTED", dayOffset: -5, slot: "11:30", idx: 2 },
    { status: "CANCELLED", dayOffset: -3, slot: "14:30", idx: 4 },
    { status: "PENDING", dayOffset: 5, slot: "10:30", idx: 4 },
    { status: "APPROVED", dayOffset: 1, slot: "08:30", idx: 1, generateQr: true },
    { status: "COMPLETED", dayOffset: -14, slot: "13:00", idx: 3, generateQr: true },
  ];

  let queue = 1;
  for (const spec of apptSpecs) {
    const cl = allClients[spec.idx % allClients.length];
    const veh = cl.vehicles[0];
    const svc = allServices.find((s) => s.category.slug === veh.category.toLowerCase().replace("camion", "poids-lourd")) || allServices[0];
    const date = new Date(now);
    date.setDate(date.getDate() + spec.dayOffset);
    date.setHours(0, 0, 0, 0);

    const code = makeCode();
    const data: any = {
      code,
      clientId: cl.id,
      vehicleId: veh.id,
      categoryId: svc.category.id,
      serviceId: svc.id,
      date,
      slot: spec.slot,
      status: spec.status,
      clientName: cl.name,
      clientPhone: cl.phone,
      vehiclePlate: veh.plate,
      vehicleDesc: `${veh.brand} ${veh.model} (${veh.year})`,
      queueNumber: spec.status === "PENDING" || spec.status === "APPROVED" ? queue++ : null,
    };
    if (spec.generateQr) {
      data.qrToken = generateQrToken();
      data.qrGeneratedAt = new Date();
    }
    const appt = await db.appointment.create({ data });

    if (spec.status === "COMPLETED") {
      const pass = Math.random() > 0.2;
      await db.inspectionResult.create({
        data: {
          appointmentId: appt.id,
          overallResult: pass ? "PASS" : "FAIL",
          brakes: Math.random() > 0.15 ? "PASS" : "FAIL",
          lights: Math.random() > 0.1 ? "PASS" : "FAIL",
          tires: Math.random() > 0.2 ? "PASS" : "FAIL",
          emissions: Math.random() > 0.18 ? "PASS" : "FAIL",
          bodywork: "PASS",
          inspector: "Fatima Zahra Benali",
          notes: pass ? "Véhicule conforme aux normes." : "Défauts à corriger avant remise en circulation.",
        },
      });
    }
  }
  console.log(`  ✓ ${apptSpecs.length} appointments`);

  // Announcements
  for (const a of announcements) {
    await db.announcement.create({ data: a });
  }
  console.log(`  ✓ ${announcements.length} announcements`);

  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
