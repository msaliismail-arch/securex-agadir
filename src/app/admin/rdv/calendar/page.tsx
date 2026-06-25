"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { STATUS_META, COLOR_MAP, type AppointmentStatus, type CategoryColor } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { useAppointments, useCatalog, buildLookups } from "../_components/use-appointments";
import { useRdvAdmin } from "../_components/rdv-context";
import { useRdvDialogs, RdvDialogHost } from "../_components/rdv-dialogs";
import { CategoryBadge, StatusBadge } from "../_components/badges";
import type { Appointment } from "../_components/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  // JS: 0 = Sunday, 6 = Saturday. We want Monday = 0.
  const firstDayJs = first.getDay();
  const firstDayIdx = (firstDayJs + 6) % 7; // shift so Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

export default function RdvCalendarPage() {
  const { adminName } = useRdvAdmin();
  const dialogs = useRdvDialogs();
  const { items, loading, refresh } = useAppointments();
  const { categories, services } = useCatalog();
  const { catMap, svcMap } = buildLookups(categories, services);

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(toYMD(today));

  const itemsEnriched = useMemo<Appointment[]>(
    () =>
      items.map((a) => ({
        ...a,
        category: a.category ?? catMap.get(a.categoryId) ?? undefined,
        service: a.service ?? svcMap.get(a.serviceId) ?? undefined,
      })),
    [items, catMap, svcMap],
  );

  // group by YMD
  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of itemsEnriched) {
      const k = toYMD(new Date(a.date));
      const arr = m.get(k) ?? [];
      arr.push(a);
      m.set(k, arr);
    }
    return m;
  }, [itemsEnriched]);

  const cells = buildMonthGrid(cursor.year, cursor.month);

  const goPrev = () => {
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  };
  const goNext = () => {
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));
  };
  const goToday = () => {
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDay(toYMD(today));
  };

  const selectedAppts = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Calendar */}
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {MONTHS[cursor.month]} {cursor.year}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToday}>Aujourd&apos;hui</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell.date) {
                return <div key={idx} className="aspect-square rounded-md bg-muted/30" />;
              }
              const ymd = toYMD(cell.date);
              const dayAppts = byDay.get(ymd) ?? [];
              const isToday = ymd === toYMD(today);
              const isSelected = ymd === selectedDay;
              const isPast = cell.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(ymd)}
                  className={cn(
                    "aspect-square rounded-md p-1.5 text-left transition-all border relative overflow-hidden flex flex-col",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                    isPast && !isToday && "opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-gradient text-white" : "text-foreground",
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[9px] font-bold text-muted-foreground">{dayAppts.length}</span>
                    )}
                  </div>
                  {/* Status dots */}
                  {dayAppts.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-0.5">
                      {Object.entries(
                        dayAppts.reduce<Record<string, number>>((acc, a) => {
                          acc[a.status] = (acc[a.status] ?? 0) + 1;
                          return acc;
                        }, {}),
                      ).slice(0, 5).map(([status, count]) => {
                        const meta = STATUS_META[status as AppointmentStatus];
                        const c = COLOR_MAP[meta?.color as CategoryColor] ?? COLOR_MAP.gray;
                        return (
                          <span
                            key={status}
                            className={cn("h-1.5 w-1.5 rounded-full", c.bg)}
                            title={`${meta?.label}: ${count}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">Légende :</span>
            {(["PENDING", "APPROVED", "COMPLETED", "CANCELLED"] as AppointmentStatus[]).map((s) => {
              const meta = STATUS_META[s];
              const c = COLOR_MAP[meta.color as CategoryColor];
              return (
                <span key={s} className="inline-flex items-center gap-1">
                  <span className={cn("h-2 w-2 rounded-full", c.bg)} />
                  {meta.label}
                </span>
              );
            })}
          </div>
        </Card>

        {/* Day panel */}
        <Card className="glass-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Journée sélectionnée</div>
              <div className="text-base font-bold text-foreground">
                {selectedDay ? formatDate(selectedDay, { weekday: "long", day: "2-digit", month: "long" }) : "—"}
              </div>
            </div>
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              {selectedAppts.length} RDV
            </div>
          </div>

          <div className="flex-1 max-h-[60vh] overflow-y-auto scroll-thin -mx-1 px-1 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : selectedAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 text-sm text-muted-foreground">
                <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                Aucun rendez-vous ce jour.
              </div>
            ) : (
              selectedAppts.map((appt, idx) => (
                <motion.button
                  key={appt.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => dialogs.open("detail", appt)}
                  className="w-full text-left rounded-lg border border-border bg-card p-3 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono font-bold text-foreground text-sm">{appt.code}</div>
                    <StatusBadge status={appt.status} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-foreground">{appt.slot}</span>
                    <span>·</span>
                    <span>{appt.clientName}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">{appt.vehiclePlate}</span>
                    {" · "}
                    {appt.service?.name ?? "—"}
                  </div>
                  {appt.category && (
                    <div className="mt-2">
                      <CategoryBadge color={appt.category.color} label={appt.category.name} />
                    </div>
                  )}
                </motion.button>
              ))
            )}
          </div>
        </Card>
      </div>

      <RdvDialogHost
        controller={dialogs}
        adminName={adminName}
        onUpdated={refresh}
        onCreated={refresh}
      />
    </div>
  );
}

export { Loader2 };
