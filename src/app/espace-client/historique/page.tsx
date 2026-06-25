"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
  Car,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  useClientData,
  type AppointmentItem,
} from "@/components/client/types";
import { CategoryBadge } from "@/components/client/badges";
import { CertificateButton } from "@/components/client/qr-dialog";
import { cn, formatDate } from "@/lib/utils";

const INSPECTION_FIELDS: { key: keyof AppointmentItem["result"]; label: string }[] = [
  { key: "brakes", label: "Freinage" },
  { key: "lights", label: "Éclairage" },
  { key: "tires", label: "Pneumatiques" },
  { key: "emissions", label: "Émissions" },
  { key: "bodywork", label: "Carrosserie" },
];

export default function HistoriquePage() {
  const router = useRouter();
  const { data, loading, error, unauthorized } = useClientData();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (unauthorized) router.replace("/espace-client");
  }, [unauthorized, router]);

  if (loading || unauthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-brand" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error || "Impossible de charger votre historique."}
        </CardContent>
      </Card>
    );
  }

  const completed = data.appointments
    .filter((a) => a.status === "COMPLETED" && a.result)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const passed = completed.filter((a) => a.result!.overallResult === "PASS").length;
  const failed = completed.filter((a) => a.result!.overallResult === "FAIL").length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/espace-client"
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-emerald-brand"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-navy md:text-3xl">Historique</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tous vos contrôles techniques réalisés chez SÉCUREX CONNECT.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Award className="h-5 w-5" />}
          label="Total contrôles"
          value={completed.length}
          tone="navy"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Acceptés"
          value={passed}
          tone="emerald"
        />
        <SummaryCard
          icon={<XCircle className="h-5 w-5" />}
          label="Refusés"
          value={failed}
          tone="red"
        />
      </div>

      {completed.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucun contrôle technique terminé pour le moment.
            </p>
            <Button asChild className="mt-4 bg-emerald-brand hover:bg-emerald-brand/90">
              <Link href="/rendez-vous">Prendre rendez-vous</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.map((appt) => {
                    const isOpen = expanded === appt.id;
                    const isPass = appt.result!.overallResult === "PASS";
                    return (
                      <React.Fragment key={appt.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => setExpanded(isOpen ? null : appt.id)}
                        >
                          <TableCell className="font-medium text-navy">
                            {formatDate(appt.date)}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold tracking-wider text-navy">{appt.code}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-mono text-xs font-semibold uppercase text-navy">{appt.vehiclePlate}</p>
                              <p className="text-xs text-muted-foreground">{appt.vehicleDesc}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CategoryBadge name={appt.category.name} color={appt.category.color} />
                          </TableCell>
                          <TableCell>
                            <ResultBadge pass={isPass} />
                          </TableCell>
                          <TableCell className="text-right">
                            {isPass ? (
                              <CertificateButton
                                appointment={appt}
                                size="sm"
                                label="Certificat"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isOpen && "rotate-180"
                              )}
                            />
                          </TableCell>
                        </TableRow>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.tr
                              key={`${appt.id}-detail`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-muted/20"
                            >
                              <TableCell colSpan={7} className="p-0">
                                <InspectionDetail appt={appt} />
                              </TableCell>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {completed.map((appt) => (
              <MobileHistoryCard key={appt.id} appt={appt} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "navy" | "emerald" | "red";
}) {
  const toneCls = {
    navy: "bg-navy/10 text-navy",
    emerald: "bg-emerald-brand/10 text-emerald-brand",
    red: "bg-red-50 text-red-700",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneCls[tone])}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-navy">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <Badge variant="outline" className="border-transparent bg-emerald-brand text-white">
      <CheckCircle2 className="mr-1 h-3 w-3" /> Accepté
    </Badge>
  ) : (
    <Badge variant="outline" className="border-transparent bg-red-500 text-white">
      <XCircle className="mr-1 h-3 w-3" /> Refusé
    </Badge>
  );
}

function InspectionDetail({ appt }: { appt: AppointmentItem }) {
  const r = appt.result!;
  const fields = INSPECTION_FIELDS.map((f) => ({
    label: f.label,
    pass: r[f.key] === "PASS",
  }));
  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map((f) => (
          <div
            key={f.label}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-2.5",
              f.pass ? "border-emerald-brand/30 bg-emerald-50" : "border-red-300 bg-red-50"
            )}
          >
            {f.pass ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-brand" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
              <p className={cn("text-sm font-semibold", f.pass ? "text-emerald-brand" : "text-red-600")}>
                {f.pass ? "OK" : "Défaut"}
              </p>
            </div>
          </div>
        ))}
      </div>
      {r.notes ? (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold text-navy">Notes de l&apos;inspecteur</p>
            <p className="mt-0.5 text-muted-foreground">{r.notes}</p>
          </div>
        </div>
      ) : null}
      {r.inspector ? (
        <p className="text-xs text-muted-foreground">
          Inspecté par <span className="font-medium text-navy">{r.inspector}</span> le {formatDate(r.createdAt)}
        </p>
      ) : null}
    </div>
  );
}

function MobileHistoryCard({ appt }: { appt: AppointmentItem }) {
  const r = appt.result!;
  const isPass = r.overallResult === "PASS";
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-navy">{appt.code}</span>
              <ResultBadge pass={isPass} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(appt.date)} · {appt.service.name}
            </p>
            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/40 p-2">
              <Car className="h-3.5 w-3.5 shrink-0 text-emerald-brand" />
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase text-navy">{appt.vehiclePlate}</p>
                <p className="truncate text-[11px] text-muted-foreground">{appt.vehicleDesc}</p>
              </div>
            </div>
          </div>
        </div>
        {isPass ? (
          <CertificateButton
            appointment={appt}
            size="sm"
            label="Télécharger le certificat"
            className="mt-3 w-full"
          />
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Masquer" : "Voir"} les défauts
            <ChevronDown className={cn("ml-1.5 h-4 w-4 transition-transform", open && "rotate-180")} />
          </Button>
        )}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <InspectionDetail appt={appt} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
