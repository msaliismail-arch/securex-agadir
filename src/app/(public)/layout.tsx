import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";

export const metadata: Metadata = {
  title: {
    default: "SÉCUREX CONNECT — Contrôle Technique Automobile Agréé à Agadir",
    template: "%s | SÉCUREX CONNECT",
  },
  description:
    "Centre de contrôle technique automobile agréé à Agadir. Prenez rendez-vous en ligne, contrôle rapide et fiable, certificat officiel.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SÉCUREX CONNECT — Contrôle Technique Automobile Agréé à Agadir",
    description:
      "Centre agréé à Agadir. Réservation en ligne, contrôle fiable, certificat officiel.",
    type: "website",
    locale: "fr_MA",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SÉCUREX CONNECT",
  description:
    "Centre de contrôle technique automobile agréé à Agadir. Réservation en ligne, inspection fiable, certificat officiel.",
  image: "/logo-securex.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "14 rue Cadi Ayad, Q.I.",
    addressLocality: "Agadir",
    addressCountry: "MA",
  },
  telephone: "+212528841234",
  email: "contact@securex-connect.ma",
  openingHours: ["Mo-Fr 08:00-18:00", "Sa 08:00-13:00"],
  priceRange: "200-900 MAD",
  url: "https://securex-connect.ma",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
