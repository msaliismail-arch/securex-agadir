import Link from "next/link";
import { CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12">
      <Card className="glass-card w-full max-w-lg shadow-card"><CardContent className="p-7 text-center">
        <CreditCard className="mx-auto h-14 w-14 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold">Paiement interrompu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Aucun succès n’est enregistré depuis cette page. Le rendez-vous reste en attente tant que Stripe n’a pas confirmé l’acompte.</p>
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-info/20 bg-info/5 p-3 text-left text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0 text-info" />Le créneau sera libéré automatiquement à l’expiration de la session Checkout.</div>
        <div className="mt-6 flex justify-center gap-3"><Button asChild><Link href="/rendez-vous">Recommencer</Link></Button><Button asChild variant="outline"><Link href="/espace-client">Mon compte</Link></Button></div>
      </CardContent></Card>
    </main>
  );
}
