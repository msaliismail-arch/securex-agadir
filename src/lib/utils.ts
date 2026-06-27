import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

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

export function isValidMaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^(\+212|0)([5-7])\d{8}$/.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("0")) return "+212" + cleaned.slice(1);
  if (cleaned.startsWith("212")) return "+" + cleaned;
  return cleaned;
}

// --- NOUVELLES FONCTIONS IMMATRICULATION ---
export function isValidMaPlateArabic(v: string): boolean {
  const cleaned = v.replace(/[\s\-]/g, '');
  const standardRegex = /^\d{1,5}[\u0621-\u064A]\d{1,2}$/;
  const wwRegex = /^WW\d+$/i;
  return standardRegex.test(cleaned) || wwRegex.test(cleaned);
}

export function formatMaPlate(raw: string): string {
  const cleaned = raw.replace(/[\s\-]/g, '');
  if (cleaned.toUpperCase().startsWith('WW')) return cleaned.toUpperCase();
  const match = cleaned.match(/^(\d{1,5})([\u0621-\u064A])(\d{1,2})$/);
  if (match) return `${match[1].padStart(5, '0')}-${match[2]}-${match[3].padStart(2, '0')}`;
  return raw;
}

// --- ANCIENNE FONCTION POUR L'ADMIN (Ne pas supprimer) ---
export function isValidMaPlate(plate: string): boolean {
  const v = plate.trim().toUpperCase();
  return /^(\d{1,5}-[A-Z]-\d{1,2}|\d{1,2}-[A-Z]{1,3}-\d{1,5})$/.test(v) || isValidMaPlateArabic(plate);
}
// --------------------------------------

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
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