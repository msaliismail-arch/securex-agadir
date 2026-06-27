import Link from "next/link";
import {
  CalendarCheck, FileText, SearchCheck, Award, ShieldCheck, Clock, Zap,
  Users, Star, Phone, Mail, MapPin, Navigation, Facebook, Instagram, Linkedin,
  ChevronRight, Wrench, Gauge, BadgeCheck, MessageCircle, Car, Truck, Bike, Bus, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { getWebsiteContent } from "@/lib/content";
import { BRAND, COLOR_MAP, MAPS_EMBED, MAPS_LINK, type CategoryColor } from "@/lib/constants";
import { formatMAD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCounter } from "@/components/public/stats-counter";
import { Reveal } from "@/components/public/reveal";
import { HeroInspectionScene } from "@/components/public/hero-inspection-scene";

export const dynamic = 'force-dynamic';

const ICONS: Record<string, LucideIcon> = { Car, Truck, Bike, Bus };

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: CalendarCheck, title: "Prenez rendez-vous", desc: "Réservez en ligne en moins de 2 minutes, choisissez votre créneau." },
  { icon: FileText, title: "Préparez vos documents", desc: "Carte grise, assurance et pièce d'identité du propriétaire." },
  { icon: SearchCheck, title: "Contrôle par nos experts", desc: "Inspection complète par nos techniciens certifiés, en 30 minutes." },
  { icon: Award, title: "Recevez votre certificat", desc: "Certificat officiel remis immédiatement après validation." },
];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: "Équipements de pointe", desc: "Bancs d'essai et outils de diagnostic dernière génération." },
  { icon: BadgeCheck, title: "Techniciens certifiés", desc: "Une équipe agréée et formée aux normes les plus strictes." },
  { icon: ShieldCheck, title: "Certificat officiel", desc: "Document reconnu par les autorités marocaines." },
  { icon: Clock, title: "Rapide & fiable", desc: "Un contrôle complet en seulement 30 minutes en moyenne." },
  { icon: MessageCircle, title: "Rappel SMS / WhatsApp", desc: "Ne laissez plus passer la date d'expiration de votre contrôle." },
  { icon: Gauge, title: "Tarifs transparents", desc: "Des prix clairs, affichés à l'avance, sans surprise." },
];

const TESTIMONIALS: { name: string; role: string; quote: string; rating: number; color: CategoryColor; }[] = [
  { name: "Mehdi Tazi", role: "Agadir", quote: "Service rapide et professionnel. J'ai pris RDV en ligne et tout s'est déroulé sans attente. Je recommande vivement SÉCUREX CONNECT.", rating: 5, color: "blue" },
  { name: "Salma Ouazzani", role: "Dcheira", quote: "Accueil chaleureux, équipe compétente. Le rappel par WhatsApp avant l'expiration m'a été très utile. Centre sérieux.", rating: 5, color: "green" },
  { name: "Hicham Berrada", role: "Inezgane", quote: "Installation moderne et propre. Le certificat m'a été remis immédiatement. Tarifs très corrects par rapport à la qualité.", rating: 5, color: "orange" },
];

function HighlightTitle({ title, highlight, highlightClassName = "text-brand-gradient" }: { title: string; highlight?: string; highlightClassName?: string; }) {
  if (!highlight) return <>{title}</>;
  const idx = title.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{title}</>;
  return (<>{title.slice(0, idx)}<span className={highlightClassName}>{title.slice(idx, idx + highlight.length)}</span>{title.slice(idx + highlight.length)}</>);
}

export default async function HomePage() {
  const [content, categories, announcements] = await Promise.all([
    getWebsiteContent(),
    db.category.findMany({ orderBy: { sort: "asc" }, include: { services: { where: { active: true }, orderBy: { price: "asc" } } } }),
    db.announcement.findMany({ where: { visible: true }, orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }] }),
  ]);

  const heroTitle = content["hero.title"] ?? "Contrôle technique automobile agréé à Agadir";
  const heroHighlight = content["hero.titleHighlight"] || "agréé";
  const heroSubtitle = content["hero.subtitle"] ?? "Sécurité, fiabilité et conformité pour tous vos véhicules. Prenez rendez-vous en ligne et recevez votre certificat officiel en 30 minutes.";
  const heroBadge = content["hero.badge"] ?? "Agréé Ministère du Transport";
  const ctaPrimary = content["hero.ctaPrimary"] ?? "Prendre rendez-vous";
  const ctaSecondary = content["hero.ctaSecondary"] ?? "Voir les tarifs";
  const stats = [
    { value: Number(content["stats.controls"] ?? "15000"), suffix: content["stats.controlsSuffix"] ?? "+", label: content["stats.controlsLabel"] ?? "Contrôles réalisés" },
    { value: Number(content["stats.satisfaction"] ?? "49"), suffix: content["stats.satisfactionSuffix"] ?? "/50", label: content["stats.satisfactionLabel"] ?? "Satisfaction client" },
    { value: Number(content["stats.duration"] ?? "30"), suffix: content["stats.durationSuffix"] ?? " min", label: content["stats.durationLabel"] ?? "Durée moyenne" },
    { value: Number(content["stats.certified"] ?? "100"), suffix: content["stats.certifiedSuffix"] ?? "%", label: content["stats.certifiedLabel"] ?? "Agréé & conforme" },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/hero-inspection-bg.png)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00C896]/85 via-[#00A87E]/80 to-[#00876A]/90" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-hero-dots opacity-[0.08]" />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00876A]/60 via-transparent to-transparent lg:from-[#00876A]/70" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"><ShieldCheck className="h-3.5 w-3.5" />{heroBadge}</div>
              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl"><HighlightTitle title={heroTitle} highlight={heroHighlight} highlightClassName="text-hero-gradient" /></h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">{heroSubtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-white px-7 text-base text-primary shadow-glow hover:bg-white/90"><Link href="/rendez-vous"><CalendarCheck className="mr-2 h-5 w-5" /> {ctaPrimary}</Link></Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/40 bg-white/5 px-7 text-base text-white backdrop-blur-sm hover:bg-white/15"><Link href="/tarifs">{ctaSecondary}<ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/75">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Contrôle en 30 min</span>
                <span className="flex items-center gap-2"><Award className="h-4 w-4" /> Certificat officiel</span>
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> 15 000+ contrôles réalisés</span>
              </div>
            </Reveal>
            <Reveal delay={0.15}><HeroInspectionScene /></Reveal>
          </div>
        </div>
      </section>
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-12 md:grid-cols-4 md:gap-6">
          {stats.map((s) => (<Reveal key={s.label}><div className="rounded-2xl glass-card p-6 text-center shadow-soft"><div className="text-3xl font-bold text-primary md:text-4xl"><StatsCounter value={s.value} suffix={s.suffix} /></div><p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p></div></Reveal>))}
        </div>
      </section>
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal><div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Nos services</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Catégories de véhicules &amp; tarifs</h2></div><Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/5"><Link href="/tarifs">Tous les tarifs <ChevronRight className="ml-1 h-4 w-4" /></Link></Button></div></Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, i) => {
              const c = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.green;
              const Icon = ICONS[cat.icon] || Car;
              const minPrice = cat.services.length ? Math.min(...cat.services.map((s) => s.price)) : 0;
              return (<Reveal key={cat.id} delay={i * 0.06}><Card className="group relative h-full overflow-hidden border-border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"><div className={`absolute inset-x-0 top-0 h-1 ${c.bg}`} /><div className={`flex h-14 w-14 items-center justify-center rounded-xl ${c.soft} ${c.fg}`}><Icon className="h-7 w-7" /></div><h3 className="mt-5 text-lg font-semibold text-foreground">{cat.name}</h3><p className="mt-1.5 min-h-[40px] text-sm leading-relaxed text-muted-foreground">{cat.description}</p><div className="mt-4 flex items-baseline gap-1"><span className="text-xs text-muted-foreground">à partir de</span><span className={`text-2xl font-bold ${c.fg}`}>{formatMAD(minPrice)}</span></div><Button asChild variant="outline" className={`mt-5 w-full border ${c.border} ${c.fg} hover:${c.soft}`}><Link href={`/rendez-vous?category=${cat.slug}`}>Réserver <ChevronRight className="ml-1 h-4 w-4" /></Link></Button></Card></Reveal>);
            })}
          </div>
        </div>
      </section>
      <section className="bg-brand-gradient py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-white" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">Prêt à passer le contrôle technique ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">Réservez votre créneau en ligne dès maintenant et évitez l'attente. Certification officielle garantie.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-white px-8 text-base text-primary shadow-float hover:bg-white/90"><Link href="/rendez-vous"><CalendarCheck className="mr-2 h-5 w-5" /> {ctaPrimary}</Link></Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/40 bg-white/10 px-8 text-base text-white hover:bg-white/20 hover:text-white"><Link href="/contact">Poser une question</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- small helpers ---------- */
function ContactRow({ icon: Icon, title, children, accent }: { icon: LucideIcon; title: string; children: any; accent?: boolean; }) {
  return (<div className="flex gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><Icon className="h-5 w-5" /></div><div><p className="text-sm font-semibold text-foreground">{title}</p>{children}</div></div>);
}
function SocialLink({ href, label }: { href: string; label: string }) {
  return (<a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-soft transition-all hover:bg-primary hover:text-white hover:shadow-glow">{label === "Facebook" && <Facebook className="h-4 w-4" />}{label === "Instagram" && <Instagram className="h-4 w-4" />}{label === "LinkedIn" && <Linkedin className="h-4 w-4" />}</a>);
}