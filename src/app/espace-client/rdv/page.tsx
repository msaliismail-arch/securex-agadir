"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Car,
  QrCode,
  Loader2,
  ChevronLeft,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useClientData,
  type AppointmentItem,
} from "@/components/client/types";
import { StatusBadge, CategoryBadge } from "@/components/client/badges";
import { QrDialog, CertificateButton } from "@/components/client/qr-dialog";
import { cn, formatDate, formatMAD } from "@/lib/utils";

type FilterKey = "all" | "upcoming" | "past";

export default function MesRdvPage() {
  const router = useRouter();
  const { data, loading, error, unauthorized } = useClientData();
  const [filter, setFilter] = useState<FilterKey>("upcoming");
  const [query, setQuery] = useState("");
  const [qrAppt, setQrAppt] = useState<AppointmentItem | null>(null);

  useEffect(() => {
    if (unauthorized) router.replace("/espace-client");
  }, [unauthorized, router]);

  if (loading || unauthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error || "Impossible de charger vos rendez-vous."}
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = data.appointments
    .filter((a) => {
      if (filter === "upcoming") return new Date(a.date) >= now && a.status !== "CANCELLED";
      if (filter === "past") return new Date(a.date) < now || a.status === "COMPLETED" || a.status === "REJECTED" || a.status === "CANCELLED";
      return true;
    })
    .filter((a) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        a.code.toLowerCase().includes(q) ||
        a.vehiclePlate.toLowerCase().includes(q) ||
        a.service.name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // upcoming: ascending; past: descending
      if (filter === "upcoming") return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/espace-client"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Mes rendez-vous</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez vos rendez-vous à venir et passés, téléchargez vos certificats.
          </p>
        </div>
        <Button asChild className="bg-brand-gradient text-white hover:opacity-90">
          <Link href="/rendez-vous">
            <Plus className="mr-1.5 h-4 w-4" /> Nouveau RDV
          </Link>
        </Button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {([
            { key: "upcoming", label: "À venir" },
            { key: "past", label: "Passés" },
            { key: "all", label: "Tous" },
          ] as { key: FilterKey; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                filter === tab.key
                  ? "bg-brand-gradient text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (code, plaque…)"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucun rendez-vous dans cette catégorie.</p>
            <Button asChild className="mt-4 bg-brand-gradient text-white hover:opacity-90">
              <Link href="/rendez-vous">
                <Plus className="mr-1.5 h-4 w-4" /> Prendre rendez-vous
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt, idx) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.2), duration: 0.25 }}
            >
              <AppointmentFullCard appt={appt} onShowQr={() => setQrAppt(appt)} />
            </motion.div>
          ))}
        </div>
      )}

      <QrDialog appointment={qrAppt} open={!!qrAppt} onOpenChange={(v) => !v && setQrAppt(null)} />
    </div>
  );
}

function AppointmentFullCard({
  appt,
  onShowQr,
}: {
  appt: AppointmentItem;
  onShowQr: () => void;
}) {
  const d = new Date(appt.date);
  const dateLabel = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const canShowQr = appt.status === "APPROVED" && !!appt.qrToken;
  const canDownloadCert =
    appt.status === "COMPLETED" && !!appt.result && appt.result.overallResult === "PASS";

  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: ref + status + date */}
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="text-lg font-bold leading-none">
                {d.toLocaleDateString("fr-FR", { day: "2-digit" })}
              </span>
              <span className="text-[10px] uppercase tracking-wide">
                {d.toLocaleDateString("fr-FR", { month: "short" })}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-[0.18em] text-foreground">{appt.code}</span>
                {appt.queueNumber ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    N° {appt.queueNumber} file
                  </Badge>
                ) : null}
                <StatusBadge status={appt.status} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {dateLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {appt.slot}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <CategoryBadge name={appt.category.name} color={appt.category.color} />
                <Badge variant="outline" className="font-medium text-foreground">
                  {appt.service.name}
                </Badge>
                <Badge variant="outline" className="text-primary">
                  {formatMAD(appt.service.price)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: vehicle + actions */}
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 lg:max-w-xs">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold uppercase text-foreground">{appt.vehiclePlate}</p>
                <p className="truncate text-xs text-muted-foreground">{appt.vehicleDesc}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canShowQr && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onShowQr}
                  className="border-primary/40 text-primary hover:bg-primary/10"
                >
                  <QrCode className="mr-1.5 h-4 w-4" /> Voir le QR
                </Button>
              )}
              {canDownloadCert && (
                <CertificateButton appointment={appt} size="sm" label="Certificat" />
              )}
            </div>
          </div>
        </div>

        {/* Notes (if any) */}
        {appt.notes ? (
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Note du centre :</p>
            <p className="mt-1">{appt.notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
