"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  CalendarClock,
  Facebook,
  Instagram,
  Linkedin,
  Settings as SettingsIcon,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DEFAULTS: Record<string, string> = {
  "contact.address": "",
  "contact.phone": "",
  "contact.email": "",
  "contact.facebook": "",
  "contact.instagram": "",
  "contact.linkedin": "",
  "contact.tiktok": "",
  "hours.week": "08:00-18:00",
  "hours.sat": "08:00-13:00",
  "hours.sun": "Fermé",
  "slot.duration": "30",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Impossible de charger les paramètres");
        return;
      }
      const data = await res.json();
      setSettings({ ...DEFAULTS, ...(data ?? {}) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success("Paramètres enregistrés");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Paramètres système</h2>
          <p className="text-sm text-muted-foreground">
            Coordonnées, horaires d'ouverture et configuration des créneaux.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-primary text-white hover:bg-primary/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer les modifications
        </Button>
      </div>

      {/* Contact */}
      <Card className="border-l-4 border-primary/60 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Coordonnées du centre
          </CardTitle>
          <CardDescription className="text-xs">
            Adresse, téléphone et email affichés sur le site public.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Adresse</Label>
            <Input
              value={settings["contact.address"] ?? ""}
              onChange={(e) => set("contact.address", e.target.value)}
              placeholder="14 rue Cadi Ayad, Q.I., Agadir"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" /> Téléphone
              </Label>
              <Input
                value={settings["contact.phone"] ?? ""}
                onChange={(e) => set("contact.phone", e.target.value)}
                placeholder="+212 528 84 12 34"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <Input
                type="email"
                value={settings["contact.email"] ?? ""}
                onChange={(e) => set("contact.email", e.target.value)}
                placeholder="contact@securex-connect.ma"
              />
            </div>
          </div>
          <Separator />
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Réseaux sociaux
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Facebook className="h-3 w-3" /> Facebook
                </Label>
                <Input
                  value={settings["contact.facebook"] ?? ""}
                  onChange={(e) => set("contact.facebook", e.target.value)}
                  placeholder="https://facebook.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Instagram className="h-3 w-3" /> Instagram
                </Label>
                <Input
                  value={settings["contact.instagram"] ?? ""}
                  onChange={(e) => set("contact.instagram", e.target.value)}
                  placeholder="https://instagram.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </Label>
                <Input
                  value={settings["contact.linkedin"] ?? ""}
                  onChange={(e) => set("contact.linkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Music2 className="h-3 w-3" /> TikTok
                </Label>
                <Input
                  value={settings["contact.tiktok"] ?? ""}
                  onChange={(e) => set("contact.tiktok", e.target.value)}
                  placeholder="https://tiktok.com/@…"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card className="border-l-4 border-primary/60 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Horaires d'ouverture
          </CardTitle>
          <CardDescription className="text-xs">
            Format HH:mm-HH:mm, ou « Fermé » si le centre est fermé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Lundi — Vendredi</Label>
              <Input
                value={settings["hours.week"] ?? ""}
                onChange={(e) => set("hours.week", e.target.value)}
                placeholder="08:00-18:00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Samedi</Label>
              <Input
                value={settings["hours.sat"] ?? ""}
                onChange={(e) => set("hours.sat", e.target.value)}
                placeholder="08:00-13:00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dimanche</Label>
              <Input
                value={settings["hours.sun"] ?? ""}
                onChange={(e) => set("hours.sun", e.target.value)}
                placeholder="Fermé"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slots */}
      <Card className="border-l-4 border-primary/60 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            Configuration des créneaux
          </CardTitle>
          <CardDescription className="text-xs">
            Durée standard d'un créneau de rendez-vous (en minutes).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="w-40 space-y-1.5">
              <Label className="text-xs">Durée du créneau (min)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={settings["slot.duration"] ?? "30"}
                onChange={(e) => set("slot.duration", String(e.target.value))}
              />
            </div>
            <p className="pb-2 text-[12px] text-muted-foreground">
              Les créneaux seront générés par pas de cette durée sur les horaires d'ouverture.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <SettingsIcon className="h-3.5 w-3.5" />
          Les modifications sont journalisées dans le journal d'audit.
        </span>
        <Button onClick={save} disabled={saving} size="sm" className="bg-primary text-white hover:bg-primary/90">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
