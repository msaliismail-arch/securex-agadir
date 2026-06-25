"use client";

import { cn } from "@/lib/utils";
import { COLOR_MAP, STATUS_META, type CategoryColor, type AppointmentStatus } from "@/lib/constants";

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const c = COLOR_MAP[meta.color as CategoryColor];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        c.soft,
        c.fg,
        c.border,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.bg)} />
      {meta.label}
    </span>
  );
}

export function CategoryBadge({
  color,
  label,
  className,
}: {
  color: string;
  label: string;
  className?: string;
}) {
  const c = COLOR_MAP[(color as CategoryColor) || "gray"] || COLOR_MAP.gray;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        c.soft,
        c.fg,
        c.border,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.bg)} />
      {label}
    </span>
  );
}
