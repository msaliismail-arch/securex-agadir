import type { Metadata } from "next";
import { ClientSpaceShell } from "@/components/client/client-shell";

export const metadata: Metadata = {
  title: "Espace Client",
  description:
    "Espace client SÉCUREX CONNECT : suivez vos rendez-vous, téléchargez vos certificats de validation et gérez vos véhicules.",
};

export default function EspaceClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientSpaceShell>{children}</ClientSpaceShell>;
}
