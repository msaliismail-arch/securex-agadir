import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description:
    "Réservez votre contrôle technique automobile en ligne à Agadir. Wizard en 4 étapes : véhicule, service & créneau, informations, confirmation.",
};

export default function RendezVousLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
