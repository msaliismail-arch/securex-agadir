"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Envoi impossible");
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12">
      <Card className="glass-card w-full max-w-md border-primary/20 shadow-card">
        <CardContent className="p-6">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-center text-2xl font-bold">Mot de passe oublié</h1>
          {sent ? (
            <div className="mt-5 space-y-4 text-center text-sm text-muted-foreground">
              <p>Si un compte correspond à cette adresse, un lien sécurisé vient d’être envoyé.</p>
              <Button asChild variant="outline"><Link href="/espace-client">Retour à la connexion</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" required className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand-gradient text-white" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Envoyer le lien sécurisé
              </Button>
              <Link href="/espace-client" className="block text-center text-xs text-primary hover:underline">Retour à la connexion</Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
