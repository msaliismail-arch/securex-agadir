import Link from "next/link";
import {
  Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin, ShieldCheck, Navigation,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { BRAND, PUBLIC_NAV, MAPS_EMBED } from "@/lib/constants";

/** TikTok glyph (lucide-react does not export one). */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.5 3c.3 2.1 1.5 3.5 3.5 3.7v2.4c-1.2.1-2.4-.2-3.5-.8v6.6c0 3.4-2.5 5.6-5.6 5.6-3 0-5.4-2.3-5.4-5.3 0-3.1 2.6-5.4 5.7-5.1v2.5c-.4-.1-.9-.2-1.3-.1-1.3.1-2.2 1.1-2.1 2.4.1 1.2 1 2 2.2 2 1.3 0 2.2-.9 2.2-2.3V3h2.8z" />
    </svg>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/60">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size={44} />
            <p className="max-w-xs text-sm leading-relaxed text-foreground/70">
              Centre de contrôle technique automobile agréé à Agadir. Sécurité,
              fiabilité et conformité pour tous vos véhicules.
            </p>
            <div className="flex w-fit items-center gap-1.5 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              <ShieldCheck className="h-4 w-4" /> Agréé par le Ministère du Transport
            </div>
          </div>

          {/* Nav */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              {PUBLIC_NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-foreground/70 transition-colors hover:text-primary"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/rendez-vous"
                  className="text-foreground/70 transition-colors hover:text-primary"
                >
                  Prendre rendez-vous
                </Link>
              </li>
              <li>
                <Link
                  href="/espace-client"
                  className="text-foreground/70 transition-colors hover:text-primary"
                >
                  Espace Client
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{BRAND.address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${BRAND.phoneRaw}`} className="transition-colors hover:text-primary">
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${BRAND.email}`} className="transition-colors hover:text-primary">
                  {BRAND.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{BRAND.hours}</span>
              </li>
            </ul>
          </div>

          {/* Social + map */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Suivez-nous
            </h3>
            <div className="flex flex-wrap gap-2.5">
              <SocialIcon href={BRAND.social.facebook} label="Facebook">
                <Facebook className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href={BRAND.social.instagram} label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href={BRAND.social.linkedin} label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href={BRAND.social.tiktok} label="TikTok">
                <TikTokIcon className="h-4 w-4" />
              </SocialIcon>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-border shadow-soft">
              <iframe
                title="Localisation SÉCUREX CONNECT Agadir"
                src={MAPS_EMBED}
                width="100%"
                height="120"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=14%20rue%20Cadi%20Ayad%2C%20Agadir%2C%20Maroc"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
            >
              <Navigation className="h-3.5 w-3.5" /> Voir l'itinéraire
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-foreground/50 sm:flex-row">
          <p>© {new Date().getFullYear()} SÉCUREX CONNECT. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="transition-colors hover:text-foreground/80">
              Mentions légales
            </Link>
            <Link
              href="/admin/select-account"
              className="text-[11px] text-muted-foreground/70 transition-colors hover:text-primary"
            >
              Espace Administrateur
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground/70 shadow-soft transition-all hover:bg-primary hover:text-white hover:shadow-glow"
    >
      {children}
    </a>
  );
}
