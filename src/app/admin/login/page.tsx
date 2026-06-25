"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Terminal,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/theme-toggle";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role") as AdminRole | null;

  const [role, setRole] = useState<AdminRole | null>(
    roleParam && ADMIN_ROLES[roleParam] ? roleParam : null
  );
  const [email, setEmail] = useState<string>(
    roleParam && ADMIN_ROLES[roleParam as AdminRole]
      ? ADMIN_ROLES[roleParam as AdminRole].email
      : ""
  );
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync role + email hint from query (the role param is now only a hint)
  useEffect(() => {
    if (roleParam && ADMIN_ROLES[roleParam as AdminRole]) {
      setRole(roleParam as AdminRole);
      setEmail(ADMIN_ROLES[roleParam as AdminRole].email);
    }
  }, [roleParam]);

  const cfg = role ? ADMIN_ROLES[role] : null;
  const accent = cfg?.accent ?? "#00C896";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email et mot de passe requis");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Identifiants incorrects");
        return;
      }
      toast.success(`Bienvenue, ${data.name}. Redirection...`);
      router.push(data.redirect || "/admin/dashboard");
    } catch {
      toast.error("Erreur réseau — réessayez");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden font-mono text-white"
      style={{ background: "#03130E" }}
    >
      {/* Grid background + scanlines */}
      <div className="pointer-events-none absolute inset-0 terminal-grid opacity-50" />
      <div className="pointer-events-none absolute inset-0 terminal-scanlines opacity-60" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-[#00C896]/30 scan-line-anim" />

      {/* Top bar */}
      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/45">
        <Terminal className="h-3 w-3" style={{ color: accent }} />
        <span style={{ color: accent }}>securex</span>
        <span className="text-white/30">/</span>
        <span className="text-white/60">auth</span>
      </div>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        <Link
          href="/admin/select-account"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/45 transition hover:text-white/80"
        >
          <ArrowLeft className="h-3 w-3" />
          Changer de compte
        </Link>
        <div className="[&_button]:text-[#00C896]/70 [&_button:hover]:text-[#00C896]">
          <ThemeToggle />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg p-7 sm:p-8"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,200,150,0.05), rgba(0,200,150,0.01))",
            border: `1px solid ${accent}55`,
            boxShadow: `0 0 0 1px ${accent}11, 0 16px 48px rgba(0,0,0,0.55), 0 0 30px ${accent}22`,
          }}
        >
          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-md"
              style={{
                background: `${accent}1A`,
                border: `1px solid ${accent}66`,
                boxShadow: `0 0 18px ${accent}55`,
              }}
            >
              <ShieldCheck className="h-6 w-6" style={{ color: accent }} />
            </div>
            {cfg ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                  Niveau {cfg.level} · {role}
                </p>
                <h1
                  className="terminal-glow mt-1 text-xl font-bold uppercase tracking-wide"
                  style={{ color: accent }}
                >
                  {cfg.label}
                </h1>
              </>
            ) : (
              <h1
                className="terminal-glow mt-1 text-xl font-bold uppercase tracking-wide"
                style={{ color: accent }}
              >
                Connexion Admin
              </h1>
            )}
            <p className="mt-2 text-[12px] leading-relaxed text-white/55">
              Authentification par email et mot de passe. Session valide 3 heures.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] uppercase tracking-[0.16em] text-white/55"
              >
                Email administrateur
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-md border-white/15 bg-white/5 pl-9 font-mono text-[13px] text-white/90 placeholder:text-white/30 focus-visible:border-[#00C896]/60 focus-visible:ring-[#00C896]/30"
                  placeholder="admin@securex-connect.ma"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[11px] uppercase tracking-[0.16em] text-white/55"
              >
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-md border-white/15 bg-white/5 px-9 font-mono text-[13px] text-white/90 placeholder:text-white/30 focus-visible:border-[#00C896]/60 focus-visible:ring-[#00C896]/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 transition hover:text-white/80"
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full justify-center gap-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{
                background: accent,
                color: "#03130E",
                boxShadow: `0 0 18px ${accent}55`,
              }}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Se connecter
            </Button>
          </form>

          {/* Demo hint */}
          <div
            className="mt-6 rounded-md border p-4"
            style={{
              borderColor: `${accent}33`,
              background: `${accent}0A`,
            }}
          >
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>
              <Info className="h-3 w-3" />
              Comptes de démonstration
            </div>
            <p className="mb-2 text-[11px] leading-relaxed text-white/65">
              Mot de passe pour les 3 comptes :{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">
                Securex@2026
              </code>
            </p>
            <ul className="space-y-1 text-[11px] text-white/55">
              {(Object.keys(ADMIN_ROLES) as AdminRole[]).map((r) => (
                <li key={r} className="flex items-center gap-2">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: ADMIN_ROLES[r].accent }}
                  />
                  <span className="font-mono">{ADMIN_ROLES[r].email}</span>
                  <span className="text-white/40">· {ADMIN_ROLES[r].label}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.16em] text-white/30">
          connexion chiffrée · session 3h
        </p>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center font-mono text-white"
          style={{ background: "#03130E" }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-[#00C896]" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
