"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Appointment } from "./types";
import { CategoryBadge, StatusBadge } from "./badges";
import { QrDisplay } from "./qr-display";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  adminName: string;
  onApproved?: (updated: Appointment) => void;
}

type Phase = "confirm" | "submitting" | "success" | "error";

export function ValidationDialog({
  open,
  onOpenChange,
  appointment,
  adminName,
  onApproved,
}: Props) {
  const [inspector, setInspector] = useState(adminName);
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>("confirm");
  const [approvedAppt, setApprovedAppt] = useState<Appointment | null>(null);

  // Reset state when dialog opens for a new appointment
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setInspector(adminName);
      setNotes("");
      setPhase("confirm");
      setApprovedAppt(null);
    }
    onOpenChange(next);
  };

  if (!appointment) return null;

  const approve = async () => {
    setPhase("submitting");
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          notes: notes ? `[Validé par ${inspector}] ${notes}` : `[Validé par ${inspector}]`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'approbation");
      }
      const updated = (await res.json()) as Appointment;
      setApprovedAppt(updated);
      setPhase("success");
      toast.success("RDV validé · QR de validation généré");
      onApproved?.(updated);
    } catch (e: any) {
      setPhase("error");
      toast.error(e.message || "Échec de l'approbation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {phase === "success" && approvedAppt ? (
          <SuccessView
            appt={approvedAppt}
            onClose={() => handleOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 ring-1 ring-primary/20">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-foreground">Valider le rendez-vous</DialogTitle>
                  <DialogDescription>
                    Approuver et générer le QR de validation pour le client.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <RecapCard appt={appointment} />

            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="inspector" className="text-xs font-medium">
                  Inspecteur / Validateur
                </Label>
                <Input
                  id="inspector"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="Nom de l'inspecteur"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium">
                  Notes (optionnel)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations, remarques sur le contrôle…"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={phase === "submitting"}
              >
                Annuler
              </Button>
              <Button
                onClick={approve}
                disabled={phase === "submitting" || !inspector.trim()}
                className="bg-brand-gradient text-white hover:opacity-90"
              >
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validation…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Approuver & générer le QR
                  </>
                )}
              </Button>
            </DialogFooter>

            {phase === "error" && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Une erreur est survenue. Réessayez.
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessView({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center text-center"
      >
        <div className="rounded-full bg-primary/15 p-3 ring-4 ring-primary/10">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-foreground">Rendez-vous validé</h3>
        <p className="text-xs text-muted-foreground">
          Le QR de validation a été généré avec succès.
        </p>
      </motion.div>

      <div className="flex justify-center">
        {appt.qrToken && <QrDisplay token={appt.qrToken} size={200} />}
      </div>

      <div className="rounded-lg bg-brand-gradient-soft border border-primary/20 px-3 py-2.5 text-center">
        <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
          Code de référence client
        </div>
        <div className="font-mono text-2xl font-bold text-primary tracking-[0.25em] mt-1">
          {appt.code}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Le client peut désormais récupérer son QR dans son espace client et le présenter à la réception.
      </p>

      <div className="flex justify-end">
        <Button onClick={onClose} className="bg-brand-gradient text-white hover:opacity-90">
          Fermer
        </Button>
      </div>
    </div>
  );
}

function RecapCard({ appt }: { appt: Appointment }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono font-bold text-foreground tracking-wider">{appt.code}</div>
        <StatusBadge status={appt.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Field label="Client" value={appt.clientName} />
        <Field label="Téléphone" value={appt.clientPhone} />
        <Field label="Plaque" value={appt.vehiclePlate} mono />
        <Field label="Véhicule" value={appt.vehicleDesc} />
        <Field
          label="Date"
          value={`${formatDate(appt.date, { day: "2-digit", month: "short" })} · ${appt.slot}`}
        />
        <Field label="Service" value={appt.service?.name || "—"} />
      </div>
      {appt.category && (
        <div className="pt-1">
          <CategoryBadge color={appt.category.color} label={appt.category.name} />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono font-medium text-foreground" : "font-medium text-foreground"}>{value}</div>
    </div>
  );
}

export { X };
