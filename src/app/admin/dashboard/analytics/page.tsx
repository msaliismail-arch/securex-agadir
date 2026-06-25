"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
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
  TrendingUp,
  CheckCircle2,
  Clock,
  Loader2,
  BarChart3,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { cn, formatMAD } from "@/lib/utils";

type Appointment = {
  id: string;
  date: string;
  slot: string;
  status: string;
  service?: { price: number; durationMin: number };
  category?: { name: string; color: string };
  result?: {
    overallResult: string;
  } | null;
};

export default function AnalyticsPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });
      const data = res.ok ? await res.json() : [];
      setAppts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Monthly revenue (from completed appts)
  const monthlyRevenue = useMemo(() => {
    const m = new Map<string, { month: string; revenue: number; count: number }>();
    for (const a of appts) {
      if (a.status !== "COMPLETED") continue;
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      const cur = m.get(key) ?? { month: label, revenue: 0, count: 0 };
      cur.revenue += a.service?.price ?? 0;
      cur.count += 1;
      m.set(key, cur);
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [appts]);

  // Pass / fail rate
  const passFail = useMemo(() => {
    let pass = 0;
    let fail = 0;
    for (const a of appts) {
      if (a.status !== "COMPLETED" || !a.result) continue;
      if (a.result.overallResult === "PASS") pass++;
      else fail++;
    }
    return [
      { name: "Conforme", value: pass, color: "green" },
      { name: "Non conforme", value: fail, color: "red" },
    ];
  }, [appts]);

  // Busiest time slots
  const slotStats = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of appts) {
      m.set(a.slot, (m.get(a.slot) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => a.slot.localeCompare(b.slot));
  }, [appts]);

  // Monthly trend (all statuses)
  const monthlyTrend = useMemo(() => {
    const m = new Map<string, { month: string; count: number }>();
    for (const a of appts) {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      const cur = m.get(key) ?? { month: label, count: 0 };
      cur.count += 1;
      m.set(key, cur);
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [appts]);

  // KPIs
  const totalInspected = passFail[0].value + passFail[1].value;
  const passRate = totalInspected > 0 ? Math.round((passFail[0].value / totalInspected) * 100) : 0;
  const busiestSlot = useMemo(() => {
    if (slotStats.length === 0) return "—";
    return slotStats.reduce((max, s) => (s.count > max.count ? s : max), slotStats[0]).slot;
  }, [slotStats]);

  // Aggregate revenue + completed + byCategory from appts (resilient to /api/stats)
  const { revenue, completed, byCategory } = useMemo(() => {
    let rev = 0;
    let comp = 0;
    const catMap = new Map<string, { name: string; color: string; count: number }>();
    for (const a of appts) {
      if (a.status === "COMPLETED") {
        comp++;
        rev += a.service?.price ?? 0;
      }
      if (a.category) {
        const k = a.category.name;
        const cur = catMap.get(k);
        if (cur) cur.count++;
        else catMap.set(k, { name: k, color: a.category.color, count: 1 });
      }
    }
    return { revenue: rev, completed: comp, byCategory: Array.from(catMap.values()) };
  }, [appts]);

  const avgRevenue = completed > 0 ? revenue / completed : 0;

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Statistiques avancées</h2>
        <p className="text-sm text-muted-foreground">
          Indicateurs de performance, tendances et analyse détaillée de l'activité.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Taux de conformité"
          value={`${passRate}%`}
          icon={CheckCircle2}
          color="green"
          hint={`${passFail[0].value}/${totalInspected} contrôles`}
        />
        <KpiCard
          label="Revenu moyen / RDV"
          value={formatMAD(avgRevenue)}
          icon={TrendingUp}
          color="indigo"
          hint="Sur RDV terminés"
        />
        <KpiCard
          label="Créneau le plus actif"
          value={busiestSlot}
          icon={Clock}
          color="purple"
          hint="Sur tous les RDV"
        />
        <KpiCard
          label="Revenu total"
          value={formatMAD(revenue)}
          icon={Award}
          color="emerald"
          hint={`${completed} contrôles terminés`}
        />
      </div>

      {/* Monthly trend */}
      <Card className="border-l-4 border-primary/60 shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Tendance mensuelle
          </CardTitle>
          <CardDescription className="text-xs">
            Volume de rendez-vous par mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrend.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,35,0.08)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,200,150,0.2)", background: "rgba(255,255,255,0.95)", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)" }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="RDV"
                    stroke={COLOR_MAP.emerald.hex}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: COLOR_MAP.emerald.hex }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two charts side by side */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Revenus par mois
            </CardTitle>
            <CardDescription className="text-xs">
              Chiffre d'affaires généré par les contrôles terminés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLOR_MAP.emerald.hex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLOR_MAP.emerald.hex} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,35,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,200,150,0.2)", background: "rgba(255,255,255,0.95)", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)" }}
                      formatter={(v: number) => [formatMAD(v), "Revenu"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenu"
                      stroke={COLOR_MAP.emerald.hex}
                      strokeWidth={2}
                      fill="url(#gRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pass / fail donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Taux de conformité
            </CardTitle>
            <CardDescription className="text-xs">
              Résultats des contrôles techniques terminés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalInspected === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passFail}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {passFail.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={COLOR_MAP[entry.color as CategoryColor]?.hex ?? "#999"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,200,150,0.2)", background: "rgba(255,255,255,0.95)", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Busiest slots */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Créneaux les plus sollicités
          </CardTitle>
          <CardDescription className="text-xs">
            Nombre de rendez-vous par tranche horaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slotStats.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slotStats} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,35,0.08)" vertical={false} />
                  <XAxis dataKey="slot" tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,200,150,0.2)", background: "rgba(255,255,255,0.95)", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)" }} cursor={{ fill: "rgba(0,200,150,0.06)" }} />
                  <Bar dataKey="count" name="RDV" radius={[6, 6, 0, 0]} fill={COLOR_MAP.emerald.hex} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Répartition par catégorie
          </CardTitle>
          <CardDescription className="text-xs">
            Volume de RDV par type de véhicule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,42,35,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B8278" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(0,200,150,0.2)", background: "rgba(255,255,255,0.95)", fontSize: 12, boxShadow: "0 8px 24px -8px rgba(0,200,150,0.18)" }} cursor={{ fill: "rgba(0,200,150,0.06)" }} />
                <Bar dataKey="count" name="RDV" radius={[6, 6, 0, 0]}>
                  {byCategory.map((entry, i) => (
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
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: CategoryColor;
  hint?: string;
}) {
  const c = COLOR_MAP[color];
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md", c.soft, c.fg)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className={cn("text-xl font-bold tracking-tight sm:text-2xl", c.fg)}>
          {value}
        </div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <BarChart3 className="h-6 w-6 opacity-40" />
      <p className="text-[12px]">Pas encore assez de données</p>
    </div>
  );
}
