"use client";

import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";

/**
 * Renders the validation QR for a given qrToken (generated client-side via
 * the qrcode lib). Shows a skeleton until the data URL is ready.
 */
export function QrDisplay({
  token,
  size = 220,
  className,
  caption,
}: {
  token: string;
  size?: number;
  className?: string;
  caption?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    generateQrDataUrl(token)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!dataUrl) {
    return (
      <div
        className={cn("bg-muted animate-pulse rounded-xl", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border"
        style={{ width: size + 24, height: size + 24 }}
      >
        <img
          src={dataUrl}
          alt="QR code de validation"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      {caption && <p className="mt-2 text-xs text-muted-foreground text-center">{caption}</p>}
    </div>
  );
}
