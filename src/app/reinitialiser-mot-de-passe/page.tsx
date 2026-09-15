"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return toast.error("8 caractères minimum.");
    if (password !== confirmation) return toast.error("Les mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Réinitialisation impossible");
      setDone(true);
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
          <KeyRound className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-center text-2xl font-bold">Nouveau mot de passe</h1>
          {done ? (
            <div className="mt-5 space-y-4 text-center text-sm text-muted-foreground">
              <p>Votre mot de passe a été mis à jour.</p>
              <Button asChild><Link href="/espace-client">Accéder à mon compte</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="space-y-2"><Label htmlFor="password">Nouveau mot de passe</Label><Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="confirmation">Confirmation</Label><Input id="confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></div>
              <Button type="submit" className="w-full bg-brand-gradient text-white" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
