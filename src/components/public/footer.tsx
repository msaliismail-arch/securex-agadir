import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { BRAND, PUBLIC_NAV } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-navy text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size={44} textClassName="text-white" />
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Centre de contrôle technique automobile agréé à Agadir. Sécurité,
              fiabilité et conformité pour tous vos véhicules.
            </p>
            <div className="flex items-center gap-1.5 rounded-md bg-emerald-brand/15 px-3 py-2 text-xs text-emerald-300 w-fit">
              <ShieldCheck className="h-4 w-4" /> Agréé par le Ministère du Transport
            </div>
          </div>

          {/* Nav */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              {PUBLIC_NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-white/60 transition-colors hover:text-emerald-brand">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/rendez-vous" className="text-white/60 transition-colors hover:text-emerald-brand">
                  Prendre rendez-vous
                </Link>
              </li>
              <li>
                <Link href="/espace-client" className="text-white/60 transition-colors hover:text-emerald-brand">
                  Espace Client
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                <span>{BRAND.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                <a href={`tel:${BRAND.phoneRaw}`} className="hover:text-emerald-brand">{BRAND.phone}</a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                <a href={`mailto:${BRAND.email}`} className="hover:text-emerald-brand">{BRAND.email}</a>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                <span>{BRAND.hours}</span>
              </li>
            </ul>
          </div>

          {/* Social + map */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Suivez-nous</h3>
            <div className="flex gap-3">
              <a href={BRAND.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-emerald-brand hover:text-white">
                <Facebook className="h-4.5 w-4.5" />
              </a>
              <a href={BRAND.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-emerald-brand hover:text-white">
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a href={BRAND.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-emerald-brand hover:text-white">
                <Linkedin className="h-4.5 w-4.5" />
              </a>
            </div>
            <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
              <iframe
                title="Localisation SÉCUREX CONNECT Agadir"
                src="https://www.google.com/maps?q=14%20rue%20Cadi%20Ayad%2C%20Quartier%20Industriel%2C%20Agadir%2C%20Maroc&output=embed"
                width="100%"
                height="120"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[0.2]"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} SÉCUREX CONNECT. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-white/70">Mentions légales</Link>
            <Link
              href="/admin/select-account"
              className="text-[11px] text-gray-500/70 transition-colors hover:text-emerald-brand"
            >
              Espace Administrateur
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
