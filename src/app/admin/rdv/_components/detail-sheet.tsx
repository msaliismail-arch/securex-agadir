"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Car,
  Calendar,
  Clock,
  Wrench,
  FileText,
  QrCode,
  Hash,
  Award,
  CheckCircle2,
  XCircle,
  StickyNote,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Appointment } from "./types";
import { CategoryBadge, StatusBadge } from "./badges";
import { QrDisplay } from "./qr-display";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  adminName: string;
  onValidate?: (appt: Appointment) => void;
  onReject?: (appt: Appointment) => void;
  onComplete?: (appt: Appointment) => void;
}

export function DetailSheet({
  open,
  onOpenChange,
  appointment,
  adminName,
  onValidate,
  onReject,
  onComplete,
}: Props) {
  if (!appointment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-y-auto scroll-thin">
        <SheetHeader className="px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-foreground flex items-center gap-2">
              <span className="font-mono text-lg tracking-wider">{appointment.code}</span>
              {appointment.queueNumber != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info border border-info/20">
                  <Hash className="h-3 w-3" /> FILE {appointment.queueNumber}
                </span>
              )}
            </SheetTitle>
            <StatusBadge status={appointment.status} />
          </div>
          <SheetDescription className="sr-only">
            Détails complets du rendez-vous {appointment.code}
          </SheetDescription>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* Client */}
          <Section icon={User} title="Client">
            <div className="grid grid-cols-1 gap-2">
              <InfoLine icon={User} label="Nom" value={appointment.clientName} />
              <InfoLine icon={Phone} label="Téléphone" value={appointment.clientPhone} />
            </div>
          </Section>

          <Separator />

          {/* Vehicle */}
          <Section icon={Car} title="Véhicule">
            <div className="grid grid-cols-1 gap-2">
              <InfoLine icon={Car} label="Plaque" value={appointment.vehiclePlate} mono />
              <InfoLine icon={FileText} label="Description" value={appointment.vehicleDesc} />
            </div>
          </Section>

          <Separator />

          {/* Service & creneau */}
          <Section icon={Wrench} title="Prestation & créneau">
            <div className="grid grid-cols-1 gap-2">
              <InfoLine icon={Wrench} label="Service" value={appointment.service?.name || "—"} />
              {appointment.category && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground w-20">Catégorie</span>
                  <CategoryBadge color={appointment.category.color} label={appointment.category.name} />
                </div>
              )}
              <InfoLine icon={Calendar} label="Date" value={formatDate(appointment.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
              <InfoLine icon={Clock} label="Créneau" value={appointment.slot} />
            </div>
          </Section>

          <Separator />

          {/* Notes */}
          {appointment.notes && (
            <>
              <Section icon={StickyNote} title="Notes">
                <div className="rounded-md bg-warning/10 border border-warning/20 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                  {appointment.notes}
                </div>
              </Section>
              <Separator />
            </>
          )}

          {/* QR de validation */}
          {appointment.qrToken && (
            <>
              <Section icon={QrCode} title="QR de validation">
                <div className="flex justify-center py-2">
                  <QrDisplay
                    token={appointment.qrToken}
                    size={200}
                    caption={`Généré le ${appointment.qrGeneratedAt ? formatDateTime(appointment.qrGeneratedAt) : "—"}`}
                  />
                </div>
              </Section>
              <Separator />
            </>
          )}

          {/* Résultat d'inspection */}
          {appointment.result && (
            <>
              <Section icon={Award} title="Résultat du contrôle">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">Résultat global</div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ${
                        appointment.result.overallResult === "PASS"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {appointment.result.overallResult === "PASS" ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> CONFORME</>
                      ) : (
                        <><XCircle className="h-3.5 w-3.5" /> NON CONFORME</>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <SubResult label="Freinage" v={appointment.result.brakes} />
                    <SubResult label="Éclairage" v={appointment.result.lights} />
                    <SubResult label="Pneumatiques" v={appointment.result.tires} />
                    <SubResult label="Émissions" v={appointment.result.emissions} />
                    <SubResult label="Carrosserie" v={appointment.result.bodywork} />
                  </div>
                  {appointment.result.inspector && (
                    <div className="text-xs text-muted-foreground pt-1">
                      Inspecteur : <span className="font-medium text-foreground">{appointment.result.inspector}</span>
                    </div>
                  )}
                  {appointment.result.notes && (
                    <div className="text-xs text-muted-foreground pt-1 border-t border-border mt-2 pt-2">
                      {appointment.result.notes}
                    </div>
                  )}
                </div>
              </Section>
              <Separator />
            </>
          )}

          {/* Dates système */}
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div>Créé le {formatDateTime(appointment.createdAt)}</div>
            <div>Modifié le {formatDateTime(appointment.updatedAt)}</div>
          </div>
        </div>

        {/* Footer actions */}
        {(appointment.status === "PENDING" ||
          appointment.status === "APPROVED") && (
          <div className="sticky bottom-0 border-t border-border bg-card p-4 flex flex-wrap gap-2">
            {appointment.status === "PENDING" && (
              <>
                <Button
                  className="flex-1 bg-brand-gradient text-white hover:opacity-90"
                  onClick={() => {
                    onValidate?.(appointment);
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Valider
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    onReject?.(appointment);
                    onOpenChange(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Rejeter
                </Button>
              </>
            )}
            {appointment.status === "APPROVED" && (
              <Button
                className="flex-1 bg-brand-gradient text-white hover:opacity-90"
                onClick={() => {
                  onComplete?.(appointment);
                  onOpenChange(false);
                }}
              >
                <Award className="h-4 w-4 mr-2" /> Marquer terminé
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className={mono ? "font-mono font-medium text-foreground" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}

function SubResult({ label, v }: { label: string; v: string }) {
  const pass = v === "PASS";
  return (
    <div className={`flex items-center justify-between rounded-md border px-2 py-1 ${
      pass ? "bg-primary/5 border-primary/15" : "bg-destructive/5 border-destructive/15"
    }`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${pass ? "text-primary" : "text-destructive"}`}>
        {pass ? "OK" : "KO"}
      </span>
    </div>
  );
}
