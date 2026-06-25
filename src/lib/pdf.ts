import jsPDF from "jspdf";
import { BRAND } from "./constants";

export interface CertificateData {
  code: string;
  clientName: string;
  plate: string;
  vehicle: string;
  service: string;
  date: string;
  result: string;
  qrDataUrl?: string;
}

/** Generate an inspection validation certificate PDF (client-side, Blob). */
export function generateCertificatePdf(data: CertificateData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;

  // Outer border
  doc.setDrawColor("#1A2332");
  doc.setLineWidth(1.2);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, W - 24, H - 24);

  // Header band
  doc.setFillColor("#1A2332");
  doc.rect(12, 12, W - 24, 26, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SÉCUREX CONNECT", 20, 27);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Contrôle Technique Automobile Agréé", 20, 33);

  // Title
  doc.setTextColor("#1A2332");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CERTIFICAT DE VALIDATION", W / 2, 56, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#6B7280");
  doc.text("D'inspection technique automobile", W / 2, 63, { align: "center" });

  // Reference
  doc.setFillColor("#E8F4EE");
  doc.roundedRect(60, 70, 90, 14, 2, 2, "F");
  doc.setTextColor("#1F7A4D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RÉFÉRENCE", W / 2, 75, { align: "center" });
  doc.setFontSize(15);
  doc.text(data.code, W / 2, 81, { align: "center" });

  // Info block
  doc.setTextColor("#1A2332");
  doc.setFontSize(11);
  let y = 104;
  const rows: [string, string][] = [
    ["Client", data.clientName],
    ["Véhicule", data.vehicle],
    ["Immatriculation", data.plate],
    ["Type de contrôle", data.service],
    ["Date d'inspection", data.date],
    ["Résultat", data.result],
  ];
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#6B7280");
    doc.text(k, 30, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1A2332");
    doc.text(v, 80, y);
    doc.setDrawColor("#E8E6E1");
    doc.line(28, y + 2, W - 28, y + 2);
    y += 12;
  }

  // QR
  if (data.qrDataUrl) {
    doc.addImage(data.qrDataUrl, "PNG", 145, 100, 40, 40);
    doc.setFontSize(7);
    doc.setTextColor("#6B7280");
    doc.text("Scan pour vérification", 165, 145, { align: "center" });
  }

  // Footer
  doc.setDrawColor("#E8E6E1");
  doc.line(20, 250, W - 20, 250);
  doc.setFontSize(8);
  doc.setTextColor("#6B7280");
  doc.setFont("helvetica", "normal");
  doc.text(BRAND.address, 20, 258);
  doc.text(`${BRAND.phone} · ${BRAND.email}`, 20, 263);
  doc.text(`Délivré le ${new Date().toLocaleDateString("fr-FR")} · Document officiel SÉCUREX CONNECT`, 20, 268);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Ce certificat atteste que le véhicule listé a satisfait aux exigences du contrôle technique.",
    W / 2,
    278,
    { align: "center" }
  );

  return doc.output("blob");
}
