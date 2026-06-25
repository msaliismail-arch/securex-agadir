"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Terminal,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { ThemeToggle } from "@/components/shared/theme-toggle";

type Step = 1 | 2;

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role") as AdminRole | null;

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<AdminRole | null>(
    roleParam && ADMIN_ROLES[roleParam] ? roleParam : null,
  );

  const [username, setUsername] = useState<string>(
    roleParam && ADMIN_ROLES[roleParam as AdminRole]
      ? ADMIN_ROLES[roleParam as AdminRole].username
      : "",
  );
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [code, setCode] = useState("");
  const [pendingName, setPendingName] = useState<string>("");
  const [pendingRole, setPendingRole] = useState<AdminRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync username hint from query (the role param is now only a hint)
  useEffect(() => {
    if (roleParam && ADMIN_ROLES[roleParam as AdminRole]) {
      setRole(roleParam as AdminRole);
      setUsername(ADMIN_ROLES[roleParam as AdminRole].username);
    }
  }, [roleParam]);

  const cfg = role ? ADMIN_ROLES[role] : null;
  const accent = cfg?.accent ?? "#00C896";

  // Try to detect role from pending response if user typed a different username
  function deriveRoleFromUsername(name: string): AdminRole | null {
    const u = name.trim().toLowerCase();
    for (const r of Object.keys(ADMIN_ROLES) as AdminRole[]) {
      if (ADMIN_ROLES[r].username.toLowerCase() === u) return r;
    }
    return null;
  }

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Identifiant et mot de passe requis");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.pending) {
        toast.error(data.error || "Identifiants incorrects");
        return;
      }
      // Pending 2FA — advance to step 2
      setPendingName(data.name || username);
      const detected = deriveRoleFromUsername(username);
      setPendingRole(detected ?? null);
      setRole(detected ?? role);
      setCode("");
      setStep(2);
      toast.success(`Identité vérifiée — entrez votre code 2FA`);
    } catch {
      toast.error("Erreur réseau — réessayez");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Code 2FA invalide (6 chiffres)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Code de vérification incorrect");
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

  async function backToStep1() {
    // Cancel pending session on backend
    try {
      await fetch("/api/auth/admin-login", { method: "DELETE" });
    } catch {
      // ignore — non-critical
    }
    setCode("");
    setStep(1);
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
            {step === 1 ? (
              <>
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
                  Étape 1/2 · Identifiez-vous avec votre identifiant administrateur.
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                  Étape 2/2 · Authentification 2FA
                </p>
                <h1
                  className="terminal-glow mt-1 text-xl font-bold uppercase tracking-wide"
                  style={{ color: accent }}
                >
                  Code de vérification
                </h1>
                <p className="mt-2 text-[12px] leading-relaxed text-white/55">
                  Bonjour <span className="font-semibold" style={{ color: accent }}>{pendingName || "—"}</span>
                  {pendingRole ? ` · ${ADMIN_ROLES[pendingRole].label}` : ""}. Saisissez le code 2FA de votre compte.
                </p>
              </>
            )}
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.18em]">
            <span
              className={step === 1 ? "text-[#00C896]" : "text-white/40"}
              style={step === 1 ? { color: accent } : undefined}
            >
              ① Identifiants
            </span>
            <span className="text-white/30">→</span>
            <span
              className={step === 2 ? "" : "text-white/40"}
              style={step === 2 ? { color: accent } : undefined}
            >
              ② Code 2FA
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                onSubmit={submitStep1}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-[11px] uppercase tracking-[0.16em] text-white/55"
                  >
                    Identifiant administrateur
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="rounded-md border-white/15 bg-white/5 pl-9 font-mono text-[13px] text-white/90 placeholder:text-white/30 focus-visible:border-[#00C896]/60 focus-visible:ring-[#00C896]/30"
                      placeholder="superadmin"
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
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  )}
                  Continuer
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                onSubmit={submitStep2}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="otp"
                    className="text-[11px] uppercase tracking-[0.16em] text-white/55"
                  >
                    Code de vérification (6 chiffres)
                  </Label>
                  <div className="flex justify-center pt-1">
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={code}
                      onChange={(v) => setCode(v)}
                      autoFocus
                      containerClassName="justify-center"
                    >
                      <InputOTPGroup
                        style={{
                          // @ts-expect-error css var
                          "--ring-color": `${accent}55`,
                        }}
                      >
                        <InputOTPSlot index={0} className="h-12 w-10 border-white/15 bg-white/5 text-[18px] font-bold text-white first:rounded-l-md last:rounded-r-md" />
                        <InputOTPSlot index={1} className="h-12 w-10 border-white/15 bg-white/5 text-[18px] font-bold text-white" />
                        <InputOTPSlot index={2} className="h-12 w-10 border-white/15 bg-white/5 text-[18px] font-bold text-white" />
                      </InputOTPGroup>
                      <InputOTPSeparator className="text-white/30" />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-12 w-10 border-white/15 bg-white/5 text-[18px] font-bold text-white" />
                        <InputOTPSlot index={4} className="h-12 w-10 border-white/15 bg-white/5 text-[18px] font-bold text-white" />
                        <InputOTPSlot index={5} className="h-12 w-10 border-white/15 bg-white/5 text-[18px] font-bold text-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="mt-1 text-center text-[11px] text-white/40">
                    Code privé à usage unique · session valable 5 minutes
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || code.length !== 6}
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
                    <KeyRound className="h-4 w-4" />
                  )}
                  Vérifier et se connecter
                </Button>

                <button
                  type="button"
                  onClick={backToStep1}
                  className="flex w-full items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/45 transition hover:text-white/80"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Modifier l&apos;identifiant
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] uppercase tracking-[0.16em] text-white/30">
          <RefreshCw className="h-3 w-3" />
          connexion chiffrée · 2FA requise · session 3h
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
