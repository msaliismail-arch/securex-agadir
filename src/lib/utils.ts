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
    // If the string is a plain YYYY-MM-DD (no time/timezone), parse it as
    // LOCAL midnight — otherwise new Date("2026-06-27") is parsed as UTC and
    // displays as the previous day in UTC+ timezones.
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

/** Validate Moroccan plate format like 12345-A-6 or 1-A-12345. */
export function isValidMaPlate(plate: string): boolean {
  const v = plate.trim().toUpperCase();
  return /^(\d{1,5}-[A-Z]-\d{1,2}|\d{1,2}-[A-Z]{1,3}-\d{1,5})$/.test(v);
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
