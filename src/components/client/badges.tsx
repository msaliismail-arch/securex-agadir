"use client";

import * as React from "react";

import {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Ban,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  STATUS_META,
  COLOR_MAP,
} from "@/lib/constants";

import { cn } from "@/lib/utils";

import type {
  AppointmentStatus,
} from "@/components/client/types";

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const ICONS: Record<
  string,
  LucideIcon
> = {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Ban,
};

/* -------------------------------------------------------------------------- */
/*                              Appointment badge                             */
/* -------------------------------------------------------------------------- */

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const meta =
    STATUS_META[status];

  /*
   * Sécurité supplémentaire si jamais
   * STATUS_META est mal configuré.
   */
  if (!meta) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 font-medium",
          className,
        )}
      >
        <Clock className="h-3 w-3" />

        {status}
      </Badge>
    );
  }

  const color =
    COLOR_MAP[
      meta.color as keyof typeof COLOR_MAP
    ] ?? COLOR_MAP.blue;

  const Icon =
    ICONS[
      meta.icon
    ] ?? Clock;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-transparent font-medium text-white",
        color.bg,
        className,
      )}
    >
      <Icon className="h-3 w-3" />

      {meta.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Category badge                              */
/* -------------------------------------------------------------------------- */

export function CategoryBadge({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  const categoryColor =
    COLOR_MAP[
      color as keyof typeof COLOR_MAP
    ] ?? COLOR_MAP.blue;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        categoryColor.soft,
        categoryColor.fg,
        categoryColor.border,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          categoryColor.bg,
        )}
      />

      {name}
    </Badge>
  );
}