import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CalendarCheck, Info, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { formatMAD } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "Tarifs du contrôle technique à Agadir",
  description:
    "Découvrez les tarifs du contrôle technique automobile à Agadir : voiture, utilitaire, moto, poids lourd. Prix transparents et sans surprise.",
  alternates: { canonical: "/tarifs" },
};

export default async function TarifsPage() {
  const categories = await db.category.findMany({
    orderBy: { sort: "asc" },
    include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
  });

  return (
    <div className="bg-mesh">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Tarification
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              Tarifs du contrôle technique
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Des prix clairs et transparents pour chaque type de véhicule. Aucun frais caché.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-8">
          {categories.map((cat, i) => {
            const c = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.green;
            return (
              <Reveal key={cat.id} delay={i * 0.05}>
                <Card className="overflow-hidden border-border shadow-soft">
                  <div className={`bg-brand-gradient px-6 py-4 text-white`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">{cat.name}</h2>
                        <p className="text-sm text-white/85">{cat.description}</p>
                      </div>
                      <span className="hidden rounded-full bg-white/20 px-3 py-1 text-xs font-medium sm:inline-block">
                        {cat.services.length} prestation{cat.services.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {cat.services.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="hidden text-right sm:block">
                            <p className="text-xs text-muted-foreground">Durée</p>
                            <p className="text-sm font-medium text-foreground">{s.durationMin} min</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Prix</p>
                            <p className="text-lg font-bold text-primary">{formatMAD(s.price)}</p>
                          </div>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className={`shrink-0 border ${c.border} ${c.fg} hover:${c.soft}`}
                          >
                            <Link href={`/rendez-vous?category=${cat.slug}`}>Réserver</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {cat.services.length === 0 && (
                      <div className="px-6 py-6 text-sm text-muted-foreground">
                        Aucune prestation active pour le moment.
                      </div>
                    )}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Tarifs indicatifs</p>
              <p className="text-sm text-amber-700">
                Les prix affichés sont à titre indicatif. Un devis détaillé vous sera remis sur
                place selon l'état du véhicule et les prestations nécessaires.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 overflow-hidden rounded-2xl bg-brand-gradient p-8 text-center shadow-glow">
            <h3 className="text-xl font-semibold text-white">Besoin d'un contrôle technique ?</h3>
            <p className="mt-2 text-sm text-white/85">
              Réservez votre créneau en ligne en moins de 2 minutes.
            </p>
            <Button
              asChild
              className="mt-5 bg-white text-primary shadow-float hover:bg-white/90"
            >
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
