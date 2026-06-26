"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";

interface ProfileData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  phone: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        setData(d);
        setForm({
          firstName: d.firstName ?? "",
          lastName: d.lastName ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          password: "",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Le prénom et le nom sont requis");
      return;
    }
    if (!form.email.trim()) {
      toast.error("L'email est requis");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la mise à jour");
        return;
      }
      toast.success("Profil mis à jour avec succès");
      setForm((f) => ({ ...f, password: "" }));
      // Refresh so shells that read /api/auth/me show the new name
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  const role = data?.role as AdminRole | undefined;
  const roleCfg = role ? ADMIN_ROLES[role] : null;
  const backHref = roleCfg?.route ?? "/admin/select-account";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <Logo size={32} withText={false} />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mon profil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gérez vos informations personnelles et votre mot de passe.
          </p>
        </div>

        {/* Identity card */}
        <Card className="mb-6 border-border p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-foreground">
                {data?.firstName} {data?.lastName}
              </p>
              <p className="truncate text-sm text-muted-foreground">{data?.email}</p>
              {roleCfg && (
                <span
                  className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    color: roleCfg.accent,
                    background: `${roleCfg.accent}1A`,
                    border: `1px solid ${roleCfg.accent}44`,
                  }}
                >
                  <ShieldCheck className="h-3 w-3" />
                  {roleCfg.label}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Identifiant</p>
              <p className="font-mono text-foreground">{data?.username}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Téléphone</p>
              <p className="text-foreground">{data?.phone || "—"}</p>
            </div>
          </div>
        </Card>

        {/* Edit form */}
        <form onSubmit={save}>
          <Card className="border-border p-6 shadow-card">
            <h2 className="mb-5 text-base font-semibold text-foreground">
              Modifier mes informations
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="pl-9"
                    placeholder="Ousak"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Almin"
                  required
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="pl-9"
                  placeholder="vous@email.com"
                  required
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="pl-9"
                  placeholder="+212 6 12 34 56 78"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Changer le mot de passe
                </h3>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="px-9"
                    placeholder="Laisser vide pour conserver l'actuel"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:text-foreground"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Minimum 6 caractères. Renseignez uniquement pour réinitialiser.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href={backHref}>Annuler</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-brand-gradient text-white hover:opacity-90"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
