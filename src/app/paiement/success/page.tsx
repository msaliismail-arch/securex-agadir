"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PaymentState = { status: string; appointment?: { code: string; depositAmountCents: number; balanceDueCents: number } };

function PaymentResult() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<PaymentState | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    fetch(`/api/payments/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setResult(data);
        if (data.status === "PENDING" && attempts < 8) timer = setTimeout(() => setAttempts((n) => n + 1), 1500);
      });
    return () => timer && clearTimeout(timer);
  }, [attempts, searchParams]);

  const paid = result?.status === "PAID";
  const failed = result && ["FAILED", "EXPIRED", "REFUNDED"].includes(result.status);
  return (
    <Card className="glass-card w-full max-w-lg border-primary/20 shadow-card">
      <CardContent className="p-7 text-center">
        {!result ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> : paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-primary" /> : failed ? <XCircle className="mx-auto h-14 w-14 text-destructive" /> : <Clock3 className="mx-auto h-14 w-14 text-amber-500" />}
        <h1 className="mt-4 text-2xl font-bold">{paid ? "Acompte confirmé" : failed ? "Paiement non confirmé" : "Confirmation en cours"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {paid ? `Le rendez-vous ${result.appointment?.code ?? ""} est confirmé. Le solde sera réglé à l’agence.` : failed ? "Votre rendez-vous n’a pas été confirmé par Stripe." : "Nous attendons la confirmation sécurisée de Stripe. Cette page ne valide jamais seule un paiement."}
        </p>
        {paid && result.appointment ? <div className="mt-5 rounded-lg bg-primary/5 p-4 text-sm"><p>Acompte payé : <strong>{(result.appointment.depositAmountCents / 100).toFixed(2)} MAD</strong></p><p>Solde agence : <strong>{(result.appointment.balanceDueCents / 100).toFixed(2)} MAD</strong></p></div> : null}
        <Button asChild className="mt-6 bg-brand-gradient text-white"><Link href="/espace-client/rdv">Voir mes rendez-vous</Link></Button>
      </CardContent>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12"><Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-primary" />}><PaymentResult /></Suspense></main>;
}
