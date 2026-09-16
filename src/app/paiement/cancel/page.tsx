import Link from "next/link";
import {
  CreditCard,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12">
      <Card className="glass-card w-full max-w-lg border-amber-500/20 shadow-card">
        <CardContent className="p-7 text-center">
          <CreditCard className="mx-auto h-14 w-14 text-amber-500" />

          <h1 className="mt-4 text-2xl font-bold">
            Paiement interrompu
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Aucun paiement n&apos;a été confirmé depuis cette page.
            Votre rendez-vous reste temporairement en attente tant que
            Stripe n&apos;a pas confirmé le paiement ou que la session
            de paiement n&apos;a pas expiré.
          </p>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-info/20 bg-info/5 p-3 text-left text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />

            <p>
              Si aucun paiement n&apos;est effectué, le créneau sera
              libéré automatiquement à l&apos;expiration de la session
              Stripe Checkout.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/rendez-vous">
                Recommencer
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
            >
              <Link href="/espace-client/rdv">
                Mes rendez-vous
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}