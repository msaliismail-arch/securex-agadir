"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, CalendarPlus } from "lucide-react";
import { DEFAULT_SLOTS } from "@/lib/constants";
import { isValidMaPhone, isValidMaPlate, normalizePhone, cn } from "@/lib/utils";
import type { Appointment, CategoryRef, ServiceRef } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (appt: Appointment) => void;
}

const VEHICLE_CATEGORIES = ["VOITURE", "MOTO", "CAMION", "UTILITAIRE"] as const;

export function NewRdvDialog({ open, onOpenChange, onCreated }: Props) {
  const [categories, setCategories] = useState<CategoryRef[]>([]);
  const [services, setServices] = useState<ServiceRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<string>("VOITURE");
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch("/api/categories?withServices=1").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ])
      .then(([cats, svcs]) => {
        setCategories(cats || []);
        setServices(svcs || []);
      })
      .catch(() => {
        toast.error("Impossible de charger les catégories / services");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setVehiclePlate("");
      setVehicleBrand("");
      setVehicleModel("");
      setVehicleYear("");
      setVehicleCategory("VOITURE");
      setCategoryId("");
      setServiceId("");
      setDate("");
      setSlot("");
      setNotes("");
    }
    onOpenChange(next);
  };

  const filteredServices = services.filter((s) => !categoryId || s.categoryId === categoryId);

  const submit = async () => {
    // Validation
    if (!clientName.trim()) return toast.error("Nom du client requis");
    if (!isValidMaPhone(clientPhone)) return toast.error("Téléphone marocain invalide (format +212)");
    if (!isValidMaPlate(vehiclePlate)) return toast.error("Plaque invalide (ex. 12345-A-6)");
    if (!categoryId) return toast.error("Catégorie requise");
    if (!serviceId) return toast.error("Service requis");
    if (!date) return toast.error("Date requise");
    if (!slot) return toast.error("Créneau requis");

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: normalizePhone(clientPhone),
          clientEmail: clientEmail.trim() || undefined,
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          vehicleBrand: vehicleBrand.trim() || undefined,
          vehicleModel: vehicleModel.trim() || undefined,
          vehicleYear: vehicleYear.trim() || undefined,
          vehicleCategory,
          categoryId,
          serviceId,
          date,
          slot,
          channel: "AGENT",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la création");
      }
      const appt = (await res.json()) as Appointment;
      toast.success(`RDV créé · Code ${appt.code}`);
      onCreated?.(appt);
      handleOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Échec de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 ring-1 ring-primary/20">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-foreground">Nouveau rendez-vous</DialogTitle>
              <DialogDescription>
                Créer manuellement une réservation pour un client.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <Section title="Client">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nom complet *">
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex. : Yassine El Amrani" />
                </Field>
                <Field label="Téléphone *">
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+212 6 12 34 56 78" />
                </Field>
                <Field label="Email (optionnel)">
                  <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" />
                </Field>
              </div>
            </Section>

            <Section title="Véhicule">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Plaque *">
                  <Input
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="12345-A-6"
                    className="font-mono uppercase"
                  />
                </Field>
                <Field label="Type">
                  <Select value={vehicleCategory} onValueChange={setVehicleCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Marque">
                  <Input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="Renault" />
                </Field>
                <Field label="Modèle">
                  <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Clio 5" />
                </Field>
                <Field label="Année">
                  <Input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="2021" />
                </Field>
              </div>
            </Section>

            <Section title="Prestation">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Catégorie *">
                  <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setServiceId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Service *">
                  <Select value={serviceId} onValueChange={setServiceId} disabled={!categoryId}>
                    <SelectTrigger><SelectValue placeholder={categoryId ? "Choisir…" : "Sélectionner une catégorie d'abord"} /></SelectTrigger>
                    <SelectContent>
                      {filteredServices.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {s.price} MAD
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Créneau">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date *">
                  <Input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Heure *">
                  <Select value={slot} onValueChange={setSlot}>
                    <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent>
                      {DEFAULT_SLOTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Notes (optionnel)">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires…"
                  rows={2}
                  className="mt-3"
                />
              </Field>
            </Section>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={submitting || loading} className="bg-brand-gradient text-white hover:opacity-90">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Créer le rendez-vous
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
        {title}
      </div>
      <div className={cn("space-y-1")}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
