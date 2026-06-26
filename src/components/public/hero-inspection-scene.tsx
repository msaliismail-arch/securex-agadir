"use client";

import * as React from "react";
import { motion } from "framer-motion";

/**
 * HeroInspectionScene — premium signature scene for the homepage hero.
 *
 * A realistic technical-inspection center: the vehicle enters from the LEFT,
 * stops in the CENTER to be inspected by a professional inspector, then
 * continues off-screen to the RIGHT (looping). Subtle micro-animations
 * symbolise road safety, vehicle verification, technical control, inspection
 * validation, trust & compliance and secure mobility.
 *
 * Built as a single layered SVG with framer-motion choreography on a 7s loop.
 * Car phase:   enter 0→0.28  ·  inspect 0.28→0.72  ·  exit 0.72→1
 */
const LOOP = 7; // seconds
const ENTER = 0.28;
const EXIT = 0.72;

export function HeroInspectionScene() {
  return (
    <div
      className="relative h-[380px] w-full overflow-hidden rounded-3xl border border-white/40 bg-white/5 shadow-float backdrop-blur-sm sm:h-[460px]"
      aria-label="Scène de contrôle technique : véhicule inspecté par un professionnel"
      role="img"
    >
      {/* === ambient backdrop === */}
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      {/* === the layered scene === */}
      <svg
        viewBox="0 0 440 340"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0FFF9" />
            <stop offset="100%" stopColor="#E8FFF8" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6F2EE" />
            <stop offset="100%" stopColor="#F4FBF8" />
          </linearGradient>
          <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00B586" />
            <stop offset="100%" stopColor="#00876A" />
          </linearGradient>
          <linearGradient id="carGlass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0FFF9" />
            <stop offset="100%" stopColor="#B3FEE3" />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#00C896" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#00C896" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="wheelHub" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#00C896" />
            <stop offset="60%" stopColor="#1A3A30" />
            <stop offset="100%" stopColor="#0F2A23" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C896" stopOpacity="0" />
            <stop offset="50%" stopColor="#00C896" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00C896" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* --- back wall --- */}
        <rect x="0" y="0" width="440" height="230" fill="url(#wall)" />

        {/* --- overhead light bar --- */}
        <rect x="150" y="18" width="140" height="9" rx="4.5" fill="#D9FFF1" />
        <rect x="150" y="18" width="140" height="9" rx="4.5" fill="url(#glow)" opacity="0.7" />
        <motion.rect
          x="150" y="27" width="140" height="60" rx="6"
          fill="#00C896" opacity="0.06"
          animate={{ opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* --- wall control panel (right) --- */}
        <g>
          <rect x="350" y="48" width="74" height="44" rx="6" fill="#FFFFFF" stroke="#D9FFF1" />
          <rect x="358" y="56" width="58" height="8" rx="3" fill="#E8FFF8" />
          <circle cx="366" cy="78" r="4" fill="#00C896" />
          <circle cx="382" cy="78" r="4" fill="#2D9CDB" />
          <circle cx="398" cy="78" r="4" fill="#F2994A" />
          <motion.circle cx="412" cy="78" r="4" fill="#00C896"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
        </g>

        {/* --- wall signage (left) --- */}
        <g opacity="0.55">
          <rect x="26" y="48" width="56" height="26" rx="5" fill="#FFFFFF" stroke="#D9FFF1" />
          <text x="54" y="65" textAnchor="middle" fontSize="9" fontWeight="700" fill="#00A87E" fontFamily="Inter, sans-serif">SÉCUREX</text>
        </g>

        {/* --- ambient brand glow behind car (subtle, keeps car visible) --- */}
        <ellipse cx="220" cy="200" rx="150" ry="70" fill="url(#glow)" opacity="0.6" />

        {/* --- floor --- */}
        <polygon points="0,230 440,230 440,340 0,340" fill="url(#floor)" />
        {/* perspective floor lines */}
        <g stroke="#00C896" strokeWidth="1" opacity="0.12">
          <line x1="0" y1="230" x2="440" y2="230" />
          <line x1="60" y1="340" x2="170" y2="230" />
          <line x1="380" y1="340" x2="270" y2="230" />
          <line x1="160" y1="340" x2="200" y2="230" />
          <line x1="280" y1="340" x2="240" y2="230" />
        </g>

        {/* --- inspection ramp (under car) --- */}
        <g>
          <rect x="120" y="252" width="200" height="10" rx="3" fill="#CFE8DF" />
          <rect x="120" y="252" width="200" height="3" rx="1.5" fill="#00C896" opacity="0.5" />
          <rect x="124" y="262" width="6" height="14" rx="2" fill="#9FC4B5" />
          <rect x="310" y="262" width="6" height="14" rx="2" fill="#9FC4B5" />
        </g>

        {/* --- overhead boom arm + lamp --- */}
        <g stroke="#9FC4B5" strokeWidth="2.5" fill="none">
          <line x1="60" y1="18" x2="60" y2="150" />
          <path d="M 60 150 Q 60 168 80 168 L 150 168" />
        </g>
        <motion.rect
          x="150" y="160" width="20" height="12" rx="3" fill="#1A3A30"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.polygon
          points="160,172 200,210 120,210" fill="#00C896" opacity="0.1"
          animate={{ opacity: [0.06, 0.16, 0.06] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* --- tool cart (bottom-left) --- */}
        <g>
          <rect x="16" y="284" width="34" height="30" rx="3" fill="#FFFFFF" stroke="#D9FFF1" />
          <rect x="16" y="284" width="34" height="8" rx="3" fill="#00C896" opacity="0.8" />
          <circle cx="24" cy="316" r="3" fill="#1A3A30" />
          <circle cx="42" cy="316" r="3" fill="#1A3A30" />
          <rect x="22" y="298" width="22" height="3" rx="1.5" fill="#E8FFF8" />
          <rect x="22" y="304" width="22" height="3" rx="1.5" fill="#E8FFF8" />
        </g>

        {/* === TRUST / SAFETY — pulsing shield (top-left) === */}
        <PulseShield x={42} y={108} />

        {/* === TECHNICAL CONTROL — gauge with sweeping needle (bottom-right) === */}
        <Gauge x={396} y={296} />

        {/* === STATUS DOTS — light up in sequence during inspection === */}
        <StatusDots />

        {/* === VEHICLE — enters left, inspected center, exits right === */}
        <motion.g
          animate={{ x: [-360, 0, 0, 360] }}
          transition={{
            duration: LOOP,
            times: [0, ENTER, EXIT, 1],
            ease: [0.42, 0, 0.58, 1],
            repeat: Infinity,
            repeatDelay: 0.4,
          }}
        >
          {/* ground shadow under the car */}
          <motion.ellipse
            cx="220" cy="262" rx="118" ry="6" fill="rgba(0,200,150,0.22)"
            animate={{ opacity: [0.1, 0.25, 0.25, 0.1] }}
            transition={{ duration: LOOP, times: [0, ENTER, EXIT, 1], repeat: Infinity, repeatDelay: 0.4 }}
          />
          {/* speed lines behind the car (rear/left) — only while moving */}
          <motion.g
            stroke="#00C896" strokeWidth="2" strokeLinecap="round" opacity="0.5"
            animate={{ opacity: [0.55, 0, 0, 0.55], x: [0, 18, 0, -18] }}
            transition={{ duration: LOOP, times: [0, ENTER, EXIT, 1], repeat: Infinity, repeatDelay: 0.4, ease: "easeOut" }}
          >
            <line x1="70" y1="214" x2="92" y2="214" />
            <line x1="62" y1="226" x2="90" y2="226" />
            <line x1="70" y1="238" x2="92" y2="238" />
          </motion.g>
          {/* headlight beam projecting forward (right) — only while moving */}
          <motion.polygon
            points="374,218 410,210 410,228 374,224"
            fill="#FFD15C" opacity="0.35"
            animate={{ opacity: [0.4, 0, 0, 0.4] }}
            transition={{ duration: LOOP, times: [0, ENTER, EXIT, 1], repeat: Infinity, repeatDelay: 0.4 }}
          />
          <CarSvg />
        </motion.g>

        {/* === SCAN BEAM — sweeps across the vehicle while paused === */}
        <motion.rect
          x={0} y={150} width={14} height={104} rx={7} fill="url(#beam)"
          animate={{
            x: [120, 120, 326, 326, 120],
            opacity: [0, 0.7, 0.7, 0, 0],
          }}
          transition={{
            duration: LOOP,
            times: [0, ENTER, (ENTER + EXIT) / 2, EXIT, 1],
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.4,
          }}
        />

        {/* === INSPECTION VALIDATION — sequential checkmarks === */}
        <CheckMark x={330} y={196} popAt={0.36} label="freins" />
        <CheckMark x={232} y={150} popAt={0.46} label="éclairage" />
        <CheckMark x={150} y={196} popAt={0.56} label="pneus" />
        <CheckMark x={296} y={250} popAt={0.64} label="émissions" />

        {/* === INSPECTOR — appears beside the vehicle while it is stopped === */}
        <Inspector />
      </svg>

      {/* === live status pill (HTML overlay) === */}
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
        <div className="flex items-center gap-1.5 rounded-full glass-strong px-3 py-1.5 text-[11px] font-medium text-foreground/70 shadow-soft">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Inspection en temps réel · Centre agréé Agadir
        </div>
      </div>
    </div>
  );
}

/* ============================== VEHICLE ============================== */
function CarSvg() {
  return (
    <g>
      {/* body — sleek modern side view, facing RIGHT (headlight right) */}
      <path
        d="M 96 232
           C 96 210, 116 204, 142 202
           L 176 194
           C 188 168, 214 160, 246 160
           L 286 162
           C 316 165, 340 182, 350 204
           L 364 208
           C 374 211, 377 219, 374 229
           L 374 234
           C 374 239, 369 242, 364 242
           L 354 242
           A 22 22 0 0 0 308 242
           L 172 242
           A 22 22 0 0 0 126 242
           L 108 242
           C 100 242, 96 237, 96 234
           Z"
        fill="url(#carBody)"
        stroke="#0F2A23"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* body highlight */}
      <path
        d="M 128 218 C 178 212, 268 210, 348 216 L 350 222 C 268 216, 178 218, 130 224 Z"
        fill="rgba(255,255,255,0.18)"
      />
      {/* greenhouse / glass */}
      <path
        d="M 180 196
           C 192 172, 216 165, 246 165
           L 284 167
           C 306 170, 326 184, 334 196
           L 318 196
           L 178 196 Z"
        fill="url(#carGlass)"
        opacity="0.92"
      />
      {/* B-pillar */}
      <line x1="256" y1="166" x2="256" y2="196" stroke="#0F2A23" strokeOpacity="0.28" strokeWidth="2" />
      {/* windshield reflection */}
      <path d="M 188 192 L 218 170 L 224 172 L 192 194 Z" fill="rgba(255,255,255,0.55)" />
      {/* headlight (front, right) */}
      <path d="M 361 212 L 374 216 L 374 224 L 362 224 Z" fill="#FFD15C" />
      <path d="M 374 218 L 386 220 L 386 224 L 374 224 Z" fill="rgba(255,209,92,0.5)" />
      {/* taillight (rear, left) */}
      <rect x="98" y="212" width="7" height="11" rx="2" fill="#EB5757" />
      {/* door handle */}
      <rect x="238" y="208" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.55)" />
      {/* character line */}
      <path d="M 118 228 C 178 224, 278 222, 358 226" stroke="rgba(15,42,35,0.18)" strokeWidth="1.2" fill="none" />
      {/* wheels */}
      <Wheel cx={148} cy={242} />
      <Wheel cx={328} cy={242} />
    </g>
  );
}

function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill="#0F2A23" />
      <circle cx={cx} cy={cy} r={22} fill="none" stroke="rgba(0,200,150,0.35)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={13} fill="url(#wheelHub)" />
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
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

/* ============================== INSPECTOR ============================== */
function Inspector() {
  // Positioned clearly to the RIGHT of the centered car, standing on the floor.
  const cx = 404; // figure center
  return (
    <motion.g
      animate={{ opacity: [0, 0, 1, 1, 0] }}
      transition={{
        duration: LOOP,
        times: [0, ENTER - 0.02, ENTER + 0.02, EXIT - 0.02, EXIT + 0.02],
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 0.4,
      }}
    >
      {/* shadow */}
      <ellipse cx={cx} cy={262} rx="18" ry="3.5" fill="rgba(15,42,35,0.2)" />
      {/* legs */}
      <rect x={cx - 9} y={234} width="7" height="26" rx="3" fill="#1A3A30" />
      <rect x={cx + 2} y={234} width="7" height="26" rx="3" fill="#1A3A30" />
      {/* boots */}
      <rect x={cx - 11} y={258} width="10" height="4.5" rx="2" fill="#0F2A23" />
      <rect x={cx + 1} y={258} width="10" height="4.5" rx="2" fill="#0F2A23" />
      {/* torso — high-vis vest (green) over dark uniform */}
      <path d={`M ${cx - 14} ${200} L ${cx + 14} ${200} L ${cx + 16} ${236} L ${cx - 16} ${236} Z`} fill="#0F2A23" />
      <path d={`M ${cx - 12} ${202} L ${cx + 12} ${202} L ${cx + 13} ${220} L ${cx - 13} ${220} Z`} fill="#00C896" />
      <path d={`M ${cx - 13} ${222} L ${cx + 13} ${222} L ${cx + 14} ${234} L ${cx - 14} ${234} Z`} fill="#00D89F" />
      {/* reflective stripes */}
      <rect x={cx - 14} y={219} width="28" height="2.2" fill="#F0FFF9" opacity="0.9" />
      {/* neck + head */}
      <rect x={cx - 4} y={192} width="8" height="9" fill="#E8C9A8" />
      <circle cx={cx} cy={185} r="9.5" fill="#F0D4B0" />
      {/* hard hat */}
      <path d={`M ${cx - 11} ${184} Q ${cx} ${170} ${cx + 11} ${184} L ${cx + 11} ${187} L ${cx - 11} ${187} Z`} fill="#00C896" />
      <rect x={cx - 12} y={185} width="24" height="3" rx="1.5" fill="#00A87E" />
      {/* right arm holding tablet — taps while inspecting */}
      <motion.g
        animate={{ rotate: [0, -7, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: ENTER }}
        style={{ transformBox: "fill-box", transformOrigin: `${cx + 12}px 206px` } as React.CSSProperties}
      >
        <rect x={cx + 11} y={204} width="5" height="18" rx="2.5" fill="#0F2A23" />
        <rect x={cx + 14} y={216} width="18" height="13" rx="2.5" fill="#1A3A30" />
        <motion.rect x={cx + 16} y={218} width="14" height="9" rx="1.5" fill="#00C896"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.g>
      {/* left arm */}
      <rect x={cx - 16} y={204} width="5" height="16" rx="2.5" fill="#0F2A23" />
    </motion.g>
  );
}

/* ============================== SCAN-CHECKMARKS ============================== */
function CheckMark({ x, y, popAt, label }: { x: number; y: number; popAt: number; label: string }) {
  const before = Math.max(0, popAt - 0.02);
  const after = Math.min(1, popAt + 0.04);
  return (
    <motion.g
      animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }}
      transition={{
        duration: LOOP,
        times: [0, before, popAt, after, 1],
        ease: [0.34, 1.56, 0.64, 1],
        repeat: Infinity,
        repeatDelay: 0.4,
      }}
      style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
    >
      <circle cx={x} cy={y} r="11" fill="#00C896" />
      <circle cx={x} cy={y} r="11" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
      <path
        d={`M ${x - 4} ${y} L ${x - 1} ${y + 3.5} L ${x + 4.5} ${y - 3}`}
        stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <text x={x} y={y + 22} textAnchor="middle" fontSize="7" fontWeight="600" fill="#00A87E" fontFamily="Inter, sans-serif">
        {label}
      </text>
    </motion.g>
  );
}

/* ============================== PULSING SHIELD (trust / safety) ============================== */
function PulseShield({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 0.6, 1.2].map((delay) => (
        <motion.circle
          key={delay}
          cx={x} cy={y} r="14" fill="none" stroke="#00C896" strokeWidth="1.5"
          animate={{ r: [14, 26], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
        />
      ))}
      <circle cx={x} cy={y} r="14" fill="#FFFFFF" stroke="#00C896" strokeWidth="1.5" />
      <path
        d={`M ${x} ${y - 8} L ${x + 7} ${y - 5} L ${x + 7} ${y + 1} C ${x + 7} ${y + 6} ${x} ${y + 9} ${x} ${y + 9} C ${x} ${y + 9} ${x - 7} ${y + 6} ${x - 7} ${y + 1} L ${x - 7} ${y - 5} Z`}
        fill="#00C896"
      />
      <path
        d={`M ${x - 3.5} ${y} L ${x - 1} ${y + 3} L ${x + 4} ${y - 3}`}
        stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </g>
  );
}

/* ============================== GAUGE (technical control) ============================== */
function Gauge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill="#FFFFFF" stroke="#D9FFF1" />
      <circle cx={x} cy={y} r="22" fill="none" stroke="#00C896" strokeWidth="1.5" opacity="0.3" strokeDasharray="2 3" />
      {/* ticks */}
      <g stroke="#9FC4B5" strokeWidth="1.4" strokeLinecap="round">
        <line x1={x - 14} y1={y + 8} x2={x - 11} y2={y + 6} />
        <line x1={x - 16} y1={y} x2={x - 13} y2={y} />
        <line x1={x} y1={y - 16} x2={x} y2={y - 13} />
        <line x1={x + 14} y1={y + 8} x2={x + 11} y2={y + 6} />
        <line x1={x + 16} y1={y} x2={x + 13} y2={y} />
      </g>
      {/* needle — sweeps during inspection */}
      <motion.g
        animate={{ rotate: [-50, -50, 55, 30, -50] }}
        transition={{
          duration: LOOP,
          times: [0, ENTER, (ENTER + EXIT) / 2, EXIT, 1],
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 0.4,
        }}
        style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
      >
        <line x1={x} y1={y} x2={x} y2={y - 14} stroke="#00C896" strokeWidth="2.2" strokeLinecap="round" />
      </motion.g>
      <circle cx={x} cy={y} r="3" fill="#1A3A30" />
      <text x={x} y={y + 30} textAnchor="middle" fontSize="7" fontWeight="600" fill="#6B8278" fontFamily="Inter, sans-serif">CTRL</text>
    </g>
  );
}

/* ============================== STATUS DOTS (sequence) ============================== */
function StatusDots() {
  const xs = [188, 210, 232, 254];
  return (
    <g>
      {xs.map((x, i) => {
        const on = ENTER + 0.04 * (i + 1);
        const off = EXIT;
        return (
          <g key={x}>
            <circle cx={x} cy={120} r="5" fill="#FFFFFF" stroke="#D9FFF1" />
            <motion.circle
              cx={x} cy={120} r="5" fill="#00C896"
              animate={{ opacity: [0, 0, 1, 1, 0] }}
              transition={{
                duration: LOOP,
                times: [0, on - 0.01, on, off, 1],
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.4,
              }}
            />
          </g>
        );
      })}
      <text x="221" y="138" textAnchor="middle" fontSize="7" fontWeight="600" fill="#6B8278" fontFamily="Inter, sans-serif">POINTS DE CONTRÔLE</text>
    </g>
  );
}
