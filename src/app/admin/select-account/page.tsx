"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Lock,
  Terminal,
  ServerCog,
} from "lucide-react";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";

type RoleKey = AdminRole;

const ROLE_ICONS: Record<RoleKey, React.ComponentType<{ className?: string }>> = {
  SUPER: ShieldCheck,
  RDV: Shield,
};

const BOOT_LINES = [
  "> SÉCUREX CONNECT — SYSTÈME DE CONTRÔLE v3.0",
  "> Initialisation du terminal sécurisé...",
  "> Vérification des autorisations... OK",
  "> 2 comptes administrateur détectés",
  "> Sélectionnez votre niveau d'accès :",
];

/** Hexagon (clip-path) wrapper for the icon — keeps things terminal-styled. */
function HexBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative inline-flex">
      <div
        className="flex h-14 w-14 items-center justify-center"
        style={{
          clipPath:
            "polygon(25% 4%, 75% 4%, 96% 50%, 75% 96%, 25% 96%, 4% 50%)",
          background: `linear-gradient(135deg, ${color}22, ${color}08)`,
          border: `1px solid ${color}`,
          boxShadow: `0 0 18px ${color}55, inset 0 0 12px ${color}22`,
        }}
      >
        <span style={{ color }}>{children}</span>
      </div>
    </div>
  );
}

export default function SelectAccountPage() {
  const router = useRouter();
  const roles = useMemo(() => Object.keys(ADMIN_ROLES) as RoleKey[], []);

  // Typewriter boot sequence
  const [visibleLines, setVisibleLines] = useState(0);
  const [typed, setTyped] = useState<string[]>(BOOT_LINES.map(() => ""));

  useEffect(() => {
    let cancelled = false;
    let lineIdx = 0;
    let charIdx = 0;

    function tick() {
      if (cancelled) return;
      if (lineIdx >= BOOT_LINES.length) return;
      const full = BOOT_LINES[lineIdx];
      charIdx++;
      setTyped((prev) => {
        const next = [...prev];
        next[lineIdx] = full.slice(0, charIdx);
        return next;
      });
      if (charIdx >= full.length) {
        // Line done — advance after a short pause
        lineIdx++;
        charIdx = 0;
        setVisibleLines(lineIdx);
        setTimeout(tick, 130);
      } else {
        // Speed: ~22ms/char → ~1.5s total for all 5 lines
        setTimeout(tick, 18);
      }
    }
    const start = setTimeout(tick, 250);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, []);

  const bootDone = visibleLines >= BOOT_LINES.length;

  function handleSelect(role: RoleKey) {
    router.push(`/admin/login?role=${role}`);
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden font-mono text-white"
      style={{ background: "#03130E" }}
    >
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 terminal-grid opacity-70" />

      {/* Scanlines + animated scan bar */}
      <div className="pointer-events-none absolute inset-0 terminal-scanlines" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-[#00C896]/40 scan-line-anim" />

      {/* Top-left back link */}
      <a
        href="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#00C896]/70 transition hover:text-[#00C896]"
      >
        <ArrowLeft className="h-3 w-3" />
        Retour au site
      </a>

      {/* Top-right status + theme toggle */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-3">
        <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#00C896]/60 sm:flex">
          <Terminal className="h-3 w-3" />
          terminal://securex/admin
        </div>
        <div className="[&_button]:text-[#00C896]/70 [&_button:hover]:text-[#00C896]">
          <ThemeToggle />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-12 pt-16 sm:px-8 sm:pt-20">
        {/* Brand line */}
        <div className="mb-6 flex items-center gap-2.5">
          <ServerCog className="h-5 w-5 text-[#00C896]" style={{ filter: "drop-shadow(0 0 6px #00C89688)" }} />
          <span className="text-[12px] uppercase tracking-[0.22em] text-white/55">
            SÉCUREX <span className="text-[#00C896]">CONNECT</span> · console d'administration
          </span>
        </div>

        {/* Boot sequence */}
        <section className="mb-8 sm:mb-12" aria-label="Séquence de démarrage">
          <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#00C896]/90 sm:text-[13px]">
            {typed.slice(0, visibleLines + (bootDone ? 0 : 1)).map((line, i) => (
              <div key={i} className="flex">
                <span className={cn(i === visibleLines - 1 && !bootDone ? "terminal-glow" : "")}>
                  {line}
                  {i === visibleLines - 1 && !bootDone && (
                    <span className="cursor-blink ml-0.5 inline-block">▊</span>
                  )}
                </span>
              </div>
            ))}
            {bootDone && (
              <div className="mt-1 text-[#00C896]/70">
                &gt; <span className="text-[#00C896]/80">accès protégé · session 3h</span>
                <span className="cursor-blink ml-0.5 inline-block">▊</span>
              </div>
            )}
          </pre>
        </section>

        {/* Role cards */}
        <motion.section
          className="grid flex-1 gap-4 sm:gap-5 md:grid-cols-2"
          initial="hidden"
          animate={bootDone ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
          }}
        >
          {roles.map((role) => {
            const cfg = ADMIN_ROLES[role];
            const Icon = ROLE_ICONS[role];
            const color = cfg.accent;
            return (
              <motion.button
                key={role}
                type="button"
                onClick={() => handleSelect(role)}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="group relative flex flex-col gap-4 rounded-md p-5 text-left transition-colors sm:p-6"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,200,150,0.04), rgba(0,200,150,0.01))",
                  border: `1px solid ${color}55`,
                  boxShadow: `0 0 0 1px ${color}11, 0 8px 24px rgba(0,0,0,0.5)`,
                }}
              >
                {/* Hover glow ring */}
                <span
                  className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `0 0 24px ${color}44, inset 0 0 18px ${color}22` }}
                  aria-hidden
                />

                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <HexBadge color={color}>
                    <Icon className="h-6 w-6" />
                  </HexBadge>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                      style={{
                        color,
                        background: `${color}1A`,
                        border: `1px solid ${color}55`,
                      }}
                    >
                      NIVEAU {cfg.level}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                      {role}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2
                    className="terminal-glow text-lg font-bold uppercase tracking-wide"
                    style={{ color }}
                  >
                    {cfg.label}
                  </h2>
                  <p className="mt-1 break-all text-[11px] text-white/45">
                    {cfg.email}
                  </p>
                </div>

                {/* Permissions */}
                <ul className="scroll-thin -mr-1 max-h-40 space-y-1 overflow-y-auto pr-1 text-[12px] leading-relaxed text-white/65">
                  {cfg.permissions.map((p) => (
                    <li key={p} className="flex gap-1.5">
                      <span style={{ color }} className="select-none">
                        &gt;
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div
                  className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-[12px] font-semibold uppercase tracking-[0.12em]"
                  style={{ borderColor: `${color}33`, color }}
                >
                  <span className="terminal-glow">ACCÉDER AU SYSTÈME</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </motion.section>

        {/* Footer line */}
        <footer className="mt-10 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-[#00C896]/40">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            connexion sécurisée · session 3h
          </span>
          <span className="hidden sm:inline">SÉCUREX CONNECT © {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}
