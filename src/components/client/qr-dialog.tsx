"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, QrCode } from "lucide-react";
import { generateQrDataUrl } from "@/lib/qr";
import { generateCertificatePdf } from "@/lib/pdf";
import { toast } from "sonner";
import type { AppointmentItem } from "./types";

/** QR modal: fetches QR data URL for an appointment's qrToken and displays it. */
export function QrDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AppointmentItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [qrUrl, setQrUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !appointment?.qrToken) {
      setQrUrl(null);
      return;
    }
    let active = true;
    setLoading(true);
    setQrUrl(null);
    (async () => {
      try {
        const url = await generateQrDataUrl(appointment.qrToken!);
        if (active) setQrUrl(url);
      } catch {
        if (active) toast.error("Impossible de générer le QR code.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, appointment]);

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-navy">
            <QrCode className="h-5 w-5 text-emerald-brand" /> QR Code de validation
          </DialogTitle>
          <DialogDescription>
            Présentez ce QR code à l&apos;accueil pour vérification.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border-2 border-emerald-brand/30 bg-emerald-50 p-4">
            {loading ? (
              <div className="flex h-52 w-52 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-brand" />
              </div>
            ) : qrUrl ? (
              <img src={qrUrl} alt="QR code de validation" className="h-52 w-52" />
            ) : (
              <div className="flex h-52 w-52 items-center justify-center text-sm text-muted-foreground">
                QR indisponible
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Référence</p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em] text-navy">{appointment.code}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Download a certificate PDF for a COMPLETED appointment (PASS result). */
export async function downloadCertificate(appt: AppointmentItem) {
  try {
    if (!appt.result) {
      toast.error("Résultat d'inspection indisponible.");
      return;
    }
    let qrDataUrl: string | undefined;
    if (appt.qrToken) {
      try {
        qrDataUrl = await generateQrDataUrl(appt.qrToken);
      } catch {
        // ignore QR error — certificate still valid without QR
      }
    }
    const blob = generateCertificatePdf({
      code: appt.code,
      clientName: appt.clientName,
      plate: appt.vehiclePlate,
      vehicle: appt.vehicleDesc,
      service: appt.service.name,
      date: new Date(appt.date).toLocaleDateString("fr-FR"),
      result: appt.result.overallResult === "PASS" ? "Accepté (PASS)" : "Refusé (FAIL)",
      qrDataUrl,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificat-${appt.code}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Certificat téléchargé.");
  } catch {
    toast.error("Erreur lors de la génération du certificat.");
  }
}

export function CertificateButton({
  appointment,
  className,
  variant = "outline",
  size,
  label = "Télécharger le certificat",
}: {
  appointment: AppointmentItem;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadCertificate(appointment);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}
