"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ScrollText,
  Search,
  Filter,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

type AuditLog = {
  id: string;
  adminId: string | null;
  adminName: string;
  adminRole: string;
  action: string;
  target: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};

const ROLE_BADGE: Record<string, { label: string; color: CategoryColor }> = {
  SUPER: { label: "Super Admin", color: "green" },
  RDV: { label: "RDV Admin", color: "blue" },
  RECEPTION: { label: "Agent Réception", color: "orange" },
  SYSTEM: { label: "Système", color: "gray" },
  CLIENT: { label: "Client", color: "gray" },
};

function actionCategory(action: string): CategoryColor {
  const a = action.toUpperCase();
  if (a.includes("DELETE")) return "red";
  if (a.includes("CREATE")) return "green";
  if (a.includes("UPDATE") || a.includes("APPOINTMENT_")) return "blue";
  if (a.includes("LOGIN") || a.includes("LOGOUT")) return "purple";
  if (a.includes("CHECKIN")) return "cyan";
  if (a.includes("FAIL")) return "red";
  return "gray";
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit?limit=500", { cache: "no-store" });
      if (!res.ok) {
        setLogs([]);
        return;
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Build unique action list for filter
  const actionOptions = useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) s.add(l.action);
    return Array.from(s).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    let r = logs;
    if (roleFilter !== "all") r = r.filter((l) => l.adminRole === roleFilter);
    if (actionFilter !== "all") r = r.filter((l) => l.action === actionFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(
        (l) =>
          l.adminName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.details?.toLowerCase().includes(q) ?? false) ||
          (l.target?.toLowerCase().includes(q) ?? false)
      );
    }
    return r;
  }, [logs, roleFilter, actionFilter, search]);

  function resetFilters() {
    setRoleFilter("all");
    setActionFilter("all");
    setSearch("");
  }

  const hasFilters = roleFilter !== "all" || actionFilter !== "all" || search.trim();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Journal d'audit</h2>
          <p className="text-sm text-muted-foreground">
            Traçabilité immuable de toutes les actions administrateur. Lecture seule.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-border text-muted-foreground">
          <ScrollText className="mr-1 h-3 w-3" />
          {logs.length} entrée{logs.length > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      <Card className="border-l-4 border-border shadow-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Rôle
              </Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {Object.entries(ROLE_BADGE).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Action
              </Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  {actionOptions.map((a) => (
                    <SelectItem key={a} value={a} className="font-mono text-[12px]">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Recherche
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Admin, action, détails…"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">
                <Filter className="mr-1 inline h-3 w-3" />
                {filtered.length} entrée{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Réinitialiser
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              <ScrollText className="h-8 w-8 text-muted-foreground/50" />
              <p className="font-semibold text-foreground">Aucune entrée</p>
              <p className="text-sm text-muted-foreground">
                {hasFilters
                  ? "Aucune entrée ne correspond aux filtres."
                  : "Le journal est vide."}
              </p>
            </div>
          ) : (
            <div className="scroll-thin max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase">Horodatage</TableHead>
                    <TableHead className="text-[11px] uppercase">Administrateur</TableHead>
                    <TableHead className="text-[11px] uppercase">Rôle</TableHead>
                    <TableHead className="text-[11px] uppercase">Action</TableHead>
                    <TableHead className="text-[11px] uppercase">Détails</TableHead>
                    <TableHead className="text-[11px] uppercase">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const rb = ROLE_BADGE[l.adminRole] ?? ROLE_BADGE.SYSTEM;
                    const rc = COLOR_MAP[rb.color];
                    const ac = COLOR_MAP[actionCategory(l.action)];
                    return (
                      <TableRow key={l.id} className="text-[12px]">
                        <TableCell className="whitespace-nowrap">
                          <div className="text-foreground">{formatDateTime(l.createdAt)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {timeAgo(l.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {l.adminName}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(rc.soft, rc.fg, "text-[10px]")}>
                            {rb.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                              ac.soft,
                              ac.fg
                            )}
                          >
                            {l.action}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <span className="text-muted-foreground">
                            {l.details || "—"}
                          </span>
                          {l.target && (
                            <span className="ml-1 font-mono text-[10px] text-muted-foreground/70">
                              · {l.target.slice(0, 12)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {l.ipAddress || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
