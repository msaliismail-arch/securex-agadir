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

/**
 * Generate an inspection validation certificate PDF.
 * Client-side only.
 */
export function generateCertificatePdf(
  data: CertificateData,
): Blob {
  if (!data.code.trim()) {
    throw new Error(
      "Référence du certificat manquante.",
    );
  }

  if (!data.clientName.trim()) {
    throw new Error(
      "Nom du client manquant.",
    );
  }

  if (!data.plate.trim()) {
    throw new Error(
      "Immatriculation manquante.",
    );
  }

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;

  const DARK = [26, 35, 50] as const;
  const MUTED = [107, 114, 128] as const;
  const GREEN = [31, 122, 77] as const;
  const GREEN_LIGHT = [232, 244, 238] as const;
  const BORDER = [232, 230, 225] as const;
  const WHITE = [255, 255, 255] as const;

  /* ------------------------------------------------------------------------ */
  /*                                Border                                    */
  /* ------------------------------------------------------------------------ */

  doc.setDrawColor(...DARK);
  doc.setLineWidth(1.2);

  doc.rect(
    10,
    10,
    PAGE_WIDTH - 20,
    PAGE_HEIGHT - 20,
  );

  doc.setLineWidth(0.3);

  doc.rect(
    12,
    12,
    PAGE_WIDTH - 24,
    PAGE_HEIGHT - 24,
  );

  /* ------------------------------------------------------------------------ */
  /*                                Header                                    */
  /* ------------------------------------------------------------------------ */

  doc.setFillColor(...DARK);

  doc.rect(
    12,
    12,
    PAGE_WIDTH - 24,
    26,
    "F",
  );

  doc.setTextColor(...WHITE);
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(20);

  doc.text(
    "SECUREX CONNECT",
    20,
    27,
  );

  doc.setFontSize(9);
  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.text(
    "Controle Technique Automobile Agree",
    20,
    33,
  );

  /* ------------------------------------------------------------------------ */
  /*                                  Title                                   */
  /* ------------------------------------------------------------------------ */

  doc.setTextColor(...DARK);
  doc.setFont(
    "helvetica",
    "bold",
  );
  doc.setFontSize(18);

  doc.text(
    "CERTIFICAT DE VALIDATION",
    PAGE_WIDTH / 2,
    56,
    {
      align: "center",
    },
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);

  doc.text(
    "Inspection technique automobile",
    PAGE_WIDTH / 2,
    63,
    {
      align: "center",
    },
  );

  /* ------------------------------------------------------------------------ */
  /*                               Reference                                  */
  /* ------------------------------------------------------------------------ */

  doc.setFillColor(
    ...GREEN_LIGHT,
  );

  doc.roundedRect(
    60,
    70,
    90,
    15,
    2,
    2,
    "F",
  );

  doc.setTextColor(
    ...GREEN,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(8);

  doc.text(
    "REFERENCE",
    PAGE_WIDTH / 2,
    75,
    {
      align: "center",
    },
  );

  doc.setFontSize(14);

  const reference =
    data.code
      .trim()
      .slice(0, 40);

  doc.text(
    reference,
    PAGE_WIDTH / 2,
    82,
    {
      align: "center",
    },
  );

  /* ------------------------------------------------------------------------ */
  /*                             Information                                  */
  /* ------------------------------------------------------------------------ */

  const rows: Array<
    [string, string]
  > = [
    [
      "Client",
      data.clientName,
    ],
    [
      "Vehicule",
      data.vehicle,
    ],
    [
      "Immatriculation",
      data.plate,
    ],
    [
      "Type de controle",
      data.service,
    ],
    [
      "Date d'inspection",
      data.date,
    ],
    [
      "Resultat",
      data.result,
    ],
  ];

  let y = 104;

  const labelX = 28;
  const valueX = 78;
  const maxValueWidth = 100;

  for (
    const [
      label,
      rawValue,
    ] of rows
  ) {
    const value =
      String(
        rawValue ?? "",
      ).trim() || "—";

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(10);
    doc.setTextColor(...MUTED);

    doc.text(
      label,
      labelX,
      y,
    );

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setTextColor(...DARK);

    const lines =
      doc.splitTextToSize(
        value,
        maxValueWidth,
      ) as string[];

    doc.text(
      lines,
      valueX,
      y,
    );

    const rowHeight =
      Math.max(
        12,
        lines.length * 5 + 5,
      );

    doc.setDrawColor(
      ...BORDER,
    );

    doc.line(
      28,
      y + rowHeight - 5,
      PAGE_WIDTH - 28,
      y + rowHeight - 5,
    );

    y += rowHeight;
  }

  /* ------------------------------------------------------------------------ */
  /*                                   QR                                     */
  /* ------------------------------------------------------------------------ */

  if (
    data.qrDataUrl
  ) {
    const qrSize = 38;

    const qrX =
      PAGE_WIDTH / 2 -
      qrSize / 2;

    const qrY =
      Math.max(
        y + 8,
        185,
      );

    doc.setDrawColor(
      ...BORDER,
    );

    doc.roundedRect(
      qrX - 3,
      qrY - 3,
      qrSize + 6,
      qrSize + 13,
      2,
      2,
    );

    try {
      doc.addImage(
        data.qrDataUrl,
        "PNG",
        qrX,
        qrY,
        qrSize,
        qrSize,
      );

      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.setFontSize(7);
      doc.setTextColor(
        ...MUTED,
      );

      doc.text(
        "QR de verification",
        PAGE_WIDTH / 2,
        qrY +
          qrSize +
          6,
        {
          align:
            "center",
        },
      );
    } catch (error) {
      console.error(
        "[CERTIFICATE_PDF_QR]",
        error,
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                 Footer                                   */
  /* ------------------------------------------------------------------------ */

  doc.setDrawColor(
    ...BORDER,
  );

  doc.line(
    20,
    250,
    PAGE_WIDTH - 20,
    250,
  );

  doc.setFontSize(8);
  doc.setTextColor(
    ...MUTED,
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  if (
    BRAND.address
  ) {
    doc.text(
      String(
        BRAND.address,
      ),
      20,
      258,
    );
  }

  const contact = [
    BRAND.phone,
    BRAND.email,
  ]
    .filter(Boolean)
    .join(" - ");

  if (contact) {
    doc.text(
      contact,
      20,
      263,
    );
  }

  const issuedAt =
    new Date().toLocaleDateString(
      "fr-FR",
    );

  doc.text(
    `Delivre le ${issuedAt} - SECUREX CONNECT`,
    20,
    268,
  );

  doc.setFont(
    "helvetica",
    "italic",
  );

  doc.setFontSize(7.5);

  const footerText =
    "Ce document confirme le resultat enregistre pour le controle technique reference ci-dessus.";

  doc.text(
    footerText,
    PAGE_WIDTH / 2,
    278,
    {
      align: "center",
      maxWidth: 165,
    },
  );

  return doc.output(
    "blob",
  );
}