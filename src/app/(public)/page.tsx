import Link from "next/link";
import {
  CalendarCheck, FileText, SearchCheck, Award, ShieldCheck, Clock, Zap,
  Users, Star, Phone, Mail, MapPin, Navigation, Facebook, Instagram, Linkedin,
  ChevronRight, Wrench, Gauge, BadgeCheck, MessageCircle, Car, Truck, Bike, Bus, AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { BRAND, COLOR_MAP, MAPS_EMBED, MAPS_LINK, type CategoryColor } from "@/lib/constants";
import { formatMAD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCounter } from "@/components/public/stats-counter";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car, Truck, Bike, Bus,
};

const STEPS = [
  { icon: CalendarCheck, title: "Prenez rendez-vous", desc: "Réservez en ligne en moins de 2 minutes, choisissez votre créneau." },
  { icon: FileText, title: "Préparez vos documents", desc: "Carte grise, assurance et pièce d'identité du propriétaire." },
  { icon: SearchCheck, title: "Contrôle par nos experts", desc: "Inspection complète par nos techniciens certifiés, en 30 minutes." },
  { icon: Award, title: "Recevez votre certificat", desc: "Certificat officiel remis immédiatement après validation." },
];

const FEATURES = [
  { icon: Zap, title: "Équipements de pointe", desc: "Bancs d'essai et outils de diagnostic dernière génération." },
  { icon: BadgeCheck, title: "Techniciens certifiés", desc: "Une équipe agréée et formée aux normes les plus strictes." },
  { icon: ShieldCheck, title: "Certificat officiel", desc: "Document reconnu par les autorités marocaines." },
  { icon: Clock, title: "Rapide & fiable", desc: "Un contrôle complet en seulement 30 minutes en moyenne." },
  { icon: MessageCircle, title: "Rappel SMS / WhatsApp", desc: "Ne laissez plus passer la date d'expiration de votre contrôle." },
  { icon: Gauge, title: "Tarifs transparents", desc: "Des prix clairs, affichés à l'avance, sans surprise." },
];

const TESTIMONIALS = [
  { name: "Mehdi Tazi", role: "Agadir", quote: "Service rapide et professionnel. J'ai pris RDV en ligne et tout s'est déroulé sans attente. Je recommande vivement SÉCUREX CONNECT.", rating: 5, color: "blue" as CategoryColor },
  { name: "Salma Ouazzani", role: "Dcheira", quote: "Accueil chaleureux, équipe compétente. Le rappel par WhatsApp avant l'expiration m'a été très utile. Centre sérieux.", rating: 5, color: "green" as CategoryColor },
  { name: "Hicham Berrada", role: "Inezgane", quote: "Installation moderne et propre. Le certificat m'a été remis immédiatement. Tarifs très corrects par rapport à la qualité.", rating: 5, color: "orange" as CategoryColor },
];

export default async function HomePage() {
  const [categories, announcements] = await Promise.all([
    db.category.findMany({
      orderBy: { sort: "asc" },
      include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
    }),
    db.announcement.findMany({ where: { visible: true }, orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }] }),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-brand/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-6 border-emerald-brand/30 bg-emerald-brand/10 text-emerald-300 hover:bg-emerald-brand/15">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Agréé Ministère du Transport
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                Contrôle technique automobile <span className="text-emerald-brand">agréé</span> à Agadir
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/70 leading-relaxed">
                Sécurité, fiabilité et conformité pour tous vos véhicules. Prenez rendez-vous en ligne et recevez votre certificat officiel en 30 minutes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-emerald-brand text-white hover:bg-emerald-brand/90 h-12 px-7 text-base">
                  <Link href="/rendez-vous"><CalendarCheck className="mr-2 h-5 w-5" /> Prendre rendez-vous</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/tarifs">Voir les tarifs</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/60">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-brand" /> Contrôle en 30 min</span>
                <span className="flex items-center gap-2"><Award className="h-4 w-4 text-emerald-brand" /> Certificat officiel</span>
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-brand" /> 15 000+ contrôles réalisés</span>
              </div>
            </div>

            {/* Hero card */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 rounded-3xl bg-emerald-brand/10 blur-2xl" />
              <Card className="relative border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-brand/15">
                    <SearchCheck className="h-7 w-7 text-emerald-brand" />
                  </div>
                  <Badge className="bg-emerald-brand/15 text-emerald-300">Contrôle complet</Badge>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">Points inspectés</h3>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: "Freinage", icon: "🛞" },
                    { label: "Éclairage", icon: "💡" },
                    { label: "Pneumatiques", icon: "🔵" },
                    { label: "Émissions", icon: "🌫️" },
                    { label: "Carrosserie", icon: "🚗" },
                    { label: "Direction", icon: "🔧" },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white/80">
                      <span>{p.icon}</span> {p.label}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-brand/10 p-4">
                  <div>
                    <p className="text-xs text-emerald-300/80">À partir de</p>
                    <p className="text-2xl font-bold text-white">350 MAD</p>
                  </div>
                  <Button asChild size="sm" className="bg-emerald-brand text-white hover:bg-emerald-brand/90">
                    <Link href="/rendez-vous">Réserver</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {[
            { value: 15000, suffix: "+", label: "Contrôles réalisés" },
            { value: 49, suffix: "/50", label: "Satisfaction client" },
            { value: 30, suffix: " min", label: "Durée moyenne" },
            { value: 100, suffix: "%", label: "Agréé & conforme" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-navy md:text-4xl">
                <StatsCounter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-brand">Processus simple</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">Comment ça marche ?</h2>
          <p className="mt-3 text-muted-foreground">Quatre étapes pour un contrôle technique sans tracas.</p>
        </div>
        <div className="relative mt-14 grid gap-8 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-border md:block" />
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-brand text-white shadow-lg shadow-emerald-brand/20">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-emerald-brand">Étape {i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES + TARIFS */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-brand">Nos services</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">Catégories de véhicules & tarifs</h2>
              <p className="mt-3 text-muted-foreground">Des tarifs clairs et transparents pour chaque type de véhicule.</p>
            </div>
            <Button asChild variant="outline" className="border-emerald-brand/30 text-emerald-brand hover:bg-emerald-brand/5">
              <Link href="/tarifs">Tous les tarifs <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => {
              const c = COLOR_MAP[cat.color as CategoryColor];
              const Icon = ICONS[cat.icon] || Car;
              const minPrice = cat.services.length ? Math.min(...cat.services.map((s) => s.price)) : 0;
              return (
                <Card key={cat.id} className="group relative overflow-hidden border-border p-6 transition-all hover:shadow-lg">
                  <div className={`absolute inset-x-0 top-0 h-1 ${c.bg}`} />
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${c.soft} ${c.fg}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-navy">{cat.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed min-h-[40px]">{cat.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">à partir de</span>
                    <span className={`text-2xl font-bold ${c.fg}`}>{formatMAD(minPrice)}</span>
                  </div>
                  <Button asChild variant="outline" className={`mt-5 w-full border ${c.border} ${c.fg} hover:${c.soft}`}>
                    <Link href={`/rendez-vous?category=${cat.slug}`}>Réserver <ChevronRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-brand">Notre engagement</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">Pourquoi nous choisir ?</h2>
          <p className="mt-3 text-muted-foreground">Une expérience de contrôle technique moderne, fiable et sans surprise.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border p-6 transition-colors hover:border-emerald-brand/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-emerald-brand">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-navy">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">Actualités</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">Annonces & promotions</h2>
              <p className="mt-3 text-muted-foreground">Restez informé de nos offres et informations importantes.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.slice(0, 3).map((a) => (
                <Card key={a.id} className={`relative border-border p-6 ${a.pinned ? "ring-1 ring-orange-300" : ""}`}>
                  {a.pinned && (
                    <Badge className="absolute -top-2.5 right-4 bg-orange-500 text-white">Épinglé</Badge>
                  )}
                  <Badge variant="outline" className="mb-3 border-orange-200 bg-orange-50 text-orange-700">{a.category}</Badge>
                  <h3 className="text-lg font-semibold text-navy">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4">{a.content}</p>
                  <p className="mt-4 text-xs text-muted-foreground">{new Date(a.publishedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-brand">Témoignages</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">Ils nous font confiance</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => {
            const c = COLOR_MAP[t.color];
            return (
              <Card key={t.name} className="border-border p-6">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-foreground/80 leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.soft} ${c.fg} text-sm font-bold`}>
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* LOCATION */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Contact & localisation</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">Nous trouver à Agadir</h2>
            <p className="mt-3 text-muted-foreground">Facile d'accès au Quartier Industriel d'Agadir.</p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Localisation SÉCUREX CONNECT Agadir"
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="min-h-[360px] w-full"
              />
            </div>
            <Card className="border-border p-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Adresse</p>
                    <p className="text-sm text-muted-foreground">{BRAND.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Téléphone</p>
                    <a href={`tel:${BRAND.phoneRaw}`} className="text-sm text-muted-foreground hover:text-red-600">{BRAND.phone}</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Email</p>
                    <a href={`mailto:${BRAND.email}`} className="text-sm text-muted-foreground hover:text-red-600">{BRAND.email}</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Horaires</p>
                    <p className="text-sm text-muted-foreground">{BRAND.hours}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button asChild className="bg-emerald-brand hover:bg-emerald-brand/90">
                    <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer"><Navigation className="mr-1.5 h-4 w-4" /> Itinéraire</a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/contact">Nous contacter</Link>
                  </Button>
                </div>
                <div className="flex gap-3 border-t border-border pt-5">
                  <a href={BRAND.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-navy hover:text-white"><Facebook className="h-4 w-4" /></a>
                  <a href={BRAND.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-navy hover:text-white"><Instagram className="h-4 w-4" /></a>
                  <a href={BRAND.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-navy hover:text-white"><Linkedin className="h-4 w-4" /></a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-navy py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-emerald-brand" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">Prêt à passer le contrôle technique ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">Réservez votre créneau en ligne dès maintenant et évitez l'attente. Certification officielle garantie.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-emerald-brand text-white hover:bg-emerald-brand/90 h-12 px-8 text-base">
              <Link href="/rendez-vous"><CalendarCheck className="mr-2 h-5 w-5" /> Prendre rendez-vous</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/contact">Poser une question</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
