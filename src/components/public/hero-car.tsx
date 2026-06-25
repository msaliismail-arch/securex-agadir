"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Gauge, BadgeCheck } from "lucide-react";

/**
 * HeroCar — signature animated scene for the homepage hero.
 *
 * A modern stylized side-view car enters from the left, pauses in the
 * center, then continues off-screen to the right, on a seamless loop.
 * Includes a moving road, spinning wheels, a subtle idle body-bounce,
 * floating inspection icons, and a soft brand glow.
 */
export function HeroCar() {
  return (
    <div
      className="relative h-[360px] w-full overflow-hidden rounded-3xl glass-card shadow-float sm:h-[420px]"
      aria-hidden="true"
    >
      {/* ambient mesh + brand glow */}
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-[42%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-6 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />

      {/* floating inspection icons */}
      <FloatingIcon
        className="left-5 top-8 sm:left-8 sm:top-10"
        delay={0}
        duration={3.6}
        y={[-6, -14, -6]}
      >
        <ShieldCheck className="h-5 w-5 text-primary" />
      </FloatingIcon>

      <FloatingIcon
        className="right-6 top-14 sm:right-10"
        delay={0.6}
        duration={4.2}
        y={[-4, -12, -4]}
      >
        <Award className="h-5 w-5 text-primary" />
      </FloatingIcon>

      <FloatingIcon
        className="bottom-24 right-10 sm:bottom-28 sm:right-20"
        delay={1.1}
        duration={3.2}
        y={[-4, -10, -4]}
      >
        <Gauge className="h-4 w-4 text-primary" />
      </FloatingIcon>

      <FloatingIcon
        className="bottom-28 left-8 sm:left-14"
        delay={0.3}
        duration={3.8}
        y={[-2, -8, -2]}
      >
        <BadgeCheck className="h-4 w-4 text-primary" />
      </FloatingIcon>

      {/* road */}
      <div className="absolute inset-x-0 bottom-14 h-16">
        {/* road surface band */}
        <div className="absolute inset-x-6 bottom-2 h-10 rounded-full bg-foreground/[0.04] blur-[2px]" />
        {/* center dashed lane */}
        <div className="absolute inset-x-0 bottom-8 h-1.5">
          <div className="road-lines absolute inset-0 opacity-70" />
        </div>
        {/* road edges */}
        <div className="absolute inset-x-4 bottom-3 h-px bg-foreground/10" />
        <div className="absolute inset-x-4 bottom-14 h-px bg-foreground/[0.06]" />
      </div>

      {/* the car — keyframed entrance, pause, exit, loop */}
      <motion.div
        className="absolute bottom-12 left-0 w-[260px] sm:w-[320px]"
        initial={{ x: "-130%" }}
        animate={{ x: ["-130%", "0%", "0%", "130%"] }}
        transition={{
          duration: 5.4,
          times: [0, 0.34, 0.66, 1],
          ease: [0.45, 0, 0.55, 1],
          repeat: Infinity,
          repeatDelay: 0.7,
        }}
      >
        {/* subtle idle bounce while paused (and a hint while moving) */}
        <motion.div
          animate={{ y: [0, -2.5, 0] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <CarSvg />
        </motion.div>
      </motion.div>

      {/* status pill */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2">
        <div className="flex items-center gap-1.5 rounded-full glass-strong px-3 py-1.5 text-[11px] font-medium text-foreground/70 shadow-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Inspection en temps réel
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function FloatingIcon({
  children,
  className,
  delay = 0,
  duration = 3.5,
  y = [0, -10, 0],
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number[];
}) {
  return (
    <motion.div
      animate={{ y }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`pointer-events-none absolute flex h-10 w-10 items-center justify-center rounded-xl glass-card shadow-card sm:h-12 sm:w-12 ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stylized modern car — side view. Brand-green body, light glass,
 * dark wheels with spinning green spokes, amber headlight, red taillight.
 */
function CarSvg() {
  return (
    <svg
      viewBox="0 0 320 150"
      className="h-auto w-full drop-shadow-[0_18px_18px_rgba(0,200,150,0.25)]"
      role="img"
      aria-label="Voiture en mouvement — contrôle technique SÉCUREX CONNECT"
    >
      <defs>
        <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D89F" />
          <stop offset="100%" stopColor="#00A87E" />
        </linearGradient>
        <linearGradient id="carGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0FFF9" />
          <stop offset="100%" stopColor="#B3FEE3" />
        </linearGradient>
        <radialGradient id="wheelHub" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#00C896" />
          <stop offset="60%" stopColor="#1A3A30" />
          <stop offset="100%" stopColor="#0F2A23" />
        </radialGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="160" cy="138" rx="115" ry="5" fill="rgba(0,200,150,0.22)" />

      {/* car body — sleek silhouette */}
      <path
        d="M 28 100
           C 28 78, 48 72, 74 70
           L 108 62
           C 120 36, 146 28, 178 28
           L 218 30
           C 248 33, 272 50, 282 72
           L 296 76
           C 306 79, 309 87, 306 97
           L 306 102
           C 306 107, 301 110, 296 110
           L 286 110
           A 22 22 0 0 0 240 110
           L 104 110
           A 22 22 0 0 0 58 110
           L 40 110
           C 32 110, 28 105, 28 102
           Z"
        fill="url(#carBody)"
      />

      {/* body highlight */}
      <path
        d="M 60 86 C 110 80, 200 78, 280 84 L 282 90 C 200 84, 110 86, 62 92 Z"
        fill="rgba(255,255,255,0.18)"
      />

      {/* greenhouse / glass */}
      <path
        d="M 112 64
           C 124 40, 148 33, 178 33
           L 216 35
           C 238 38, 258 52, 266 64
           L 250 64
           L 110 64
           Z"
        fill="url(#carGlass)"
        opacity="0.92"
      />

      {/* B-pillar */}
      <line
        x1="188"
        y1="34"
        x2="188"
        y2="64"
        stroke="#0F2A23"
        strokeOpacity="0.28"
        strokeWidth="2"
      />

      {/* windshield reflection */}
      <path
        d="M 120 60 L 150 38 L 156 40 L 124 62 Z"
        fill="rgba(255,255,255,0.55)"
      />

      {/* headlight */}
      <path
        d="M 293 80 L 306 84 L 306 92 L 294 92 Z"
        fill="#FFD15C"
      />
      <path
        d="M 306 86 L 318 88 L 318 92 L 306 92 Z"
        fill="rgba(255,209,92,0.45)"
      />

      {/* taillight */}
      <rect x="30" y="80" width="7" height="11" rx="2" fill="#EB5757" />

      {/* door handle */}
      <rect
        x="170"
        y="76"
        width="18"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.55)"
      />

      {/* side character line */}
      <path
        d="M 50 96 C 110 92, 210 90, 290 94"
        stroke="rgba(15,42,35,0.18)"
        strokeWidth="1.2"
        fill="none"
      />

      {/* === wheels === */}
      <Wheel cx={80} cy={110} />
      <Wheel cx={260} cy={110} />
    </svg>
  );
}

/** A single wheel: static tire + hub, with continuously spinning spokes. */
function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {/* tire */}
      <circle cx={cx} cy={cy} r={22} fill="#0F2A23" />
      <circle cx={cx} cy={cy} r={22} fill="none" stroke="rgba(0,200,150,0.35)" strokeWidth={1.5} />
      {/* hub well */}
      <circle cx={cx} cy={cy} r={13} fill="url(#wheelHub)" />
      {/* spinning spokes */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
      >
        <g stroke="#00C896" strokeWidth={2.4} strokeLinecap="round">
          <line x1={cx} y1={cy - 11} x2={cx} y2={cy + 11} />
          <line x1={cx - 11} y1={cy} x2={cx + 11} y2={cy} />
          <line x1={cx - 8} y1={cy - 8} x2={cx + 8} y2={cy + 8} />
          <line x1={cx + 8} y1={cy - 8} x2={cx - 8} y2={cy + 8} />
        </g>
        <circle cx={cx} cy={cy} r={3} fill="#00C896" />
      </motion.g>
    </g>
  );
}
