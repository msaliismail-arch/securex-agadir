// Shared types for the Validation Admin (Gestion RDV) space.

export type AppointmentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description?: string;
}

export interface ServiceRef {
  id: string;
  name: string;
  slug: string;
  price: number;
  durationMin: number;
  categoryId: string;
}

export interface InspectionResultRef {
  id: string;
  appointmentId: string;
  overallResult: "PASS" | "FAIL";
  brakes: string;
  lights: string;
  tires: string;
  emissions: string;
  bodywork: string;
  inspector: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  code: string;
  clientId: string;
  vehicleId: string | null;
  categoryId: string;
  serviceId: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  qrToken: string | null;
  qrGeneratedAt: string | null;
  queueNumber: number | null;
  notes: string | null;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  vehicleDesc: string;
  category?: CategoryRef;
  service?: ServiceRef;
  result?: InspectionResultRef | null;
  createdAt: string;
  updatedAt: string;
}
