"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck, Terminal } from "lucide-react";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_ROLES, type AdminRole, DEMO_OTP } from "@/lib/constants";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = params.get("role") as AdminRole | null;

  const [role, setRole] = useState<AdminRole | null>(
    roleParam && ADMIN_ROLES[roleParam] ? roleParam : null
  );
  const [email, setEmail] = useState<string>(role ? ADMIN_ROLES[role].email : "");
  const [step, setStep] = useState<1 | 2>(1);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  // Redirect if missing/invalid role
  useEffect(() => {
    if (!roleParam || !ADMIN_ROLES[roleParam as AdminRole]) {
      router.replace("/admin/select-account");
      return;
    }
    setRole(roleParam as AdminRole);
    setEmail(ADMIN_ROLES[roleParam as AdminRole].email);
  }, [roleParam, router]);

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1620] font-mono text-white">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
      </div>
    );
  }

  const cfg = ADMIN_ROLES[role];
  const accent = cfg.accent;

  async function sendOtp() {
    setSending(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Impossible d'envoyer le code");
        return;
      }
      toast.success(`Code OTP envoyé à ${email}`);
      setStep(2);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    if (code.length !== 6) {
      toast.error("Saisissez les 6 chiffres du code");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Code invalide");
        return;
      }
      toast.success("Connexion réussie. Redirection...");
      router.push(data.redirect || cfg.route);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden font-mono text-white"
      style={{ background: "#0F1620" }}
    >
      {/* Faint grid + scanlines (lighter than select-account) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 terminal-scanlines opacity-50" />

      {/* Top bar */}
      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40">
        <Terminal className="h-3 w-3" style={{ color: accent }} />
        <span style={{ color: accent }}>securex</span>
        <span className="text-white/30">/</span>
        <span className="text-white/60">auth</span>
      </div>
      <a
        href="/admin/select-account"
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40 transition hover:text-white/80"
      >
        <ArrowLeft className="h-3 w-3" />
        Changer de compte
      </a>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg p-7 sm:p-8"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
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
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
              Niveau {cfg.level} · {role}
            </p>
            <h1
              className="terminal-glow mt-1 text-xl font-bold uppercase tracking-wide"
              style={{ color: accent }}
            >
              {cfg.label}
            </h1>
            <p className="mt-2 text-[12px] leading-relaxed text-white/50">
              Authentification à deux facteurs requise pour accéder au système.
            </p>
          </div>

          {/* Step 1: send OTP */}
          {step === 1 && (
            <div className="space-y-4">
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
                    value={email}
                    readOnly
                    className="rounded-md border-white/15 bg-white/5 pl-9 font-mono text-[13px] text-white/80 focus-visible:border-white/25"
                  />
                </div>
                <p className="text-[11px] italic text-white/40">
                  Email pré-configuré pour ce rôle
                </p>
              </div>

              <Button
                type="button"
                disabled={sending}
                onClick={sendOtp}
                className="w-full justify-center gap-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  background: accent,
                  color: "#000",
                  boxShadow: `0 0 18px ${accent}55`,
                }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Envoyer le code OTP
              </Button>

              <p className="text-center text-[11px] text-white/35">
                Un code à 6 chiffres sera généré pour {email}
              </p>
            </div>
          )}

          {/* Step 2: verify OTP */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2 text-center">
                <p className="text-[12px] text-white/60">
                  Saisissez le code reçu par email
                </p>
                <p className="font-mono text-[12px] text-white/45">{email}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(v) => setCode(v)}
                  containerClassName="gap-1.5"
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className="h-11 w-10 border-white/20 bg-white/5 text-white"
                    />
                    <InputOTPSlot
                      index={1}
                      className="h-11 w-10 border-white/20 bg-white/5 text-white"
                    />
                    <InputOTPSlot
                      index={2}
                      className="h-11 w-10 border-white/20 bg-white/5 text-white"
                    />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className="h-11 w-10 border-white/20 bg-white/5 text-white"
                    />
                    <InputOTPSlot
                      index={4}
                      className="h-11 w-10 border-white/20 bg-white/5 text-white"
                    />
                    <InputOTPSlot
                      index={5}
                      className="h-11 w-10 border-white/20 bg-white/5 text-white"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-center text-[11px]" style={{ color: `${accent}cc` }}>
                Code de démonstration : {DEMO_OTP}
              </p>

              <Button
                type="button"
                disabled={verifying || code.length !== 6}
                onClick={verify}
                className="w-full justify-center gap-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  background: accent,
                  color: "#000",
                  boxShadow: `0 0 18px ${accent}55`,
                }}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Vérifier
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode("");
                }}
                className="w-full text-center text-[11px] uppercase tracking-[0.14em] text-white/40 transition hover:text-white/70"
              >
                ← Renvoyer le code
              </button>
            </div>
          )}
        </motion.div>

        <p className="mt-6 text-center text-[11px] uppercase tracking-[0.16em] text-white/30">
          connexion chiffrée · session 12h
        </p>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0F1620] font-mono text-white">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
