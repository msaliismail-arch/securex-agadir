"use client";

import { useMemo, useState } from "react";
import { Clock, CheckCircle2, XCircle, Eye, ListChecks, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatDate, cn } from "@/lib/utils";
import { useAppointments, useCatalog, buildLookups } from "../_components/use-appointments";
import { useRdvAdmin } from "../_components/rdv-context";
import { useRdvDialogs, RdvDialogHost } from "../_components/rdv-dialogs";
import { CategoryBadge, StatusBadge } from "../_components/badges";
import type { Appointment } from "../_components/types";

type SortKey = "soonest" | "oldest";

export default function PendingQueuePage() {
  const { adminName } = useRdvAdmin();
  const dialogs = useRdvDialogs();
  const { items, loading, refresh } = useAppointments({ status: "PENDING" });
  const { categories, services } = useCatalog();
  const { catMap, svcMap } = buildLookups(categories, services);
  const [sort, setSort] = useState<SortKey>("soonest");

  const pending = useMemo<Appointment[]>(() => {
    const enriched = items
      .filter((a) => a.status === "PENDING")
      .map((a) => ({
        ...a,
        category: a.category ?? catMap.get(a.categoryId) ?? undefined,
        service: a.service ?? svcMap.get(a.serviceId) ?? undefined,
      }));
    return enriched.sort((a, b) => {
      const da = new Date(a.date).getTime() + parseSlotToMin(a.slot);
      const db = new Date(b.date).getTime() + parseSlotToMin(b.slot);
      return sort === "soonest" ? da - db : db - da;
    });
  }, [items, catMap, svcMap, sort]);

  return (
    <div className="space-y-5">
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-warning/10 p-2 ring-1 ring-warning/20">
              <ListChecks className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">File d&apos;attente — Validation requise</h2>
              <p className="text-xs text-muted-foreground">
                {pending.length} rendez-vous{pending.length > 1 ? "s" : ""} en attente d&apos;approbation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={sort === "soonest" ? "default" : "outline"}
              onClick={() => setSort("soonest")}
              className={cn(sort === "soonest" && "bg-brand-gradient text-white hover:opacity-90")}
            >
              Plus proche
            </Button>
            <Button
              size="sm"
              variant={sort === "oldest" ? "default" : "outline"}
              onClick={() => setSort("oldest")}
              className={cn(sort === "oldest" && "bg-brand-gradient text-white hover:opacity-90")}
            >
              Plus ancien
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-foreground">File vide</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Aucun rendez-vous en attente de validation. Nouveau travail à venir.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pending.map((appt, idx) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="glass-card p-4 hover:border-primary/40 transition-colors h-full flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-foreground tracking-wider">{appt.code}</div>
                      <div className="text-[10px] text-muted-foreground">
                        FILE {appt.queueNumber ?? "—"} · Créé {formatDate(appt.createdAt, { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Client</div>
                    <div className="font-medium text-foreground">{appt.clientName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Téléphone</div>
                    <div className="font-medium text-foreground">{appt.clientPhone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Plaque</div>
                    <div className="font-mono font-medium text-foreground">{appt.vehiclePlate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Date · Créneau</div>
                    <div className="font-medium text-foreground">
                      {formatDate(appt.date, { day: "2-digit", month: "short" })} · {appt.slot}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Service</div>
                    <div className="font-medium text-foreground">{appt.service?.name ?? "—"}</div>
                  </div>
                  {appt.category && (
                    <div className="col-span-2 mt-0.5">
                      <CategoryBadge color={appt.category.color} label={appt.category.name} />
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-brand-gradient text-white hover:opacity-90 h-9"
                    onClick={() => dialogs.open("validate", appt)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 h-9"
                    onClick={() => dialogs.open("reject", appt)}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Rejeter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => dialogs.open("detail", appt)}
                    title="Voir le détail"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <RdvDialogHost
        controller={dialogs}
        adminName={adminName}
        onUpdated={refresh}
        onCreated={refresh}
      />
    </div>
  );
}

function parseSlotToMin(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export { Clock, Loader2 };
