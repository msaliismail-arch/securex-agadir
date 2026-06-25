/**
 * SÉCUREX CONNECT — shared constants & brand config.
 */

export const BRAND = {
  name: "SÉCUREX CONNECT",
  tagline: "Contrôle Technique Automobile Agréé",
  address: "14 rue Cadi Ayad, Q.I., Agadir",
  city: "Agadir",
  phone: "+212 528 84 12 34",
  phoneRaw: "+212528841234",
  email: "contact@securex-connect.ma",
  hours: "Lun–Ven 8h–18h · Sam 8h–13h",
  hoursWeek: "08:00–18:00",
  hoursSat: "08:00–13:00",
  social: {
    facebook: "https://facebook.com/securexconnect",
    instagram: "https://instagram.com/securexconnect",
    linkedin: "https://linkedin.com/company/securexconnect",
    tiktok: "https://tiktok.com/@securexconnect",
  },
  mapsQuery: "14 rue Cadi Ayad, Quartier Industriel, Agadir, Maroc",
  /** Cold professional green identity */
  primary: "#00C896",
  secondary: "#E8FFF8",
} as const;

export const MAPS_EMBED =
  "https://www.google.com/maps?q=14%20rue%20Cadi%20Ayad%2C%20Quartier%20Industriel%2C%20Agadir%2C%20Maroc&output=embed";
export const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=14%20rue%20Cadi%20Ayad%2C%20Agadir%2C%20Maroc";

/** Category color system — consistent app-wide. */
export type CategoryColor =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "cyan"
  | "indigo"
  | "gray"
  | "emerald"
  | "red";

export const COLOR_MAP: Record<
  CategoryColor,
  { fg: string; bg: string; soft: string; border: string; ring: string; hex: string; label: string }
> = {
  blue: { fg: "text-blue-700", bg: "bg-blue-600", soft: "bg-blue-50", border: "border-blue-200", ring: "ring-blue-500", hex: "#2D9CDB", label: "Bleu" },
  green: { fg: "text-green-700", bg: "bg-green-600", soft: "bg-green-50", border: "border-green-200", ring: "ring-green-500", hex: "#16A34A", label: "Vert" },
  orange: { fg: "text-orange-700", bg: "bg-orange-500", soft: "bg-orange-50", border: "border-orange-200", ring: "ring-orange-500", hex: "#F2994A", label: "Orange" },
  purple: { fg: "text-purple-700", bg: "bg-purple-600", soft: "bg-purple-50", border: "border-purple-200", ring: "ring-purple-500", hex: "#8B5CF6", label: "Violet" },
  cyan: { fg: "text-cyan-700", bg: "bg-cyan-500", soft: "bg-cyan-50", border: "border-cyan-200", ring: "ring-cyan-500", hex: "#06B6D4", label: "Cyan" },
  indigo: { fg: "text-indigo-700", bg: "bg-indigo-600", soft: "bg-indigo-50", border: "border-indigo-200", ring: "ring-indigo-500", hex: "#4F46E5", label: "Indigo" },
  gray: { fg: "text-gray-700", bg: "bg-gray-600", soft: "bg-gray-100", border: "border-gray-200", ring: "ring-gray-500", hex: "#6B7280", label: "Gris" },
  emerald: { fg: "text-emerald-700", bg: "bg-emerald-600", soft: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-500", hex: "#1F7A4D", label: "Émeraude" },
  red: { fg: "text-red-700", bg: "bg-red-600", soft: "bg-red-50", border: "border-red-200", ring: "ring-red-500", hex: "#EB5757", label: "Rouge" },
};

/** Admin roles — exactly 2 roles per spec. */
export type AdminRole = "SUPER" | "RDV";

export const ADMIN_ROLES: Record<
  AdminRole,
  {
    level: number;
    label: string;
    short: string;
    route: string;
    accent: string; // hex for terminal
    color: CategoryColor;
    username: string;
    email: string;
    permissions: string[];
  }
> = {
  SUPER: {
    level: 3,
    label: "Super Admin",
    short: "SUPER",
    route: "/admin/dashboard",
    accent: "#00C896",
    color: "green",
    username: "superadmin",
    email: "admin.general@securex-connect.ma",
    permissions: [
      "Accès complet à tous les modules",
      "Gestion du site web (contenu éditable)",
      "Gestion catégories, services & tarifs",
      "Gestion annonces & notifications",
      "Gestion des administrateurs & permissions",
      "Gestion de tous les rendez-vous & véhicules",
      "Rapports d'inspection & certificats",
      "Statistiques avancées & analytics",
      "Journal d'audit immuable",
      "Paramètres système & identité visuelle",
      "Vérification QR des passages véhicule",
    ],
  },
  RDV: {
    level: 2,
    label: "RDV Admin",
    short: "RDV",
    route: "/admin/rdv",
    accent: "#2D9CDB",
    color: "blue",
    username: "rdvadmin",
    email: "rdv@securex-connect.ma",
    permissions: [
      "Consultation des rendez-vous",
      "Modification du statut uniquement",
      "En attente · Confirmé · Terminé · Annulé",
    ],
  },
};

export const DEMO_OTP = "123456";

/** Appointment statuses — French labels per spec. */
export type AppointmentStatus =
  | "PENDING"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";

export const STATUS_META: Record<
  AppointmentStatus,
  { label: string; color: CategoryColor; icon: string }
> = {
  PENDING: { label: "En attente", color: "orange", icon: "Clock" },
  APPROVED: { label: "Confirmé", color: "green", icon: "CheckCircle2" },
  COMPLETED: { label: "Terminé", color: "purple", icon: "Award" },
  CANCELLED: { label: "Annulé", color: "gray", icon: "Ban" },
};

/** Statuses the RDV admin can set. */
export const RDV_STATUSES: AppointmentStatus[] = ["PENDING", "APPROVED", "COMPLETED", "CANCELLED"];

/** Default time slots (configurable via settings). */
export const DEFAULT_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

/** Public nav. */
export const PUBLIC_NAV = [
  { label: "Accueil", href: "/" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Documents", href: "/documents" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];
