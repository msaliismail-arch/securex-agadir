"use client";

import { useMemo } from "react";
import { Award, QrCode as QrIcon, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useAppointments, useCatalog, buildLookups } from "../_components/use-appointments";
import { useRdvAdmin } from "../_components/rdv-context";
import { useRdvDialogs, RdvDialogHost } from "../_components/rdv-dialogs";
import { CategoryBadge, StatusBadge } from "../_components/badges";
import { QrDisplay } from "../_components/qr-display";
import type { Appointment } from "../_components/types";

export default function ApprovedPage() {
  const { adminName } = useRdvAdmin();
  const dialogs = useRdvDialogs();
  const { items, loading, refresh } = useAppointments({ status: "APPROVED" });
  const { categories, services } = useCatalog();
  const { catMap, svcMap } = buildLookups(categories, services);

  const approved = useMemo<Appointment[]>(() => {
    return items
      .filter((a) => a.status === "APPROVED")
      .map((a) => ({
        ...a,
        category: a.category ?? catMap.get(a.categoryId) ?? undefined,
        service: a.service ?? svcMap.get(a.serviceId) ?? undefined,
      }))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() + parseSlot(a.slot) - (new Date(b.date).getTime() + parseSlot(b.slot)),
      );
  }, [items, catMap, svcMap]);

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-50 p-2 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy">Rendez-vous validés</h2>
            <p className="text-xs text-muted-foreground">
              {approved.length} RDV avec QR de validation généré. Marquez comme terminé après le contrôle.
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : approved.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-surface-2 p-4">
            <QrIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-navy">Aucun RDV validé</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Validez des rendez-vous en attente pour les voir apparaître ici avec leur QR code.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {approved.map((appt, idx) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className="p-4 hover:border-[#2D9CDB]/40 transition-colors h-full flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-navy tracking-wider">{appt.code}</div>
                    <div className="text-[10px] text-muted-foreground">
                      FILE {appt.queueNumber ?? "—"} · {formatDate(appt.date, { day: "2-digit", month: "short" })} · {appt.slot}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="mt-2 text-xs">
                  <div className="font-medium text-navy">{appt.clientName}</div>
                  <div className="text-muted-foreground">
                    <span className="font-mono font-medium text-navy">{appt.vehiclePlate}</span> · {appt.vehicleDesc}
                  </div>
                  <div className="text-muted-foreground">{appt.service?.name ?? "—"}</div>
                  {appt.category && (
                    <div className="mt-1.5">
                      <CategoryBadge color={appt.category.color} label={appt.category.name} />
                    </div>
                  )}
                </div>

                {/* QR thumbnail */}
                <div className="mt-3 flex justify-center">
                  {appt.qrToken ? (
                    <QrDisplay token={appt.qrToken} size={140} />
                  ) : (
                    <div className="h-[140px] w-[140px] rounded-xl bg-surface-2 flex items-center justify-center text-xs text-muted-foreground">
                      Pas de QR
                    </div>
                  )}
                </div>

                {appt.qrGeneratedAt && (
                  <div className="mt-1.5 text-center text-[10px] text-muted-foreground">
                    QR généré le {formatDateTime(appt.qrGeneratedAt)}
                  </div>
                )}

                <div className="mt-auto pt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-9"
                    onClick={() => dialogs.open("complete", appt)}
                  >
                    <Award className="h-4 w-4 mr-1.5" /> Marquer terminé
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

function parseSlot(slot: string): number {
  const [h, m] = slot.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export { Loader2 };
