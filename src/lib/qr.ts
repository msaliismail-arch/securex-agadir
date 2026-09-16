import QRCode from "qrcode";

/**
 * Generate a QR code as a base64 PNG data URL.
 */
export async function generateQrDataUrl(
  payload: string,
): Promise<string> {
  const cleanPayload = payload.trim();

  if (!cleanPayload) {
    throw new Error(
      "Le contenu du QR code est vide.",
    );
  }

  return QRCode.toDataURL(
    cleanPayload,
    {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,

      color: {
        dark: "#1A2332",
        light: "#FFFFFF",
      },
    },
  );
}

/**
 * Generate a cryptographically secure opaque token.
 *
 * randomUUID() provides 128 bits of randomness.
 * Removing "-" keeps a compact 32-character token.
 */
export function generateQrToken(): string {
  if (
    !globalThis.crypto?.randomUUID
  ) {
    throw new Error(
      "Secure random generator unavailable.",
    );
  }

  return globalThis.crypto
    .randomUUID()
    .replaceAll("-", "");
}