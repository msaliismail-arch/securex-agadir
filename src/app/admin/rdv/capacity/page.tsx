"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  Gauge,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import { DEFAULT_DAILY_CAPACITY } from "@/lib/constants";

interface CapacityDay {
  date: string;
  capaciteMax: number;
  confirmedCount: number;
  isFull: boolean;
}

/** Build a "YYYY-MM-DD" key from a Date — matches the /api/capacity output. */
function ymdKey(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return x.toISOString().slice(0, 10);
}

export default function RdvCapacityPage() {
  const [days, setDays] = useState<CapacityDay[]>([]);
  const [defaultCap, setDefaultCap] = useState<number>(DEFAULT_DAILY_CAPACITY);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingDay, setEditingDay] = useState<CapacityDay | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const fromStr = ymdKey(today);
  const to = useMemo(() => {
    const t = new Date(today);
    t.setDate(t.getDate() + 60);
    return t;
  }, [today]);
  const toStr = ymdKey(to);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/capacity?from=${fromStr}&to=${toStr}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setDefaultCap(data.defaultCapacity ?? DEFAULT_DAILY_CAPACITY);
      setDays(data.days ?? []);
    } catch {
      toast.error("Impossible de charger la capacité. Réessayez.");
    } finally {
      setLoading(false);
    }
  }, [fromStr, toStr]);

  useEffect(() => {
    load();
  }, [load]);

  const dayMap = useMemo(() => {
    const m = new Map<string, CapacityDay>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  // Build the next 30 days list (fills missing days with the default capacity).
  const next30 = useMemo<CapacityDay[]>(() => {
    const arr: CapacityDay[] = [];
    const cursor = new Date(today);
    for (let i = 0; i < 30; i++) {
      const key = ymdKey(cursor);
      const found = dayMap.get(key);
      arr.push(
        found ?? {
          date: key,
          capaciteMax: defaultCap,
          confirmedCount: 0,
          isFull: false,
        }
      );
      cursor.setDate(cursor.getDate() + 1);
    }
    return arr;
  }, [dayMap, defaultCap, today]);

  const selectedKey = selectedDate ? ymdKey(selectedDate) : null;
  const selectedDay: CapacityDay | null = selectedKey
    ? dayMap.get(selectedKey) ?? {
        date: selectedKey,
        capaciteMax: defaultCap,
        confirmedCount: 0,
        isFull: false,
      }
    : null;

  const openEdit = (day: CapacityDay) => {
    setEditingDay(day);
    setEditValue(String(day.capaciteMax));
  };

  const save = async () => {
    if (!editingDay) return;
    const val = Number(editValue);
    if (!Number.isFinite(val) || val < 1 || val > 200) {
      toast.error("La capacité doit être un nombre entier entre 1 et 200.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/capacity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: editingDay.date, capaciteMax: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Échec de l'enregistrement");
      toast.success(
        `Capacité du ${formatDate(editingDay.date, { day: "2-digit", month: "short" })} → ${val} RDV/jour`
      );
      setEditingDay(null);
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  };

  const reset = async (date: string) => {
    setResetting(date);
    try {
      const res = await fetch(`/api/capacity?date=${date}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Échec de la réinitialisation");
      toast.success(
        `Capacité du ${formatDate(date, { day: "2-digit", month: "short" })} réinitialisée (${defaultCap} RDV/jour)`
      );
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de la réinitialisation"
      );
    } finally {
      setResetting(null);
    }
  };

  // Summary stats over the 30-day window.
  const totalConfirmed = next30.reduce((s, d) => s + d.confirmedCount, 0);
  const totalCapacity = next30.reduce((s, d) => s + d.capaciteMax, 0);
  const fullDaysCount = next30.filter((d) => d.isFull).length;

  const editValueNum = Number(editValue);
  const editBelowConfirmed =
    editingDay && Number.isFinite(editValueNum) && editValueNum < editingDay.confirmedCount;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card shadow-soft p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gauge className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Capacité par défaut
              </div>
              <div className="text-2xl font-bold text-foreground">
                {defaultCap}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  RDV / jour
                </span>
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Seul l&apos;admin RDV peut modifier la capacité d&apos;une journée.
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card shadow-soft p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Confirmés (30 jours)
              </div>
              <div className="text-2xl font-bold text-foreground">{totalConfirmed}</div>
              <div className="text-[11px] text-muted-foreground">
                sur {totalCapacity} places disponibles
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card shadow-soft p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Journées complètes
              </div>
              <div className="text-2xl font-bold text-foreground">{fullDaysCount}</div>
              <div className="text-[11px] text-muted-foreground">
                dans les 30 prochains jours
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        {/* Calendar + selected day editor */}
        <Card className="glass-card shadow-soft p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Sélectionner une date</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={load}
              disabled={loading}
              title="Rafraîchir"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>

          <div className="flex justify-center rounded-lg border border-border bg-card p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d < today;
              }}
              fromDate={today}
              toDate={to}
              locale={fr}
              className="mx-auto"
            />
          </div>

          {/* Selected day panel */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Journée sélectionnée
                  </div>
                  <div className="text-base font-bold capitalize text-foreground">
                    {formatDate(selectedDay.date, {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                {selectedDay.isFull ? (
                  <Badge className="bg-destructive text-white">Complet</Badge>
                ) : selectedDay.capaciteMax - selectedDay.confirmedCount < 3 ? (
                  <Badge className="bg-orange-500 text-white">Bientôt plein</Badge>
                ) : (
                  <Badge className="bg-brand-gradient text-white">Disponible</Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Capacité</div>
                  <div className="text-lg font-bold text-foreground">
                    {selectedDay.capaciteMax}
                  </div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Confirmés</div>
                  <div className="text-lg font-bold text-foreground">
                    {selectedDay.confirmedCount}
                  </div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Restant</div>
                  <div className="text-lg font-bold text-primary">
                    {selectedDay.capaciteMax - selectedDay.confirmedCount}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => openEdit(selectedDay)}
                  className="flex-1 bg-brand-gradient text-white hover:opacity-90"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Modifier la capacité
                </Button>
                <Button
                  variant="outline"
                  onClick={() => reset(selectedDay.date)}
                  disabled={resetting === selectedDay.date}
                  title="Réinitialiser à la capacité par défaut"
                >
                  {resetting === selectedDay.date ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* 30-day list */}
        <Card className="glass-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">30 prochains jours</h2>
            </div>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              Cliquez une ligne pour modifier
            </span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Capacité</TableHead>
                    <TableHead className="hidden text-center sm:table-cell">Confirmés</TableHead>
                    <TableHead className="text-center">Restant</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {next30.map((day) => {
                    const remaining = day.capaciteMax - day.confirmedCount;
                    const dayDate = new Date(day.date + "T00:00:00");
                    const isSun = dayDate.getDay() === 0;
                    return (
                      <TableRow
                        key={day.date}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/30",
                          isSun && "opacity-60"
                        )}
                        onClick={() => openEdit(day)}
                      >
                        <TableCell>
                          <div className="text-sm font-medium capitalize text-foreground">
                            {formatDate(day.date, {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                          {isSun && (
                            <div className="text-[10px] text-muted-foreground">Dimanche · fermé</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-foreground">
                          {day.capaciteMax}
                        </TableCell>
                        <TableCell className="hidden text-center text-sm sm:table-cell">
                          {day.confirmedCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "font-bold",
                              remaining <= 0
                                ? "text-destructive"
                                : remaining < 3
                                  ? "text-orange-600"
                                  : "text-primary"
                            )}
                          >
                            {remaining}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {day.isFull ? (
                            <Badge className="bg-destructive text-[10px] text-white">Complet</Badge>
                          ) : remaining < 3 ? (
                            <Badge className="bg-orange-500 text-[10px] text-white">Limité</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-primary/30 text-[10px] text-primary"
                            >
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => openEdit(day)}
                              title="Modifier la capacité"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => reset(day.date)}
                              disabled={resetting === day.date}
                              title="Réinitialiser au défaut"
                            >
                              {resetting === day.date ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingDay} onOpenChange={(o) => !o && setEditingDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Modifier la capacité
            </DialogTitle>
            <DialogDescription>
              {editingDay && (
                <>
                  Définissez le nombre maximum de rendez-vous pour le{" "}
                  <span className="font-medium capitalize text-foreground">
                    {formatDate(editingDay.date, {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {editingDay && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Capacité actuelle</div>
                  <div className="text-base font-bold text-foreground">
                    {editingDay.capaciteMax}
                  </div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Confirmés</div>
                  <div className="text-base font-bold text-foreground">
                    {editingDay.confirmedCount}
                  </div>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Restant</div>
                  <div className="text-base font-bold text-primary">
                    {editingDay.capaciteMax - editingDay.confirmedCount}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cap-input">Nouvelle capacité (1 à 200)</Label>
                <Input
                  id="cap-input"
                  type="number"
                  min={1}
                  max={200}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      save();
                    }
                  }}
                />
                {editBelowConfirmed && (
                  <p className="flex items-center gap-1 text-[11px] text-orange-600">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Attention : {editingDay.confirmedCount} RDV déjà confirmés. La capacité ne
                    peut pas être inférieure aux confirmations.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-1.5 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-[11px] text-muted-foreground">
                <Lock className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span>
                  La capacité par défaut est de{" "}
                  <strong className="text-foreground">{defaultCap} RDV/jour</strong>. Une valeur
                  personnalisée remplace ce défaut pour cette date uniquement.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingDay(null)}
              disabled={saving}
            >
              Annuler
            </Button>
            {editingDay && (
              <Button
                variant="ghost"
                onClick={async () => {
                  await reset(editingDay.date);
                  setEditingDay(null);
                }}
                disabled={saving || resetting === editingDay.date}
                className="text-muted-foreground"
              >
                {resetting === editingDay.date ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Réinitialiser
              </Button>
            )}
            <Button
              onClick={save}
              disabled={saving}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
