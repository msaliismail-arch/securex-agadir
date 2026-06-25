import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CalendarCheck, Info, Check } from "lucide-react";
import { db } from "@/lib/db";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { formatMAD } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-brand">Tarification</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Tarifs du contrôle technique</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Des prix clairs et transparents pour chaque type de véhicule. Aucun frais caché.
        </p>
      </div>

      <div className="mt-14 space-y-10">
        {categories.map((cat) => {
          const c = COLOR_MAP[cat.color as CategoryColor];
          return (
            <Card key={cat.id} className="overflow-hidden border-border">
              <div className={`${c.bg} px-6 py-4 text-white`}>
                <h2 className="text-xl font-semibold">{cat.name}</h2>
                <p className="text-sm text-white/80">{cat.description}</p>
              </div>
              <div className="divide-y divide-border">
                {cat.services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-navy">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-muted-foreground">Durée</p>
                        <p className="text-sm font-medium text-navy">{s.durationMin} min</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Prix</p>
                        <p className={`text-lg font-bold ${c.fg}`}>{formatMAD(s.price)}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className={`shrink-0 border ${c.border} ${c.fg} hover:${c.soft}`}>
                        <Link href={`/rendez-vous?category=${cat.slug}`}>Réserver</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">Tarifs indicatifs</p>
          <p className="text-sm text-amber-700">Les prix affichés sont à titre indicatif. Un devis détaillé vous sera remis sur place selon l'état du véhicule et les prestations nécessaires.</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-navy p-8 text-center">
        <h3 className="text-xl font-semibold text-white">Besoin d'un contrôle technique ?</h3>
        <p className="mt-2 text-sm text-white/70">Réservez votre créneau en ligne en moins de 2 minutes.</p>
        <Button asChild className="mt-5 bg-emerald-brand text-white hover:bg-emerald-brand/90">
          <Link href="/rendez-vous"><CalendarCheck className="mr-2 h-4 w-4" /> Prendre rendez-vous <ChevronRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
