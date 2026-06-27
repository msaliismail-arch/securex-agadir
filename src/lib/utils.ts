import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a human-friendly 6-char reference code like `7K2Q9X`. */
export function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Format MAD currency. */
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a date string (ISO) to fr-FR. */
export function formatDate(iso: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  let d: Date;
  if (typeof iso === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, day] = iso.split("-").map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(iso);
    }
  } else {
    d = iso;
  }
  return new Intl.DateTimeFormat("fr-FR", opts ?? { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function formatTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatDateTime(iso: string | Date): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** Validate Moroccan phone +212. */
export function isValidMaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^(\+212|0)([5-7])\d{8}$/.test(cleaned);
}

/** Normalize phone to +212XXXXXXXXX. */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("0")) return "+212" + cleaned.slice(1);
  if (cleaned.startsWith("212")) return "+" + cleaned;
  return cleaned;
}

/** Validate Moroccan plate format: NNNNN-LettreArabe-CC ou WW... */
export function isValidMaPlateArabic(v: string): boolean {
  const cleaned = v.replace(/[\s\-]/g, '');
  // Standard: 1-5 chiffres, 1 hrf 3arbi, 1-2 chiffres (code préfecture)
  const standardRegex = /^\d{1,5}[\u0621-\u064A]\d{1,2}$/;
  // Spécial WW (temporaire)
  const wwRegex = /^WW\d+$/i;
  
  return standardRegex.test(cleaned) || wwRegex.test(cleaned);
}

/** Format Moroccan plate to standard display: 00123-أ-01 */
export function formatMaPlate(raw: string): string {
  const cleaned = raw.replace(/[\s\-]/g, '');
  
  // Handle WW
  if (cleaned.toUpperCase().startsWith('WW')) {
    return cleaned.toUpperCase();
  }
  
  // Handle Standard
  const match = cleaned.match(/^(\d{1,5})([\u0621-\u064A])(\d{1,2})$/);
  if (match) {
    const num = match[1].padStart(5, '0'); // 123 -> 00123
    const arabicLetter = match[2];
    const code = match[3].padStart(2, '0'); // 1 -> 01
    return `${num}-${arabicLetter}-${code}`;
  }
  
  return raw; // Fallback
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatDate(d);
}