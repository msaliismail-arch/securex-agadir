"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Car,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-background to-background">
      {/* decorative soft blobs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-brand/5 blur-3xl" />
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-info/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-brand/20 bg-emerald-brand/5 px-3 py-1.5 text-xs font-medium text-emerald-brand">
              <ShieldCheck className="h-3.5 w-3.5" />
              Agréé par le Ministère du Transport
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy leading-[1.05]">
              Contrôle technique automobile{" "}
              <span className="text-emerald-brand">agréé</span> à Agadir
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Réservez votre créneau en ligne en moins de 2 minutes. Contrôle
              rapide, fiable et certifié par nos techniciens agréés. Repartez
              avec votre certificat officiel.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-emerald-brand hover:bg-emerald-brand/90 text-white h-12 px-6 text-base"
              >
                <Link href="/rendez-vous">
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Prendre rendez-vous
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base border-border hover:bg-muted/60"
              >
                <Link href="/tarifs">
                  Voir les tarifs
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <TrustBadge icon={ShieldCheck} label="Agréé Ministère" />
              <TrustBadge icon={Award} label="Certificat officiel" />
              <TrustBadge icon={Clock} label="Contrôle en 30 min" />
            </div>
          </motion.div>

          {/* Right: framed visual card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative mx-auto max-w-md aspect-square rounded-3xl border border-border/80 bg-card p-8 shadow-2xl shadow-navy/5">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-navy/[0.02] via-transparent to-emerald-brand/[0.07]" />

              {/* logo */}
              <div className="relative flex justify-center pt-2">
                <Logo size={56} />
              </div>

              {/* inspection motif */}
              <div className="relative mt-6 flex items-center justify-center">
                <div className="relative flex h-56 w-56 items-center justify-center">
                  <div className="absolute -inset-2 rounded-full border border-dashed border-navy/15" />
                  <div className="absolute inset-0 rounded-full border border-emerald-brand/15" />
                  <div className="absolute inset-6 rounded-full border border-emerald-brand/20" />
                  <div className="absolute inset-12 rounded-full border-2 border-emerald-brand/25" />

                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-brand/10">
                    <Car className="h-12 w-12 text-emerald-brand" strokeWidth={1.5} />
                  </div>

                  {/* scan line */}
                  <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: [-100, 100, -100], opacity: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-brand to-transparent"
                    aria-hidden
                  />

                  {/* validation badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-brand text-white shadow-lg"
                  >
                    <ShieldCheck className="h-6 w-6" />
                  </motion.div>
                </div>
              </div>

              {/* status line */}
              <div className="relative mt-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-brand/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-brand" />
                  </span>
                  Système actif
                </div>
                <div className="text-muted-foreground">Inspection en temps réel</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-brand/10">
        <Icon className="h-5 w-5 text-emerald-brand" />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground leading-tight">
        {label}
      </span>
    </div>
  );
}
