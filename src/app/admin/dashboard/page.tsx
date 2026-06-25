"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  Users,
  Megaphone,
  ScrollText,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  COLOR_MAP,
  STATUS_META,
  type AppointmentStatus,
  type CategoryColor,
} from "@/lib/constants";
import { cn, formatMAD, formatDate, timeAgo } from "@/lib/utils";

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
  todayAppts: number;
  todayCheckins: number;
  revenue: number;
  announcements: number;
  clients: number;
  vehicles: number;
  trend: { day: string; count: number }[];
  byCategory: { name: string; color: string; count: number }[];
  byStatus: { name: string; value: number; color: string }[];
};

type Appointment = {
  id: string;
  code: string;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  vehicleDesc: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  category?: { name: string; color: string };
  service?: { name: string; price?: number };
};

type AuditLog = {
  id: string;
  adminName: string;
  adminRole: string;
  action: string;
  details: string | null;
  createdAt: string;
};

/** Compute the dashboard stats object from raw appointments + meta counts.
 *  Used as a robust client-side fallback so the dashboard keeps working
 *  even if /api/stats is temporarily unavailable. */
function computeStats(
  appts: Appointment[],
  meta: { announcements: number; clients: number; vehicles: number }
): Stats {
  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);

  const counts: Record<AppointmentStatus, number> = {
    PENDING: 0, APPROVED: 0, REJECTED: 0, COMPLETED: 0, CANCELLED: 0,
  };
  let todayAppts = 0;
  let revenue = 0;
  const catMap = new Map<string, { name: string; color: string; count: number }>();

  for (const a of appts) {
    counts[a.status] = (counts[a.status] ?? 0) + 1;
    const d = new Date(a.date);
    if (d >= startToday && d <= endToday) todayAppts++;
    if (a.status === "COMPLETED") revenue += a.service?.price ?? 0;
    if (a.category) {
      const k = a.category.name;
      const cur = catMap.get(k);
      if (cur) cur.count++;
      else catMap.set(k, { name: k, color: a.category.color, count: 1 });
    }
  }

  // 7-day trend
  const trend: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const e = new Date(d); e.setHours(23, 59, 59, 999);
    const count = appts.filter((a) => {
      const ad = new Date(a.date);
      return ad >= d && ad <= e;
    }).length;
    trend.push({ day: d.toLocaleDateString("fr-FR", { weekday: "short" }), count });
  }

  return {
    total: appts.length,
    pending: counts.PENDING,
    approved: counts.APPROVED,
    rejected: counts.REJECTED,
    completed: counts.COMPLETED,
    cancelled: counts.CANCELLED,
    todayAppts,
    todayCheckins: 0,
    revenue,
    announcements: meta.announcements,
    clients: meta.clients,
    vehicles: meta.vehicles,
    trend,
    byCategory: Array.from(catMap.values()),
    byStatus: [
      { name: "En attente", value: counts.PENDING, color: "orange" },
      { name: "Validé", value: counts.APPROVED, color: "green" },
      { name: "Terminé", value: counts.COMPLETED, color: "purple" },
      { name: "Rejeté", value: counts.REJECTED, color: "red" },
      { name: "Annulé", value: counts.CANCELLED, color: "gray" },
    ],
  };
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [today, setToday] = useState<Appointment[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const todayISO = new Date().toISOString();
      const [apptsRes, todayRes, auditRes, anRes, clRes] = await Promise.all([
        fetch("/api/appointments", { cache: "no-store" }),
        fetch(`/api/appointments?date=${encodeURIComponent(todayISO)}`, { cache: "no-store" }),
        fetch("/api/audit?limit=5", { cache: "no-store" }),
        fetch("/api/announcements", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);
      const allAppts: Appointment[] = apptsRes.ok ? await apptsRes.json() : [];
      const todayAppts: Appointment[] = todayRes.ok ? await todayRes.json() : [];
      const auditLogs: AuditLog[] = auditRes.ok ? await auditRes.json() : [];
      const announcements = anRes.ok ? await anRes.json() : [];
      const clients = clRes.ok ? await clRes.json() : [];

      // Try /api/stats; on failure compute locally.
      let s: Stats | null = null;
      try {
        const statsRes = await fetch("/api/stats", { cache: "no-store" });
        if (statsRes.ok) s = await statsRes.json();
      } catch {
        /* ignore */
      }
      if (!s) {
        s = computeStats(Array.isArray(allAppts) ? allAppts : [], {
          announcements: Array.isArray(announcements) ? announcements.length : 0,
          clients: Array.isArray(clients) ? clients.length : 0,
          vehicles: Array.isArray(clients)
            ? clients.reduce((sum: number, c: { vehicles?: unknown[] }) => sum + (c.vehicles?.length ?? 0), 0)
            : 0,
        });
      }

      setStats(s);
      setToday(Array.isArray(todayAppts) ? todayAppts : []);
      setAudit(Array.isArray(auditLogs) ? auditLogs : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Impossible de charger les statistiques.
      </div>
    );
  }

  const statCards: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: CategoryColor;
    hint?: string;
  }[] = [
    { label: "Total RDV", value: stats.total, icon: CalendarDays, color: "emerald", hint: "Tous statuts" },
    { label: "En attente", value: stats.pending, icon: Clock, color: "orange" },
    { label: "Validés", value: stats.approved, icon: CheckCircle2, color: "green" },
    { label: "Terminés", value: stats.completed, icon: Award, color: "purple" },
    { label: "Rejetés", value: stats.rejected, icon: XCircle, color: "red" },
    { label: "Revenus", value: formatMAD(stats.revenue), icon: TrendingUp, color: "emerald", hint: "Sur terminés" },
    { label: "Clients", value: stats.clients, icon: Users, color: "blue" },
    { label: "Annonces", value: stats.announcements, icon: Megaphone, color: "orange" },
  ];

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Vue d'ensemble
          </h2>
          <p className="text-sm text-muted-foreground">
            Activité du centre · {formatDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            {stats.todayAppts} RDV aujourd'hui
          </Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            {stats.todayCheckins} check-ins
          </Badge>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card) => {
          const c = COLOR_MAP[card.color];
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="glass-card rounded-xl p-4 transition-shadow hover:shadow-glow"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </span>
                <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md", c.soft, c.fg)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className={cn("mt-2 text-2xl font-bold tracking-tight", c.fg)}>
                {card.value}
              </div>
              {card.hint && (
                <p className="mt-1 text-[11px] text-muted-foreground">{card.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Trend area */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Tendance des rendez-vous · 7 jours
            </CardTitle>
            <CardDescription className="text-xs">
              Volume quotidien de RDV toutes catégories confondues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_MAP.emerald.hex} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={COLOR_MAP.emerald.hex} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,35,0.08)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#6B8278" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#6B8278" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(0,200,150,0.2)",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: 12,
                      boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)",
                    }}
                    labelClassName="font-semibold text-foreground"
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="RDV"
                    stroke={COLOR_MAP.emerald.hex}
                    strokeWidth={2.5}
                    fill="url(#gTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status donut */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Répartition par statut
            </CardTitle>
            <CardDescription className="text-xs">
              Ventilation actuelle des {stats.total} rendez-vous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {stats.byStatus.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={COLOR_MAP[entry.color as CategoryColor]?.hex ?? "#999"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(0,200,150,0.2)",
                      background: "rgba(255,255,255,0.95)",
                      fontSize: 12,
                      boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category bar chart */}
      <Card className="border-border/60 shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Rendez-vous par catégorie
          </CardTitle>
          <CardDescription className="text-xs">
            Comparaison du volume par type de véhicule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.byCategory}
                margin={{ top: 5, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,35,0.08)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6B8278" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6B8278" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid rgba(0,200,150,0.2)",
                    background: "rgba(255,255,255,0.95)",
                    fontSize: 12,
                    boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)",
                  }}
                  cursor={{ fill: "rgba(0,200,150,0.06)" }}
                />
                <Bar dataKey="count" name="RDV" radius={[6, 6, 0, 0]}>
                  {stats.byCategory.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={COLOR_MAP[entry.color as CategoryColor]?.hex ?? COLOR_MAP.emerald.hex}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom row: today RDV + audit */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Today RDV */}
        <Card className="border-border/60 shadow-card lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                RDV d'aujourd'hui
              </CardTitle>
              <CardDescription className="text-xs">
                {today.length} rendez-vous planifiés
              </CardDescription>
            </div>
            <Link
              href="/admin/dashboard/appointments"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center">
                <CalendarDays className="h-6 w-6 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  Aucun rendez-vous aujourd'hui
                </p>
              </div>
            ) : (
              <div className="scroll-thin max-h-80 space-y-2 overflow-y-auto pr-1">
                {today.slice(0, 12).map((appt) => {
                  const st = STATUS_META[appt.status];
                  const sc = COLOR_MAP[st.color];
                  return (
                    <div
                      key={appt.id}
                      className="flex items-center gap-3 rounded-md border border-border/60 bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="bg-brand-gradient flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-md text-white">
                        <span className="text-[10px] font-medium leading-none opacity-80">
                          {appt.slot.split(":")[0]}h
                        </span>
                        <span className="text-[13px] font-bold leading-none">
                          {appt.slot.split(":")[1]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-foreground">
                            {appt.clientName}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 border-current/30 text-[10px] font-semibold",
                              sc.fg
                            )}
                          >
                            {st.label}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {appt.code} · {appt.vehiclePlate} ·{" "}
                          {appt.service?.name ?? "Service"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent audit */}
        <Card className="border-border/60 shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Journal d'audit
              </CardTitle>
              <CardDescription className="text-xs">
                Dernières actions administrateurs
              </CardDescription>
            </div>
            <Link
              href="/admin/dashboard/audit"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-center">
                <ScrollText className="h-6 w-6 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  Aucune action récente
                </p>
              </div>
            ) : (
              <ul className="scroll-thin max-h-80 space-y-2 overflow-y-auto pr-1">
                {audit.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-md border border-border/60 bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-semibold text-foreground">
                        {log.adminName}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      <span className="font-mono text-primary">
                        {log.action}
                      </span>
                      {log.details ? ` · ${log.details}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
