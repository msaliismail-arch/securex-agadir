"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Loader2,
  Award,
  CheckCircle2,
  XCircle,
  Car,
  Lightbulb,
  Disc3,
  Wind,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Appointment } from "./types";
import { StatusBadge } from "./badges";

type Pass = "PASS" | "FAIL";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  adminName: string;
  onCompleted?: (updated: Appointment) => void;
}

const CHECKS: { key: keyof Pick<Checks, "brakes" | "lights" | "tires" | "emissions" | "bodywork">; label: string; icon: any }[] = [
  { key: "brakes", label: "Freinage", icon: Disc3 },
  { key: "lights", label: "Éclairage", icon: Lightbulb },
  { key: "tires", label: "Pneumatiques", icon: Car },
  { key: "emissions", label: "Émissions", icon: Wind },
  { key: "bodywork", label: "Carrosserie", icon: Shield },
];

type Checks = { brakes: Pass; lights: Pass; tires: Pass; emissions: Pass; bodywork: Pass };

export function CompleteDialog({
  open,
  onOpenChange,
  appointment,
  adminName,
  onCompleted,
}: Props) {
  const [inspector, setInspector] = useState(adminName);
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState<Checks>({
    brakes: "PASS",
    lights: "PASS",
    tires: "PASS",
    emissions: "PASS",
    bodywork: "PASS",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setInspector(adminName);
      setNotes("");
      setChecks({ brakes: "PASS", lights: "PASS", tires: "PASS", emissions: "PASS", bodywork: "PASS" });
    }
    onOpenChange(next);
  };

  const overall: Pass = useMemo(
    () => (Object.values(checks).some((v) => v === "FAIL") ? "FAIL" : "PASS"),
    [checks],
  );

  if (!appointment) return null;

  const submit = async () => {
    if (!inspector.trim()) {
      toast.error("Veuillez indiquer le nom de l'inspecteur");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallResult: overall,
          brakes: checks.brakes,
          lights: checks.lights,
          tires: checks.tires,
          emissions: checks.emissions,
          bodywork: checks.bodywork,
          inspector: inspector.trim(),
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de l'enregistrement");
      }
      const data = await res.json();
      toast.success(
        overall === "PASS"
          ? "Contrôle enregistré · RDV terminé (Conforme)"
          : "Contrôle enregistré · RDV terminé (Non conforme)",
      );
      onCompleted?.(data.appointment as Appointment);
      handleOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 ring-1 ring-primary/20">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-foreground">Marquer comme terminé</DialogTitle>
              <DialogDescription>
                Enregistrer les résultats du contrôle technique.
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

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Points de contrôle
            </Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CHECKS.map(({ key, label, icon: Icon }) => (
                <CheckRow
                  key={key}
                  label={label}
                  icon={Icon}
                  value={checks[key]}
                  onChange={(v) => setChecks((c) => ({ ...c, [key]: v }))}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Résultat global (auto)
              </div>
              <div className="text-sm font-semibold text-foreground">
                {overall === "PASS" ? "Conforme" : "Non conforme"}
              </div>
            </div>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold",
                overall === "PASS"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20",
              )}
            >
              {overall === "PASS" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> PASS
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" /> FAIL
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inspector" className="text-xs font-medium">
                Inspecteur
              </Label>
              <Input
                id="inspector"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes" className="text-xs font-medium">
                Notes d'inspection (optionnel)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations complémentaires, recommandations…"
                rows={3}
                maxLength={800}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="bg-brand-gradient text-white hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Enregistrer & terminer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckRow({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: any;
  value: Pass;
  onChange: (v: Pass) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm font-medium text-foreground">{label}</div>
      </div>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as Pass)}
        className="flex items-center gap-4"
      >
        <label
          className={cn(
            "flex items-center gap-1.5 cursor-pointer text-xs font-medium rounded-md px-2 py-1 border",
            value === "PASS"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-card text-muted-foreground border-border hover:bg-muted/40",
          )}
        >
          <RadioGroupItem value="PASS" className="sr-only" />
          <CheckCircle2 className="h-3.5 w-3.5" />
          Conforme
        </label>
        <label
          className={cn(
            "flex items-center gap-1.5 cursor-pointer text-xs font-medium rounded-md px-2 py-1 border",
            value === "FAIL"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-card text-muted-foreground border-border hover:bg-muted/40",
          )}
        >
          <RadioGroupItem value="FAIL" className="sr-only" />
          <XCircle className="h-3.5 w-3.5" />
          Défaut
        </label>
      </RadioGroup>
    </div>
  );
}
