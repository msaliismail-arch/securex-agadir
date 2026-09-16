"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED";

type PaymentState = {
  status: PaymentStatus;

  appointment?: {
    code: string;
    depositAmountCents: number;
    balanceDueCents: number;
  };
};

async function readJsonSafely<T>(
  response: Response,
): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function PaymentResult() {
  const searchParams = useSearchParams();

  const sessionId =
    searchParams.get("session_id");

  const [result, setResult] =
    useState<PaymentState | null>(null);

  const [attempts, setAttempts] =
    useState(0);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError(
        "Identifiant de paiement Stripe manquant.",
      );

      return;
    }

    let active = true;
    let timer:
      | ReturnType<typeof setTimeout>
      | undefined;

    async function checkPayment() {
      try {
        const response = await fetch(
          `/api/payments/status?session_id=${encodeURIComponent(
            sessionId!,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          await readJsonSafely<
            PaymentState & {
              error?: string;
            }
          >(response);

        if (!active) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              `Impossible de vérifier le paiement (${response.status}).`,
          );
        }

        if (!data) {
          throw new Error(
            "Réponse de paiement invalide.",
          );
        }

        setResult(data);
        setError(null);

        /*
         * Le webhook Stripe peut arriver quelques
         * secondes après le retour depuis Checkout.
         *
         * On vérifie donc de nouveau si le statut
         * est encore PENDING.
         */
        if (
          data.status === "PENDING" &&
          attempts < 8
        ) {
          timer = setTimeout(() => {
            setAttempts(
              (current) => current + 1,
            );
          }, 1500);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de vérifier le paiement.",
        );
      }
    }

    void checkPayment();

    return () => {
      active = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [attempts, sessionId]);

  if (error) {
    return (
      <Card className="glass-card w-full max-w-lg border-destructive/20 shadow-card">
        <CardContent className="p-7 text-center">
          <XCircle className="mx-auto h-14 w-14 text-destructive" />

          <h1 className="mt-4 text-2xl font-bold">
            Impossible de vérifier le paiement
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <Button
            asChild
            variant="outline"
            className="mt-6 w-full"
          >
            <Link href="/espace-client/rdv">
              Voir mes rendez-vous
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="glass-card w-full max-w-lg border-primary/20 shadow-card">
        <CardContent className="p-7 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />

          <h1 className="mt-4 text-2xl font-bold">
            Vérification du paiement
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Nous vérifions la confirmation sécurisée de Stripe.
          </p>
        </CardContent>
      </Card>
    );
  }

  const paid =
    result.status === "PAID";

  const failed = [
    "FAILED",
    "EXPIRED",
    "REFUNDED",
  ].includes(result.status);

  const stillPending =
    result.status === "PENDING";

  return (
    <Card className="glass-card w-full max-w-lg border-primary/20 shadow-card">
      <CardContent className="p-7 text-center">
        {paid ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        ) : failed ? (
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
        ) : (
          <Clock3 className="mx-auto h-14 w-14 text-amber-500" />
        )}

        <h1 className="mt-4 text-2xl font-bold">
          {paid
            ? "Acompte confirmé"
            : failed
              ? "Paiement non confirmé"
              : "Confirmation en cours"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {paid
            ? `Le rendez-vous ${
                result.appointment?.code ?? ""
              } est confirmé. Le solde sera réglé à l’agence.`
            : result.status === "REFUNDED"
              ? "L’acompte a été remboursé."
              : result.status === "EXPIRED"
                ? "La session de paiement a expiré. Le rendez-vous n’a pas été confirmé."
                : result.status === "FAILED"
                  ? "Stripe n’a pas confirmé le paiement. Aucun rendez-vous n’a été validé."
                  : "Nous attendons la confirmation sécurisée de Stripe. Cette page ne valide jamais seule un paiement."}
        </p>

        {paid &&
        result.appointment ? (
          <div className="mt-5 rounded-lg bg-primary/5 p-4 text-sm">
            <p>
              Acompte payé :{" "}
              <strong>
                {(
                  result.appointment
                    .depositAmountCents /
                  100
                ).toFixed(2)}{" "}
                MAD
              </strong>
            </p>

            <p className="mt-1">
              Solde agence :{" "}
              <strong>
                {(
                  result.appointment
                    .balanceDueCents /
                  100
                ).toFixed(2)}{" "}
                MAD
              </strong>
            </p>
          </div>
        ) : null}

        {stillPending &&
        attempts >= 8 ? (
          <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            La confirmation prend plus de temps que prévu.
            Vous pouvez consulter votre espace client dans quelques instants.
          </div>
        ) : null}

        <Button
          asChild
          className="mt-6 w-full bg-brand-gradient text-white hover:opacity-90"
        >
          <Link href="/espace-client/rdv">
            Voir mes rendez-vous
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12">
      <Suspense
        fallback={
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        }
      >
        <PaymentResult />
      </Suspense>
    </main>
  );
}