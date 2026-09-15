import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://securex-connect.ma"),
  title: {
    default: "SÉCUREX CONNECT — Contrôle Technique Automobile Agréé à Agadir",
    template: "%s | SÉCUREX CONNECT",
  },
  description:
    "Centre de contrôle technique automobile agréé à Agadir. Prenez rendez-vous en ligne, contrôle rapide et fiable, certificat officiel. 14 rue Cadi Ayad, Q.I., Agadir.",
  keywords: [
    "contrôle technique Agadir",
    "rendez-vous contrôle technique Agadir",
    "contrôle technique automobile Maroc",
    "visite technique Agadir",
    "SÉCUREX CONNECT",
  ],
  authors: [{ name: "SÉCUREX CONNECT" }],
  icons: {
    icon: "/logo-securex.png",
    apple: "/logo-securex.png",
  },
  openGraph: {
    title: "SÉCUREX CONNECT — Contrôle Technique Automobile Agréé à Agadir",
    description:
      "Centre agréé à Agadir. Réservation en ligne, contrôle fiable, certificat officiel.",
    url: "https://securex-connect.ma",
    siteName: "SÉCUREX CONNECT",
    type: "website",
    locale: "fr_MA",
  },
  twitter: {
    card: "summary_large_image",
    title: "SÉCUREX CONNECT — Contrôle Technique Agréé à Agadir",
    description: "Réservation en ligne, contrôle fiable, certificat officiel.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <SonnerToaster richColors position="top-right" />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
