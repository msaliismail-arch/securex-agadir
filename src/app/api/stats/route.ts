import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminRole } from "@/lib/api-auth";

export async function GET() {
  const guard = await requireAdminRole(["SUPER", "VALIDATION", "RECEPTION"]);
  if (!guard.ok) return guard.res;

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);

  const [
    total, pending, approved, rejected, completed, cancelled,
    todayAppts, todayCheckins, revenue, announcements, clients, vehicles,
  ] = await Promise.all([
    db.appointment.count(),
    db.appointment.count({ where: { status: "PENDING" } }),
    db.appointment.count({ where: { status: "APPROVED" } }),
    db.appointment.count({ where: { status: "REJECTED" } }),
    db.appointment.count({ where: { status: "COMPLETED" } }),
    db.appointment.count({ where: { status: "CANCELLED" } }),
    db.appointment.count({ where: { date: { gte: startToday, lte: endToday } } }),
    db.auditLog.count({ where: { action: "CHECKIN_SUCCESS", createdAt: { gte: startToday, lte: endToday } } }),
    db.appointment.findMany({ where: { status: "COMPLETED" }, include: { service: true } })
      .then((done) => done.reduce((sum, a) => sum + (a.service?.price || 0), 0)),
    db.announcement.count(),
    db.client.count(),
    db.vehicle.count(),
  ]);

  // 7-day trend
  const trend: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const e = new Date(d); e.setHours(23, 59, 59, 999);
    const count = await db.appointment.count({ where: { date: { gte: d, lte: e } } });
    trend.push({ day: d.toLocaleDateString("fr-FR", { weekday: "short" }), count });
  }

  // Category distribution
  const cats = await db.category.findMany({ include: { appointments: true } });
  const byCategory = cats.map((c) => ({ name: c.name, color: c.color, count: c.appointments.length }));

  // Status distribution
  const byStatus = [
    { name: "En attente", value: pending, color: "orange" },
    { name: "Validé", value: approved, color: "green" },
    { name: "Terminé", value: completed, color: "purple" },
    { name: "Rejeté", value: rejected, color: "red" },
    { name: "Annulé", value: cancelled, color: "gray" },
  ];

  return NextResponse.json({
    total, pending, approved, rejected, completed, cancelled,
    todayAppts, todayCheckins,
    revenue,
    announcements, clients, vehicles,
    trend, byCategory, byStatus,
  });
}
