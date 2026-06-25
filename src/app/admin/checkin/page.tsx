"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanLine,
  Keyboard,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Hash,
  User,
  Car,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import type { Appointment } from "../../rdv/_components/types";

type VerifyResult =
  | { kind: "success"; appt: Appointment }
  | { kind: "not-approved"; appt: Appointment }
  | { kind: "not-found"; message: string };

type Mode = "scan" | "manual";

export default function CheckinPage() {
  const [mode, setMode] = useState<Mode>("scan");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  // manual code
  const [code, setCode] = useState("");

  // scan state
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ token: string; at: number } | null>(null);

  // today counter
  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.todayCheckins === "number") setTodayCount(d.todayCheckins);
      })
      .catch(() => {});
  }, [result]);

  const verify = useCallback(async (payload: { qrToken?: string; code?: string }) => {
    setVerifying(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.found) {
        setResult({ kind: "not-found", message: data.message || "Aucune réservation trouvée." });
        return;
      }
      const appt = data.appointment as Appointment;
      if (appt.status === "APPROVED" || appt.status === "COMPLETED") {
        setResult({ kind: "success", appt });
        toast.success("Vérification réussie");
      } else {
        setResult({ kind: "not-approved", appt });
      }
    } catch {
      toast.error("Erreur de vérification");
      setResult({ kind: "not-found", message: "Erreur réseau. Réessayez." });
    } finally {
      setVerifying(false);
    }
  }, []);

  // Start camera when in scan mode AND no result
  useEffect(() => {
    if (mode !== "scan" || result !== null) return;
    let cancelled = false;

    const start = async () => {
      setScanError(null);
      try {
        const el = document.getElementById("reader");
        if (!el) return;
        const scanner = new Html5Qrcode("reader", { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            const now = Date.now();
            // Debounce: ignore same token within 3s
            if (
              lastScanRef.current &&
              lastScanRef.current.token === decoded &&
              now - lastScanRef.current.at < 3000
            ) {
              return;
            }
            lastScanRef.current = { token: decoded, at: now };
            // Stop camera then verify
            try {
              scanner
                .stop()
                .then(() => scanner.clear())
                .catch(() => {})
                .finally(() => {
                  setCameraActive(false);
                  scannerRef.current = null;
                });
            } catch {
              setCameraActive(false);
              scannerRef.current = null;
            }
            verify({ qrToken: decoded });
          },
          () => {
            // per-frame error: ignore
          },
        );
        if (!cancelled) setCameraActive(true);
      } catch (e: any) {
        if (!cancelled) {
          setCameraActive(false);
          setScanError(
            "Caméra inaccessible. Autorisez l'accès à la caméra ou utilisez la saisie manuelle.",
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        try {
          s.stop()
            .then(() => s.clear())
            .catch(() => {})
            .finally(() => {
              scannerRef.current = null;
              setCameraActive(false);
            });
        } catch {
          // scanner was never started (e.g. camera denied) — safe to ignore
          scannerRef.current = null;
          setCameraActive(false);
        }
      }
    };
  }, [mode, result, verify]);

  // Stop camera when a result is shown (so the camera is released)
  useEffect(() => {
    if (result !== null && scannerRef.current) {
      const s = scannerRef.current;
      try {
        s.stop()
          .then(() => s.clear())
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
            setCameraActive(false);
          });
      } catch {
        scannerRef.current = null;
        setCameraActive(false);
      }
    }
  }, [result]);

  const reset = () => {
    setResult(null);
    setCode("");
    setScanError(null);
    lastScanRef.current = null;
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      toast.error("Code à 6 caractères requis");
      return;
    }
    verify({ code: c });
  };

  // Result view (full screen within main)
  if (result) {
    return <ResultView result={result} onReset={reset} todayCount={todayCount} />;
  }

  return (
    <div className="w-full space-y-5">
      {/* Counter */}
      <div className="flex items-center justify-between rounded-2xl bg-warning/10 border border-warning/20 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-warning p-1.5">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-warning font-semibold">
              Validations aujourd&apos;hui
            </div>
            <div className="text-2xl font-bold text-warning leading-tight">
              {todayCount === null ? "—" : todayCount}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</div>
          <div className="text-sm font-semibold text-foreground capitalize">
            {mode === "scan" ? "Caméra" : "Code manuel"}
          </div>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Vérification de réservation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scannez le QR du client ou saisissez le code à 6 caractères.
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="scan" className="text-sm gap-1.5 data-[state=active]:bg-brand-gradient data-[state=active]:text-white">
            <ScanLine className="h-4 w-4" />
            Scan QR
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-sm gap-1.5 data-[state=active]:bg-brand-gradient data-[state=active]:text-white">
            <Keyboard className="h-4 w-4" />
            Code manuel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-4">
          <ScanMode
            cameraActive={cameraActive}
            scanError={scanError}
            verifying={verifying}
            onSwitchToManual={() => setMode("manual")}
          />
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <ManualMode
            code={code}
            setCode={setCode}
            verifying={verifying}
            onSubmit={submitManual}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Scan Mode ---------------- */

function ScanMode({
  cameraActive,
  scanError,
  verifying,
  onSwitchToManual,
}: {
  cameraActive: boolean;
  scanError: string | null;
  verifying: boolean;
  onSwitchToManual: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-foreground aspect-square max-w-md mx-auto ring-4 ring-warning/20">
        <div id="reader" className="w-full h-full" />

        {/* Scanning frame overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative w-[250px] h-[250px]">
            {/* corners */}
            <span className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-warning rounded-tl-lg" />
            <span className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-warning rounded-tr-lg" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-warning rounded-bl-lg" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-warning rounded-br-lg" />
            {/* animated scan line */}
            <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-warning to-transparent shadow-[0_0_8px_#F2994A] scan-line-anim" />
          </div>
        </div>

        {/* Status chip */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur",
              cameraActive ? "bg-primary/90 text-white" : "bg-white/90 text-foreground",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", cameraActive ? "bg-white animate-pulse" : "bg-muted-foreground")} />
            {cameraActive ? "Caméra active" : "Caméra inactive"}
          </span>
          {verifying && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Loader2 className="h-3 w-3 animate-spin" /> Vérification…
            </span>
          )}
        </div>

        {!cameraActive && !scanError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
            <Camera className="h-8 w-8 opacity-70" />
            <span className="text-xs opacity-80">Démarrage de la caméra…</span>
          </div>
        )}

        {scanError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white gap-3 p-6 bg-foreground/95">
            <CameraOff className="h-10 w-10 text-warning" />
            <div className="text-sm font-semibold">Caméra indisponible</div>
            <p className="text-xs text-white/70 max-w-xs">{scanError}</p>
            <Button
              size="sm"
              onClick={onSwitchToManual}
              className="bg-warning hover:bg-warning/90 text-white mt-1"
            >
              <Keyboard className="h-4 w-4 mr-1.5" /> Saisie manuelle
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Présentez le QR de validation du client devant la caméra. Le scan est automatique.
      </p>
    </div>
  );
}

/* ---------------- Manual Mode ---------------- */

function ManualMode({
  code,
  setCode,
  verifying,
  onSubmit,
}: {
  code: string;
  setCode: (v: string) => void;
  verifying: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  // 6 large boxes
  const chars = code.split("");
  const setAt = (i: number, v: string) => {
    const upper = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const next = [...chars];
    next[i] = upper;
    // shift remaining left if middle edited? keep simple: just join
    setCode(next.join("").padEnd(0, "").slice(0, 6));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl bg-warning/10 border border-warning/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">Code à 6 caractères</span>
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              id={`box-${i}`}
              type="text"
              inputMode="text"
              autoComplete="off"
              value={chars[i] ?? ""}
              onChange={(e) => {
                setAt(i, e.target.value);
                // auto-focus next
                if (e.target.value && i < 5) {
                  const el = document.getElementById(`box-${i + 1}`) as HTMLInputElement | null;
                  el?.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !chars[i] && i > 0) {
                  const el = document.getElementById(`box-${i - 1}`) as HTMLInputElement | null;
                  el?.focus();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
                if (text) setCode(text);
              }}
              maxLength={1}
              className="h-14 w-12 sm:h-16 sm:w-14 rounded-xl border-2 border-warning/30 bg-card text-center font-mono text-2xl sm:text-3xl font-bold text-foreground uppercase focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            />
          ))}
        </div>
        <div className="mt-3 text-center text-[10px] text-muted-foreground">
          Code fourni lors de la réservation (ex. : 7K2Q9X)
        </div>
      </div>

      <Button
        type="submit"
        disabled={verifying || code.length !== 6}
        className="w-full h-14 text-base font-semibold bg-brand-gradient text-white hover:opacity-90 shadow-soft disabled:opacity-50"
      >
        {verifying ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Vérification…
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 mr-2" />
            Vérifier
          </>
        )}
      </Button>
    </form>
  );
}

/* ---------------- Result View ---------------- */

function ResultView({
  result,
  onReset,
  todayCount,
}: {
  result: VerifyResult;
  onReset: () => void;
  todayCount: number | null;
}) {
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {result.kind === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <SuccessCard appt={result.appt} todayCount={todayCount} onReset={onReset} />
          </motion.div>
        )}

        {result.kind === "not-approved" && (
          <motion.div
            key="warn"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <WarningCard appt={result.appt} onReset={onReset} />
          </motion.div>
        )}

        {result.kind === "not-found" && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <NotFoundCard message={result.message} onReset={onReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessCard({
  appt,
  todayCount,
  onReset,
}: {
  appt: Appointment;
  todayCount: number | null;
  onReset: () => void;
}) {
  return (
    <div className="rounded-3xl overflow-hidden ring-4 ring-primary/20 shadow-glow">
      {/* Banner */}
      <div className="bg-brand-gradient px-6 py-8 text-center text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 16 }}
          className="inline-flex rounded-full bg-white/20 p-4 mb-3"
        >
          <CheckCircle2 className="h-12 w-12" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight">Réservation confirmée</h2>
        <p className="text-white/90 text-sm mt-1">Le rendez-vous est valide · Bienvenue</p>
      </div>

      {/* Queue number — huge */}
      <div className="bg-card px-6 py-6 text-center border-b border-border">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
          Numéro de file
        </div>
        <div className="text-7xl sm:text-8xl font-bold text-primary leading-none mt-1 tracking-tight">
          {appt.queueNumber ?? "—"}
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
          <QrCode className="h-3.5 w-3.5" />
          QR vérifié · {appt.status === "COMPLETED" ? "Contrôle terminé" : "Validé par SÉCUREX"}
        </div>
      </div>

      {/* Details */}
      <div className="bg-card px-5 py-4 space-y-3">
        <DetailRow icon={Hash} label="Code" value={appt.code} mono />
        <DetailRow icon={User} label="Client" value={appt.clientName} />
        <DetailRow icon={Car} label="Véhicule" value={`${appt.vehiclePlate} · ${appt.vehicleDesc}`} />
        <DetailRow icon={Calendar} label="Date" value={formatDate(appt.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
        <DetailRow icon={Clock} label="Créneau" value={appt.slot} />
        {appt.service && <DetailRow icon={ShieldCheck} label="Service" value={appt.service.name} />}
      </div>

      {/* Counter footer */}
      <div className="bg-warning/10 px-5 py-3 flex items-center justify-between border-t border-warning/20">
        <span className="text-xs text-warning font-medium">Validations aujourd&apos;hui</span>
        <span className="text-lg font-bold text-warning">{todayCount ?? "—"}</span>
      </div>

      <div className="bg-card p-4">
        <Button onClick={onReset} size="lg" className="w-full h-14 text-base bg-warning hover:bg-warning/90 text-white">
          <RotateCcw className="h-5 w-5 mr-2" />
          Nouvelle vérification
        </Button>
      </div>
    </div>
  );
}

function WarningCard({ appt, onReset }: { appt: Appointment; onReset: () => void }) {
  const meta =
    appt.status === "PENDING"
      ? { title: "Réservation en attente de validation", desc: "Le RDV n'a pas encore été approuvé par la validation. Le client doit patienter ou revenir après validation." }
      : appt.status === "REJECTED"
        ? { title: "Réservation rejetée", desc: "Ce rendez-vous a été refusé par le service validation." }
        : appt.status === "CANCELLED"
          ? { title: "Réservation annulée", desc: "Ce rendez-vous a été annulé." }
          : { title: "Statut non conforme", desc: "Ce rendez-vous ne peut pas être vérifié à l'accueil." };

  return (
    <div className="rounded-3xl overflow-hidden ring-4 ring-warning/30 shadow-card">
      <div className="bg-warning px-6 py-8 text-center text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 16 }}
          className="inline-flex rounded-full bg-white/20 p-4 mb-3"
        >
          <AlertTriangle className="h-12 w-12" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight">{meta.title}</h2>
        <p className="text-white/90 text-sm mt-1 max-w-sm mx-auto">{meta.desc}</p>
      </div>

      <div className="bg-card px-5 py-4 space-y-3">
        <DetailRow icon={Hash} label="Code" value={appt.code} mono />
        <DetailRow icon={User} label="Client" value={appt.clientName} />
        <DetailRow icon={Car} label="Véhicule" value={`${appt.vehiclePlate} · ${appt.vehicleDesc}`} />
        <DetailRow icon={Calendar} label="Date" value={formatDate(appt.date, { weekday: "long", day: "2-digit", month: "long" })} />
        <DetailRow icon={Clock} label="Créneau" value={appt.slot} />
      </div>

      <div className="bg-card p-4">
        <Button onClick={onReset} size="lg" variant="outline" className="w-full h-14 text-base border-warning text-warning hover:bg-warning/10">
          <RotateCcw className="h-5 w-5 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}

function NotFoundCard({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="rounded-3xl overflow-hidden ring-4 ring-destructive/20 shadow-card">
      <div className="bg-destructive px-6 py-10 text-center text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 16 }}
          className="inline-flex rounded-full bg-white/20 p-4 mb-3"
        >
          <XCircle className="h-12 w-12" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight">Aucune réservation trouvée</h2>
        <p className="text-white/90 text-sm mt-1 max-w-sm mx-auto">{message}</p>
      </div>

      <div className="bg-card p-5">
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground">Vérifiez :</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Le code saisi (6 caractères, sans tirets).</li>
            <li>Que le QR scanné est bien un QR SÉCUREX CONNECT.</li>
            <li>Que la réservation n&apos;a pas été annulée.</li>
          </ul>
        </div>
      </div>

      <div className="bg-card p-4">
        <Button onClick={onReset} size="lg" className="w-full h-14 text-base bg-brand-gradient text-white hover:opacity-90">
          <RotateCcw className="h-5 w-5 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="rounded-md bg-card p-1.5 ring-1 ring-border">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("text-sm font-semibold text-foreground truncate", mono && "font-mono tracking-wider")}>
          {value}
        </div>
      </div>
    </div>
  );
}
