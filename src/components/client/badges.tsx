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
import { STATUS_META, type AppointmentStatus, COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Ban,
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const meta = STATUS_META[status];
  const color = COLOR_MAP[meta.color];
  const Icon = ICONS[meta.icon] ?? Clock;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-transparent font-medium text-white", color.bg, className)}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function CategoryBadge({ name, color }: { name: string; color: string }) {
  const c = COLOR_MAP[color as CategoryColor] ?? COLOR_MAP.blue;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", c.soft, c.fg, c.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.bg)} />
      {name}
    </Badge>
  );
}
