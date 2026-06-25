import type { Metadata } from "next";
import Link from "next/link";
import { FileText, CheckCircle2, AlertTriangle, CalendarCheck, ChevronRight } from "lucide-react";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "Documents requis pour le contrôle technique à Agadir",
  description:
    "Liste des documents à fournir pour le contrôle technique automobile à Agadir : carte grise, assurance, pièce d'identité. Préparez votre visite.",
  alternates: { canonical: "/documents" },
};

const DOCS: { color: CategoryColor; title: string; docs: string[] }[] = [
  {
    color: "blue",
    title: "Voiture particulière",
    docs: [
      "Carte grise originale (en cours de validité)",
      "Attestation d'assurance en cours de validité",
      "Carte d'identité nationale du propriétaire",
      "Vignette de la visite technique précédente (en cas de contre-visite)",
    ],
  },
  {
    color: "orange",
    title: "Véhicule utilitaire",
    docs: [
      "Carte grise originale (avec mention utilitaire)",
      "Attestation d'assurance en cours de validité",
      "Carte d'identité nationale du propriétaire",
      "Permis de conduire de la catégorie appropriée",
      "Carnet de bord / carnet d'entretien (si applicable)",
    ],
  },
  {
    color: "purple",
    title: "Moto & deux-roues",
    docs: [
      "Carte grise originale de la moto",
      "Attestation d'assurance en cours de validité",
      "Carte d'identité nationale du propriétaire",
      "Casque homologué (obligatoire pour l'essai)",
    ],
  },
  {
    color: "red",
    title: "Poids lourd & camion",
    docs: [
      "Carte grise originale du véhicule",
      "Attestation d'assurance en cours de validité",
      "Carte d'identité nationale du propriétaire",
      "Licence de transport (si applicable)",
      "Carnet d'entretien et derniers bons de révision",
      "Rapport de la dernière visite technique",
    ],
  },
];

export default function DocumentsPage() {
  return (
    <div className="bg-mesh">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Préparation
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              Documents requis
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Préparez votre visite en rassemblant les documents nécessaires selon votre type de
              véhicule.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {DOCS.map((d, i) => {
            const c = COLOR_MAP[d.color];
            return (
              <Reveal key={d.title} delay={i * 0.06}>
                <Card className="h-full overflow-hidden border-border shadow-soft">
                  <div className={`${c.soft} ${c.fg} border-b ${c.border} px-6 py-4`}>
                    <h2 className="text-lg font-semibold">{d.title}</h2>
                  </div>
                  <ul className="space-y-3 p-6">
                    {d.docs.map((doc) => (
                      <li key={doc} className="flex gap-3">
                        <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${c.fg}`} />
                        <span className="text-sm text-foreground/80">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">Important</p>
              <p className="text-sm text-orange-700">
                En l'absence d'un document requis, le contrôle technique ne pourra pas être
                effectué. Pensez à vérifier la validité de votre carte grise et de votre assurance
                avant votre visite.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 overflow-hidden rounded-2xl bg-brand-gradient p-8 text-center shadow-glow">
            <h3 className="text-xl font-semibold text-white">Tous vos documents sont prêts ?</h3>
            <p className="mt-2 text-sm text-white/85">Réservez votre créneau dès maintenant.</p>
            <Button asChild className="mt-5 bg-white text-primary shadow-float hover:bg-white/90">
              <Link href="/rendez-vous">
                <CalendarCheck className="mr-2 h-4 w-4" /> Prendre rendez-vous{" "}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
