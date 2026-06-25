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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import type { Appointment } from "./types";
import { StatusBadge } from "./badges";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onRejected?: (updated: Appointment) => void;
}

export function RejectDialog({ open, onOpenChange, appointment, onRejected }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setReason("");
    }
    onOpenChange(next);
  };

  if (!appointment) return null;

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Veuillez indiquer un motif de rejet");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          notes: `[Rejeté] ${reason.trim()}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors du rejet");
      }
      const updated = (await res.json()) as Appointment;
      toast.success("RDV rejeté");
      onRejected?.(updated);
      handleOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Échec du rejet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-destructive/10 p-2 ring-1 ring-destructive/20">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-foreground">Rejeter le rendez-vous</DialogTitle>
              <DialogDescription>
                Le client sera informé que son RDV a été refusé.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono font-bold text-foreground">{appointment.code}</div>
            <StatusBadge status={appointment.status} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {appointment.clientName} · {appointment.vehiclePlate} · {appointment.service?.name}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason" className="text-xs font-medium">
            Motif du rejet <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : Véhicule non conforme, documents manquants, créneau indisponible…"
            rows={4}
            maxLength={500}
          />
          <div className="flex items-center justify-end text-[10px] text-muted-foreground">
            {reason.length}/500
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Cette action est réversible (le RDV peut être ré-ouvert plus tard), mais le client
            verra le statut « Rejeté ».
          </span>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejet…
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmer le rejet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
