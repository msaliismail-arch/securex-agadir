"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, CalendarDays, Clock, Car, User, ArrowRight, Home, Info, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COLOR_MAP } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { CategoryColor } from "@/lib/constants";

export interface BookingSuccessData {
  code: string;
  queueNumber: number;
  date: string; // ISO
  slot: string; // HH:mm
  categoryName: string;
  categoryColor: CategoryColor;
  serviceName: string;
  servicePrice: number;
  vehiclePlate: string;
  vehicleDesc: string;
  clientName: string;
  clientPhone: string;
}

export function BookingSuccess({ data }: { data: BookingSuccessData }) {
  const color = COLOR_MAP[data.categoryColor] ?? COLOR_MAP.emerald;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-14">
      <motion.div
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}
        className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-brand/10 ring-8 ring-emerald-brand/5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.2 }}
        >
          <CheckCircle2 className="h-16 w-16 text-emerald-brand" strokeWidth={2.2} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.4 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Rendez-vous confirmé !
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Votre créneau a été réservé. Conservez votre code de référence.
        </p>
      </motion.div>

      {/* Reference code card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.45 }}
        className="mt-8"
      >
        <Card className="overflow-hidden border-emerald-brand/30 bg-gradient-to-br from-emerald-50 to-emerald-brand/5">
          <CardContent className="px-6 py-7 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-brand">
              Votre code de référence
            </p>
            <p className="mt-3 font-mono text-5xl font-bold tracking-[0.32em] text-navy md:text-6xl">
              {data.code}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white">
              <Hash className="h-4 w-4 text-emerald-brand" />
              Vous êtes le N°{" "}
              <span className="text-base font-bold text-emerald-brand">{data.queueNumber}</span> de la file
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recap */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.45 }}
        className="mt-6"
      >
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Récapitulatif
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <RecapRow icon={<CalendarDays className="h-4 w-4 text-emerald-brand" />} label="Date" value={formatDate(data.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
              <RecapRow icon={<Clock className="h-4 w-4 text-emerald-brand" />} label="Créneau" value={data.slot} />
              <RecapRow
                icon={<span className={cn("inline-block h-2.5 w-2.5 rounded-full", color.bg)} />}
                label="Catégorie"
                value={data.categoryName}
              />
              <RecapRow icon={<Car className="h-4 w-4 text-emerald-brand" />} label="Service" value={data.serviceName} />
              <RecapRow icon={<Car className="h-4 w-4 text-emerald-brand" />} label="Véhicule" value={`${data.vehicleDesc} · ${data.vehiclePlate}`} />
              <RecapRow icon={<User className="h-4 w-4 text-emerald-brand" />} label="Client" value={`${data.clientName} · ${data.clientPhone}`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR note */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.45 }}
        className="mt-6"
      >
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div className="text-sm">
            <p className="font-semibold text-navy">Code QR de validation</p>
            <p className="mt-1 text-muted-foreground">
              Un code QR de validation vous sera remis <strong>après</strong> l&apos;inspection
              et la validation par notre équipe. Présentez votre code à l&apos;accueil le jour du
              contrôle. Conservez-le précieusement.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.45 }}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Button asChild size="lg" className="bg-emerald-brand hover:bg-emerald-brand/90">
          <Link href="/espace-client">
            Espace client <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">
            <Home className="mr-1.5 h-4 w-4" /> Retour à l&apos;accueil
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}

function RecapRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-navy">{value}</p>
      </div>
    </div>
  );
}
