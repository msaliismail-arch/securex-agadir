"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Save,
  RefreshCw,
  Globe2,
  Sparkles,
  Hash,
  Layers,
  Wrench,
  MessageSquareQuote,
  MapPin,
  Rocket,
  Eye,
  EyeOff,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/** Default fallback content (matches seed.ts). */
const DEFAULTS: Record<string, string> = {
  "hero.badge": "Agréé Ministère du Transport",
  "hero.title": "Contrôle technique automobile agréé à Agadir",
  "hero.titleHighlight": "agréé",
  "hero.subtitle":
    "Sécurité, fiabilité et conformité pour tous vos véhicules. Prenez rendez-vous en ligne et recevez votre certificat officiel en 30 minutes.",
  "hero.ctaPrimary": "Prendre rendez-vous",
  "hero.ctaSecondary": "Voir les tarifs",
  "stats.controls": "15000",
  "stats.controlsSuffix": "+",
  "stats.controlsLabel": "Contrôles réalisés",
  "stats.satisfaction": "49",
  "stats.satisfactionSuffix": "/50",
  "stats.satisfactionLabel": "Satisfaction client",
  "stats.duration": "30",
  "stats.durationSuffix": " min",
  "stats.durationLabel": "Durée moyenne",
  "stats.certified": "100",
  "stats.certifiedSuffix": "%",
  "stats.certifiedLabel": "Agréé & conforme",
  "steps.title": "Comment ça marche ?",
  "steps.subtitle": "Quatre étapes pour un contrôle technique sans tracas.",
  "features.title": "Pourquoi nous choisir ?",
  "features.subtitle":
    "Une expérience de contrôle technique moderne, fiable et sans surprise.",
  "testimonials.title": "Ils nous font confiance",
  "contact.title": "Nous trouver à Agadir",
  "contact.subtitle": "Facile d'accès au Quartier Industriel d'Agadir.",
  "cta.title": "Prêt à passer le contrôle technique ?",
  "cta.subtitle":
    "Réservez votre créneau en ligne dès maintenant et évitez l'attente. Certification officielle garantie.",
};

type FieldDef = {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  placeholder?: string;
};

type SectionDef = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  fields: FieldDef[];
};

const SECTIONS: SectionDef[] = [
  {
    id: "hero",
    label: "Hero",
    icon: Sparkles,
    description: "Section d'accueil en haut de la page d'accueil.",
    fields: [
      { key: "hero.badge", label: "Badge (pastille au-dessus du titre)", placeholder: "Agréé Ministère du Transport" },
      { key: "hero.title", label: "Titre principal", multiline: true, placeholder: "Contrôle technique automobile agréé à Agadir" },
      { key: "hero.titleHighlight", label: "Mot mis en évidence (apparait en vert)", placeholder: "agréé" },
      { key: "hero.subtitle", label: "Sous-titre", multiline: true, placeholder: "Sécurité, fiabilité et conformité…" },
      { key: "hero.ctaPrimary", label: "Bouton principal (CTA)", placeholder: "Prendre rendez-vous" },
      { key: "hero.ctaSecondary", label: "Bouton secondaire (CTA)", placeholder: "Voir les tarifs" },
    ],
  },
  {
    id: "stats",
    label: "Statistiques",
    icon: Hash,
    description: "Bande de chiffres clés affiché sous le hero.",
    fields: [
      { key: "stats.controls", label: "Valeur — Contrôles réalisés", placeholder: "15000" },
      { key: "stats.controlsSuffix", label: "Suffixe — Contrôles réalisés", placeholder: "+" },
      { key: "stats.controlsLabel", label: "Libellé — Contrôles réalisés", placeholder: "Contrôles réalisés" },
      { key: "stats.satisfaction", label: "Valeur — Satisfaction client", placeholder: "49" },
      { key: "stats.satisfactionSuffix", label: "Suffixe — Satisfaction client", placeholder: "/50" },
      { key: "stats.satisfactionLabel", label: "Libellé — Satisfaction client", placeholder: "Satisfaction client" },
      { key: "stats.duration", label: "Valeur — Durée moyenne", placeholder: "30" },
      { key: "stats.durationSuffix", label: "Suffixe — Durée moyenne", placeholder: " min" },
      { key: "stats.durationLabel", label: "Libellé — Durée moyenne", placeholder: "Durée moyenne" },
      { key: "stats.certified", label: "Valeur — Agréé & conforme", placeholder: "100" },
      { key: "stats.certifiedSuffix", label: "Suffixe — Agréé & conforme", placeholder: "%" },
      { key: "stats.certifiedLabel", label: "Libellé — Agréé & conforme", placeholder: "Agréé & conforme" },
    ],
  },
  {
    id: "steps",
    label: "Étapes",
    icon: Layers,
    description: "Section « Comment ça marche » (4 étapes).",
    fields: [
      { key: "steps.title", label: "Titre de la section", placeholder: "Comment ça marche ?" },
      { key: "steps.subtitle", label: "Sous-titre de la section", multiline: true, placeholder: "Quatre étapes pour un contrôle technique sans tracas." },
    ],
  },
  {
    id: "features",
    label: "Fonctionnalités",
    icon: Wrench,
    description: "Section « Pourquoi nous choisir ».",
    fields: [
      { key: "features.title", label: "Titre de la section", placeholder: "Pourquoi nous choisir ?" },
      { key: "features.subtitle", label: "Sous-titre de la section", multiline: true, placeholder: "Une expérience de contrôle technique moderne…" },
    ],
  },
  {
    id: "testimonials",
    label: "Témoignages",
    icon: MessageSquareQuote,
    description: "Section des avis clients.",
    fields: [
      { key: "testimonials.title", label: "Titre de la section", placeholder: "Ils nous font confiance" },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    icon: MapPin,
    description: "Section carte + coordonnées.",
    fields: [
      { key: "contact.title", label: "Titre de la section", placeholder: "Nous trouver à Agadir" },
      { key: "contact.subtitle", label: "Sous-titre de la section", multiline: true, placeholder: "Facile d'accès au Quartier Industriel d'Agadir." },
    ],
  },
  {
    id: "cta",
    label: "CTA final",
    icon: Rocket,
    description: "Bloc d'appel à l'action en bas de la page.",
    fields: [
      { key: "cta.title", label: "Titre du CTA", placeholder: "Prêt à passer le contrôle technique ?" },
      { key: "cta.subtitle", label: "Sous-titre du CTA", multiline: true, placeholder: "Réservez votre créneau en ligne dès maintenant…" },
    ],
  },
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

export default function WebsiteContentPage() {
  const [content, setContent] = useState<Record<string, string>>(DEFAULTS);
  const [initial, setInitial] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/website-content", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Impossible de charger le contenu");
        return;
      }
      const data = (await res.json()) as Record<string, string>;
      const merged: Record<string, string> = { ...DEFAULTS };
      for (const k of ALL_KEYS) {
        if (data[k] !== undefined) merged[k] = data[k];
      }
      setContent(merged);
      setInitial(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set(key: string, value: string) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const k of ALL_KEYS) {
      if ((content[k] ?? "") !== (initial[k] ?? "")) n++;
    }
    return n;
  }, [content, initial]);

  async function save() {
    if (dirtyCount === 0) {
      toast.info("Aucune modification à enregistrer");
      return;
    }
    setSaving(true);
    try {
      // Send only the keys we manage
      const payload: Record<string, string> = {};
      for (const k of ALL_KEYS) payload[k] = content[k] ?? "";
      const res = await fetch("/api/website-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success(`${dirtyCount} bloc(s) de contenu mis à jour`);
      setInitial({ ...content });
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setContent({ ...initial });
    toast.info("Modifications non enregistrées annulées");
    setResetOpen(false);
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
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
            <Globe2 className="h-5 w-5 text-primary" />
            Gestion du site
          </h2>
          <p className="text-sm text-muted-foreground">
            Modifiez tous les textes et titres du site public sans toucher au code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setResetOpen(true)} disabled={dirtyCount === 0}>
            <RefreshCw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button
            onClick={save}
            disabled={saving || dirtyCount === 0}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        </div>
      </div>

      {/* Hint banner */}
      <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-[12px] text-foreground/80">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-foreground">Éditeur de contenu du site public</p>
          <p className="mt-0.5">
            Chaque champ ci-dessous contrôle un texte précis de la page d'accueil.
            Modifiez, enregistrez, et les changements apparaissent immédiatement sur le site.
            Toutes les modifications sont journalisées dans le journal d'audit.
          </p>
        </div>
      </div>

      {dirtyCount > 0 && (
        <div className="sticky top-16 z-10 -mx-1 flex items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-4 py-2 backdrop-blur">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-primary">
            <Eye className="h-3.5 w-3.5" />
            {dirtyCount} modification{dirtyCount > 1 ? "s" : ""} non enregistrée{dirtyCount > 1 ? "s" : ""}
          </span>
          <Button size="sm" onClick={save} disabled={saving} className="bg-primary text-white hover:bg-primary/90">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </div>
      )}

      <Tabs defaultValue={SECTIONS[0].id} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/40 p-1">
          {SECTIONS.map((s) => {
            const dirtyInSection = s.fields.some(
              (f) => (content[f.key] ?? "") !== (initial[f.key] ?? "")
            );
            const Icon = s.icon;
            return (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
                {dirtyInSection && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <TabsContent key={s.id} value={s.id} className="space-y-4">
              <Card className="border-border/60 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    Section {s.label}
                  </CardTitle>
                  <CardDescription className="text-xs">{s.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {s.fields.map((f) => {
                      const dirty = (content[f.key] ?? "") !== (initial[f.key] ?? "");
                      return (
                        <div
                          key={f.key}
                          className={cn(
                            "space-y-1.5 rounded-md border bg-card p-3 transition-colors",
                            dirty ? "border-primary/40 ring-1 ring-primary/15" : "border-border"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Label htmlFor={f.key} className="text-xs font-medium text-foreground">
                              {f.label}
                            </Label>
                            <div className="flex items-center gap-1.5">
                              {dirty && (
                                <Badge className="bg-primary/10 text-[9px] uppercase tracking-wide text-primary">
                                  Modifié
                                </Badge>
                              )}
                              <code className="font-mono text-[10px] text-muted-foreground">{f.key}</code>
                            </div>
                          </div>
                          {f.multiline ? (
                            <Textarea
                              id={f.key}
                              rows={3}
                              value={content[f.key] ?? ""}
                              onChange={(e) => set(f.key, e.target.value)}
                              placeholder={f.placeholder}
                              className="resize-y"
                            />
                          ) : (
                            <Input
                              id={f.key}
                              value={content[f.key] ?? ""}
                              onChange={(e) => set(f.key, e.target.value)}
                              placeholder={f.placeholder}
                            />
                          )}
                          {f.hint && (
                            <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          {dirtyCount > 0 ? (
            <Eye className="h-3.5 w-3.5 text-primary" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          {dirtyCount === 0
            ? "Aucune modification en attente."
            : `${dirtyCount} modification(s) en attente d'enregistrement.`}
        </span>
        <Button onClick={save} disabled={saving || dirtyCount === 0} size="sm" className="bg-primary text-white hover:bg-primary/90">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Enregistrer les modifications
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler les modifications ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vos {dirtyCount} modification(s) non enregistrée(s) seront perdues.
              Le contenu du site reviendra à sa dernière version enregistrée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={reset} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Annuler les modifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
