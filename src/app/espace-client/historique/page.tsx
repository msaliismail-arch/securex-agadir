"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

import {
  cn,
  formatDate,
} from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type InspectionResult =
  NonNullable<AppointmentItem["result"]>;

type InspectionFieldKey =
  | "brakes"
  | "lights"
  | "tires"
  | "emissions"
  | "bodywork";

type CompletedAppointment =
  AppointmentItem & {
    result: InspectionResult;
  };

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const INSPECTION_FIELDS: {
  key: InspectionFieldKey;
  label: string;
}[] = [
  {
    key: "brakes",
    label: "Freinage",
  },
  {
    key: "lights",
    label: "Éclairage",
  },
  {
    key: "tires",
    label: "Pneumatiques",
  },
  {
    key: "emissions",
    label: "Émissions",
  },
  {
    key: "bodywork",
    label: "Carrosserie",
  },
];

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function HistoriquePage() {
  const router = useRouter();

  const {
    data,
    loading,
    error,
    unauthorized,
  } = useClientData();

  const [
    expanded,
    setExpanded,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (unauthorized) {
      router.replace(
        "/espace-client",
      );
    }
  }, [
    unauthorized,
    router,
  ]);

  if (
    loading ||
    unauthorized
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error ||
            "Impossible de charger votre historique."}
        </CardContent>
      </Card>
    );
  }

  const completed =
    data.appointments
      .filter(
        (
          appointment,
        ): appointment is CompletedAppointment =>
          appointment.status ===
            "COMPLETED" &&
          appointment.result !==
            null,
      )
      .sort(
        (a, b) =>
          new Date(
            b.date,
          ).getTime() -
          new Date(
            a.date,
          ).getTime(),
      );

  const passed =
    completed.filter(
      (appointment) =>
        appointment.result
          .overallResult ===
        "PASS",
    ).length;

  const failed =
    completed.filter(
      (appointment) =>
        appointment.result
          .overallResult ===
        "FAIL",
    ).length;

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <Link
          href="/espace-client"
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" />

          Tableau de bord
        </Link>

        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Historique
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Tous vos contrôles techniques réalisés chez SÉCUREX CONNECT.
        </p>
      </div>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={
            <Award className="h-5 w-5" />
          }
          label="Total contrôles"
          value={
            completed.length
          }
          tone="info"
        />

        <SummaryCard
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="Acceptés"
          value={
            passed
          }
          tone="primary"
        />

        <SummaryCard
          icon={
            <XCircle className="h-5 w-5" />
          }
          label="Refusés"
          value={
            failed
          }
          tone="red"
        />
      </div>

      {/* Empty state */}

      {completed.length ===
      0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />

            <p className="text-sm text-muted-foreground">
              Aucun contrôle technique terminé pour le moment.
            </p>

            <Button
              asChild
              className="mt-4 bg-brand-gradient text-white hover:opacity-90"
            >
              <Link href="/rendez-vous">
                Prendre rendez-vous
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop */}

          <Card className="glass-card hidden md:block">
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto scroll-thin">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[120px]">
                        Date
                      </TableHead>

                      <TableHead>
                        Référence
                      </TableHead>

                      <TableHead>
                        Véhicule
                      </TableHead>

                      <TableHead>
                        Catégorie
                      </TableHead>

                      <TableHead>
                        Résultat
                      </TableHead>

                      <TableHead className="text-right">
                        Actions
                      </TableHead>

                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {completed.map(
                      (
                        appointment,
                      ) => {
                        const isOpen =
                          expanded ===
                          appointment.id;

                        const isPass =
                          appointment
                            .result
                            .overallResult ===
                          "PASS";

                        return (
                          <React.Fragment
                            key={
                              appointment.id
                            }
                          >
                            <TableRow
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() =>
                                setExpanded(
                                  isOpen
                                    ? null
                                    : appointment.id,
                                )
                              }
                            >
                              <TableCell className="font-medium text-foreground">
                                {formatDate(
                                  appointment.date,
                                )}
                              </TableCell>

                              <TableCell>
                                <span className="font-mono font-bold tracking-wider text-foreground">
                                  {
                                    appointment.code
                                  }
                                </span>
                              </TableCell>

                              <TableCell>
                                <div>
                                  <p className="font-mono text-xs font-semibold uppercase text-foreground">
                                    {
                                      appointment.vehiclePlate
                                    }
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {
                                      appointment.vehicleDesc
                                    }
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <CategoryBadge
                                  name={
                                    appointment.category.name
                                  }
                                  color={
                                    appointment.category.color
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                <ResultBadge
                                  pass={
                                    isPass
                                  }
                                />
                              </TableCell>

                              <TableCell
                                className="text-right"
                                onClick={(
                                  event,
                                ) =>
                                  event.stopPropagation()
                                }
                              >
                                {isPass ? (
                                  <CertificateButton
                                    appointment={
                                      appointment
                                    }
                                    size="sm"
                                    label="Certificat"
                                  />
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>

                              <TableCell>
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",

                                    isOpen &&
                                      "rotate-180",
                                  )}
                                />
                              </TableCell>
                            </TableRow>

                            <AnimatePresence
                              initial={
                                false
                              }
                            >
                              {isOpen && (
                                <motion.tr
                                  key={`${appointment.id}-detail`}
                                  initial={{
                                    opacity:
                                      0,
                                  }}
                                  animate={{
                                    opacity:
                                      1,
                                  }}
                                  exit={{
                                    opacity:
                                      0,
                                  }}
                                  transition={{
                                    duration:
                                      0.2,
                                  }}
                                  className="bg-muted/20"
                                >
                                  <TableCell
                                    colSpan={
                                      7
                                    }
                                    className="p-0"
                                  >
                                    <InspectionDetail
                                      appt={
                                        appointment
                                      }
                                    />
                                  </TableCell>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      },
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile */}

          <div className="space-y-3 md:hidden">
            {completed.map(
              (
                appointment,
              ) => (
                <MobileHistoryCard
                  key={
                    appointment.id
                  }
                  appt={
                    appointment
                  }
                />
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Summary card                                */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone:
    | "info"
    | "primary"
    | "red";
}) {
  const toneClasses = {
    info:
      "bg-info/10 text-info",

    primary:
      "bg-primary/10 text-primary",

    red:
      "bg-destructive/10 text-destructive",
  } as const;

  return (
    <Card className="glass-card">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            toneClasses[
              tone
            ],
          )}
        >
          {icon}
        </div>

        <div>
          <p className="text-2xl font-bold leading-none text-foreground">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Result badge                                */
/* -------------------------------------------------------------------------- */

function ResultBadge({
  pass,
}: {
  pass: boolean;
}) {
  if (pass) {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-primary text-white"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />

        Accepté
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-transparent bg-destructive text-white"
    >
      <XCircle className="mr-1 h-3 w-3" />

      Refusé
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Inspection detail                              */
/* -------------------------------------------------------------------------- */

function InspectionDetail({
  appt,
}: {
  appt: CompletedAppointment;
}) {
  const result =
    appt.result;

  const fields =
    INSPECTION_FIELDS.map(
      (field) => ({
        label:
          field.label,

        pass:
          result[
            field.key
          ] === "PASS",
      }),
    );

  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map(
          (field) => (
            <div
              key={
                field.label
              }
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5",

                field.pass
                  ? "border-primary/30 bg-primary/5"
                  : "border-destructive/30 bg-destructive/5",
              )}
            >
              {field.pass ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {
                    field.label
                  }
                </p>

                <p
                  className={cn(
                    "text-sm font-semibold",

                    field.pass
                      ? "text-primary"
                      : "text-destructive",
                  )}
                >
                  {field.pass
                    ? "OK"
                    : "Défaut"}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      {result.notes ? (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <div>
            <p className="font-semibold text-foreground">
              Notes de l&apos;inspecteur
            </p>

            <p className="mt-0.5 text-muted-foreground">
              {
                result.notes
              }
            </p>
          </div>
        </div>
      ) : null}

      {result.inspector ? (
        <p className="text-xs text-muted-foreground">
          Inspecté par{" "}
          <span className="font-medium text-foreground">
            {
              result.inspector
            }
          </span>{" "}
          le{" "}
          {formatDate(
            result.createdAt,
          )}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Mobile history                                */
/* -------------------------------------------------------------------------- */

function MobileHistoryCard({
  appt,
}: {
  appt: CompletedAppointment;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const isPass =
    appt.result
      .overallResult ===
    "PASS";

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-foreground">
                {appt.code}
              </span>

              <ResultBadge
                pass={
                  isPass
                }
              />
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(
                appt.date,
              )}{" "}
              ·{" "}
              {
                appt.service.name
              }
            </p>

            <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/40 p-2">
              <Car className="h-3.5 w-3.5 shrink-0 text-primary" />

              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase text-foreground">
                  {
                    appt.vehiclePlate
                  }
                </p>

                <p className="truncate text-[11px] text-muted-foreground">
                  {
                    appt.vehicleDesc
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {isPass ? (
          <CertificateButton
            appointment={
              appt
            }
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
            onClick={() =>
              setOpen(
                (value) =>
                  !value,
              )
            }
          >
            {open
              ? "Masquer"
              : "Voir"}{" "}
            les défauts

            <ChevronDown
              className={cn(
                "ml-1.5 h-4 w-4 transition-transform",

                open &&
                  "rotate-180",
              )}
            />
          </Button>
        )}

        <AnimatePresence
          initial={false}
        >
          {open && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <InspectionDetail
                appt={
                  appt
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}