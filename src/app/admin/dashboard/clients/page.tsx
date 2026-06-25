"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Users,
  Eye,
  Phone,
  Mail,
  Car,
  MessageSquare,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COLOR_MAP, STATUS_META, type AppointmentStatus, type CategoryColor } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  fuel: string | null;
};

type Client = {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  channel: string;
  vehicles: Vehicle[];
  _count: { appointments: number };
  createdAt: string;
};

type Appointment = {
  id: string;
  code: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  vehiclePlate: string;
  clientPhone: string;
  service?: { name: string };
  category?: { name: string; color: string };
};

const CHANNEL_LABEL: Record<string, string> = {
  SMS: "SMS",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allAppts, setAllAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/appointments", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setClients(Array.isArray(c) ? c : []);
      setAllAppts(Array.isArray(a) ? a : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Server-side filter via q param when searching
  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.trim().toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    );
  }, [clients, search]);

  const detail = useMemo(
    () => clients.find((c) => c.id === detailId) ?? null,
    [clients, detailId]
  );

  const detailAppts = useMemo(() => {
    if (!detail) return [];
    return allAppts
      .filter((a) => a.clientPhone === detail.phone)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [detail, allAppts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Clients</h2>
          <p className="text-sm text-muted-foreground">
            Base de clients enregistrés, leurs véhicules et historique de RDV.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, téléphone, email…"
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Card className="border-l-4 border-blue-400/80 shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="font-semibold text-foreground">Aucun client</p>
              <p className="text-sm text-muted-foreground">
                {search ? "Aucun résultat pour cette recherche." : "Aucun client enregistré."}
              </p>
            </div>
          ) : (
            <div className="scroll-thin max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase">Nom</TableHead>
                    <TableHead className="text-[11px] uppercase">Téléphone</TableHead>
                    <TableHead className="text-[11px] uppercase">Email</TableHead>
                    <TableHead className="text-center text-[11px] uppercase">Véhicules</TableHead>
                    <TableHead className="text-center text-[11px] uppercase">RDV</TableHead>
                    <TableHead className="text-[11px] uppercase">Canal</TableHead>
                    <TableHead className="text-[11px] uppercase">Inscrit le</TableHead>
                    <TableHead className="w-20 text-right text-[11px] uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="text-[13px]">
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {c.vehicles.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                          {c._count.appointments}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {CHANNEL_LABEL[c.channel] ?? c.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setDetailId(c.id)}
                          aria-label="Voir détail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">{detail.name}</DialogTitle>
                <DialogDescription>
                  Fiche client · inscrit le {formatDate(detail.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Contact */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Téléphone
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {detail.phone}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      {detail.email || "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Canal préféré
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      {CHANNEL_LABEL[detail.channel] ?? detail.channel}
                    </p>
                  </div>
                </div>

                {/* Vehicles */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Véhicules ({detail.vehicles.length})
                  </p>
                  {detail.vehicles.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border bg-card p-4 text-center text-[12px] text-muted-foreground">
                      Aucun véhicule enregistré.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {detail.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-start gap-2 rounded-md border border-border bg-card p-3"
                        >
                          <Car className="mt-0.5 h-4 w-4 text-primary" />
                          <div className="min-w-0">
                            <p className="font-mono text-[13px] font-semibold text-foreground">
                              {v.plate}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {v.brand} {v.model} · {v.year} · {v.category}
                              {v.fuel ? ` · ${v.fuel}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Appointment history */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Historique des RDV ({detailAppts.length})
                  </p>
                  {detailAppts.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border bg-card p-4 text-center text-[12px] text-muted-foreground">
                      Aucun rendez-vous.
                    </p>
                  ) : (
                    <div className="scroll-thin max-h-72 space-y-1.5 overflow-y-auto">
                      {detailAppts.map((a) => {
                        const st = STATUS_META[a.status] ?? { label: a.status, color: "gray" as CategoryColor, icon: "Clock" };
                        const sc = COLOR_MAP[st.color] ?? COLOR_MAP.gray;
                        const catColor = COLOR_MAP[a.category?.color as CategoryColor] ?? COLOR_MAP.blue;
                        return (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5"
                          >
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", catColor.bg)} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[12px] font-semibold text-foreground">
                                  {a.code}
                                </span>
                                <Badge className={cn(sc.soft, sc.fg, "text-[10px]")}>
                                  {st.label}
                                </Badge>
                              </div>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {a.service?.name ?? "Service"} · {a.vehiclePlate}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[12px] font-medium text-foreground">
                                {formatDate(a.date)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{a.slot}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailId(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
