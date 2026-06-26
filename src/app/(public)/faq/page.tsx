import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ChevronRight, Phone } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "FAQ — Contrôle technique automobile à Agadir",
  description:
    "Réponses aux questions fréquentes sur le contrôle technique à Agadir : fréquence, durée, documents, contre-visite, prix, validité du certificat.",
  alternates: { canonical: "/faq" },
};

const FAQ: { q: string; a: string }[] = [
  { q: "À quelle fréquence dois-je passer le contrôle technique au Maroc ?", a: "Le contrôle technique est obligatoire tous les ans pour les véhicules de moins de 10 ans, et tous les 6 mois pour les véhicules de plus de 10 ans. La première visite doit avoir lieu dans l'année qui suit la première mise en circulation." },
  { q: "Combien de temps dure un contrôle technique ?", a: "Un contrôle technique complet dure en moyenne 30 minutes. Prévoyez environ 45 minutes au total entre l'accueil, le contrôle et la remise du certificat." },
  { q: "Quels documents dois-je apporter ?", a: "Vous devez présenter la carte grise originale en cours de validité, l'attestation d'assurance en cours de validité, et la carte d'identité nationale du propriétaire. Pour une contre-visite, apportez également le procès-verbal de la visite précédente." },
  { q: "Qu'est-ce qu'une contre-visite et combien coûte-t-elle ?", a: "La contre-visite est une re-vérification effectuée après réparation des défauts identifiés lors du contrôle initial. Elle coûte 100 MAD pour une voiture particulière et doit être effectuée dans un délai de 2 mois." },
  { q: "Que se passe-t-il si mon véhicule ne passe pas le contrôle ?", a: "Si des défauts sont détectés, un procès-verbal de non-conformité vous est remis. Vous disposez de 2 mois pour effectuer les réparations et passer la contre-visite. Sans contre-visite dans ce délai, une nouvelle visite complète est nécessaire." },
  { q: "Le certificat de contrôle technique est-il valable immédiatement ?", a: "Oui. Dès que le contrôle est validé par notre équipe, le certificat officiel vous est remis immédiatement. Il est valable jusqu'à la date de la prochaine échéance (1 an ou 6 mois selon l'âge du véhicule)." },
  { q: "Puis-je passer le contrôle avec un véhicule qui n'est pas à mon nom ?", a: "Oui, c'est possible. Vous devez toutefois présenter une procuration signée par le propriétaire, ainsi que la copie de sa carte d'identité, en plus des documents habituels (carte grise, assurance)." },
  { q: "Comment prendre rendez-vous en ligne ?", a: "Rendez-vous sur la page Rendez-vous, sélectionnez votre type de véhicule, le service souhaité, puis choisissez une date et un créneau. Remplissez vos informations et confirmez. Vous recevrez un code de référence à 6 caractères à présenter le jour du contrôle." },
  { q: "Quels sont les moyens de paiement acceptés ?", a: "Nous acceptons les paiements en espèces, par carte bancaire (TPE) et par virement. Le règlement s'effectue après la réalisation du contrôle technique." },
  { q: "Le contrôle technique est-il obligatoire pour vendre mon véhicule ?", a: "Lors de la cession d'un véhicule, une visite de cession peut être exigée. Nous proposons ce service (400 MAD pour une voiture particulière) qui certifie l'état du véhicule au moment de la vente." },
  { q: "Recevais-je un rappel avant l'expiration de mon contrôle ?", a: "Oui. Si vous avez un compte client, vous recevrez un rappel par SMS, email ou WhatsApp (selon vos préférences) 30 jours avant l'expiration de votre certificat de contrôle technique." },
  { q: "Quelles sont vos horaires d'ouverture ?", a: `Nous sommes ouverts du lundi au vendredi de 8h à 18h, et le samedi de 8h à 13h. Le centre est fermé le dimanche et les jours fériés. ${BRAND.address}.` },
];

export default function FaqPage() {
  return (
    <div className="bg-mesh">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Reveal>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Aide &amp; support
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              Questions fréquentes
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tout ce que vous devez savoir sur le contrôle technique automobile à Agadir.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <Card className="mt-12 border-border p-2 shadow-soft">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-b border-border px-4 last:border-0"
                >
                  <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline [&>svg]:text-primary">
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{item.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pl-9 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </Reveal>

        <Reveal>
          <div className="mt-10 overflow-hidden rounded-2xl bg-brand-gradient p-8 text-center shadow-glow">
            <h3 className="text-lg font-semibold text-white">
              Vous ne trouvez pas votre réponse ?
            </h3>
            <p className="mt-2 text-sm text-white/85">
              Notre équipe est à votre écoute pour toute question.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild className="bg-white text-primary shadow-float hover:bg-white/90">
                <Link href="/contact">
                  <ChevronRight className="mr-1 h-4 w-4" /> Nous contacter
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <a href={`tel:${BRAND.phoneRaw}`}>
                  <Phone className="mr-1.5 h-4 w-4" /> {BRAND.phone}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
