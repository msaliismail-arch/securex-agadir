"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Calendar as CalIcon, Loader2, Eye, QrCode, Award, CheckCircle2, XCircle, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { STATUS_META, type AppointmentStatus } from "@/lib/constants";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { useAppointments, useCatalog, buildLookups } from "./_components/use-appointments";
import { useRdvAdmin } from "./_components/rdv-context";
import { useRdvDialogs, RdvDialogHost } from "./_components/rdv-dialogs";
import { CategoryBadge, StatusBadge } from "./_components/badges";
import type { Appointment } from "./_components/types";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Validés" },
  { value: "COMPLETED", label: "Terminés" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "CANCELLED", label: "Annulés" },
];

export default function RdvPlanningPage() {
  const { adminName } = useRdvAdmin();
  const dialogs = useRdvDialogs();
  const { items, loading, filters, setFilters, refresh } = useAppointments();
  const { categories, services } = useCatalog();
  const { catMap, svcMap } = buildLookups(categories, services);

  // Local-only quick search for the input (debounced via state set)
  const [qInput, setQInput] = useState(filters.q ?? "");

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, q: qInput.trim() || undefined });
  };

  const today = new Date().toISOString().slice(0, 10);
  const isTodayFilter = filters.date === today;

  const setQuickToday = () => {
    setFilters({ ...filters, date: isTodayFilter ? undefined : today });
  };

  const itemsEnriched: Appointment[] = useMemo(
    () =>
      items.map((a) => ({
        ...a,
        category: a.category ?? catMap.get(a.categoryId) ?? undefined,
        service: a.service ?? svcMap.get(a.serviceId) ?? undefined,
      })),
    [items, catMap, svcMap],
  );

  const onUpdated = (a: Appointment) => {
    refresh();
  };

  const onCreated = (_a: Appointment) => {
    refresh();
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <form onSubmit={onSearchSubmit} className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Rechercher par code, téléphone, plaque, nom…"
                className="pl-9 pr-9"
              />
              {qInput && (
                <button
                  type="button"
                  onClick={() => {
                    setQInput("");
                    setFilters({ ...filters, q: undefined });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            <Select
              value={filters.status ?? "all"}
              onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="sm:w-48 w-full">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative sm:w-44">
              <CalIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={filters.date ?? ""}
                onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })}
                className="pl-8"
              />
            </div>

            <Button
              type="button"
              variant={isTodayFilter ? "default" : "outline"}
              onClick={setQuickToday}
              className={cn(isTodayFilter && "bg-[#2D9CDB] hover:bg-[#2D9CDB]/90 text-white")}
            >
              Aujourd&apos;hui
            </Button>
          </div>

          <Button
            onClick={() => dialogs.open("new")}
            className="bg-[#2D9CDB] hover:bg-[#2D9CDB]/90 text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau RDV
          </Button>
        </div>

        {/* Active filter chips */}
        {(filters.status || filters.date || filters.q) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Filtres actifs :</span>
            {filters.status && (
              <Chip onClear={() => setFilters({ ...filters, status: undefined })}>
                {STATUS_META[filters.status as AppointmentStatus]?.label ?? filters.status}
              </Chip>
            )}
            {filters.date && (
              <Chip onClear={() => setFilters({ ...filters, date: undefined })}>
                {formatDate(filters.date, { day: "2-digit", month: "short", year: "numeric" })}
              </Chip>
            )}
            {filters.q && (
              <Chip onClear={() => { setQInput(""); setFilters({ ...filters, q: undefined }); }}>
                « {filters.q} »
              </Chip>
            )}
            <button
              onClick={() => { setQInput(""); setFilters({}); }}
              className="text-[11px] text-muted-foreground hover:text-navy underline underline-offset-2"
            >
              Tout effacer
            </button>
          </div>
        )}
      </Card>

      {/* Stats line */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <MiniStat label="Total" value={itemsEnriched.length} dot="gray" />
        <MiniStat label="En attente" value={itemsEnriched.filter((a) => a.status === "PENDING").length} dot="orange" />
        <MiniStat label="Validés" value={itemsEnriched.filter((a) => a.status === "APPROVED").length} dot="green" />
        <MiniStat label="Terminés" value={itemsEnriched.filter((a) => a.status === "COMPLETED").length} dot="purple" />
        <MiniStat label="Rejetés/Annulés" value={itemsEnriched.filter((a) => a.status === "REJECTED" || a.status === "CANCELLED").length} dot="red" />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : itemsEnriched.length === 0 ? (
          <EmptyState
            title="Aucun rendez-vous"
            message="Aucun RDV ne correspond à vos filtres. Ajustez les critères ou créez un nouveau rendez-vous."
            action={
              <Button onClick={() => dialogs.open("new")} className="bg-[#2D9CDB] hover:bg-[#2D9CDB]/90 text-white">
                <Plus className="h-4 w-4 mr-2" /> Nouveau RDV
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface">
                  <TableHead className="w-[110px]">Code</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                  <TableHead className="hidden lg:table-cell">Service</TableHead>
                  <TableHead>Date · Créneau</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsEnriched.map((appt, idx) => (
                  <TableRow
                    key={appt.id}
                    onClick={() => dialogs.open("detail", appt)}
                    className="cursor-pointer hover:bg-surface/60 transition-colors"
                  >
                    <TableCell>
                      <div className="font-mono font-bold text-navy tracking-wider">{appt.code}</div>
                      {appt.queueNumber != null && (
                        <div className="text-[10px] text-muted-foreground">FILE {appt.queueNumber}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-navy text-sm">{appt.clientName}</div>
                      <div className="text-xs text-muted-foreground">{appt.clientPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-navy">{appt.vehiclePlate}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">{appt.vehicleDesc}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {appt.category && (
                        <CategoryBadge color={appt.category.color} label={appt.category.name} />
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{appt.service?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-navy">
                        {formatDate(appt.date, { day: "2-digit", month: "short" })}
                      </div>
                      <div className="text-xs text-muted-foreground">{appt.slot}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={appt.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <RowActions appt={appt} dialogs={dialogs} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <RdvDialogHost
        controller={dialogs}
        adminName={adminName}
        onUpdated={onUpdated}
        onCreated={onCreated}
      />
    </div>
  );
}

function RowActions({
  appt,
  dialogs,
}: {
  appt: Appointment;
  dialogs: ReturnType<typeof useRdvDialogs>;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => dialogs.open("detail", appt)}
        title="Voir le détail"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {appt.status === "PENDING" && (
        <>
          <Button
            size="sm"
            className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => dialogs.open("validate", appt)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Valider
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => dialogs.open("reject", appt)}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      {appt.status === "APPROVED" && (
        <>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            <QrCode className="h-3 w-3" /> QR généré
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => dialogs.open("detail", appt)}
            title="Voir le QR"
          >
            <QrCode className="h-4 w-4 text-emerald-600" />
          </Button>
          <Button
            size="sm"
            className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => dialogs.open("complete", appt)}
          >
            <Award className="h-3.5 w-3.5 mr-1" /> Terminer
          </Button>
        </>
      )}

      {appt.status === "COMPLETED" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => dialogs.open("detail", appt)}
          >
            <Award className="h-3.5 w-3.5 mr-1 text-purple-600" /> Résultat
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => dialogs.open("detail", appt)}
            title="Voir le QR"
          >
            <QrCode className="h-4 w-4 text-emerald-600" />
          </Button>
        </>
      )}

      {(appt.status === "REJECTED" || appt.status === "CANCELLED") && (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}

function MiniStat({ label, value, dot }: { label: string; value: number; dot: string }) {
  const dotColor: Record<string, string> = {
    gray: "bg-gray-400",
    orange: "bg-orange-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    red: "bg-red-500",
  };
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[dot])} />
        {label}
      </div>
      <div className="text-xl font-bold text-navy mt-0.5">{value}</div>
    </Card>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#2D9CDB]/10 px-2 py-0.5 text-[#2D9CDB] font-medium">
      {children}
      <button onClick={onClear} className="hover:bg-[#2D9CDB]/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-4"
    >
      <div className="rounded-full bg-surface-2 p-4">
        <CalIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

export { Loader2 };
