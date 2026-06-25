"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Loader2,
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Phone,
  Car,
  Save,
  X,
  Award,
  XCircle,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  COLOR_MAP,
  STATUS_META,
  DEFAULT_SLOTS,
  type AppointmentStatus,
  type CategoryColor,
} from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; color: string };
type Service = {
  id: string;
  categoryId: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};
type Inspection = {
  overallResult: string;
  brakes: string;
  lights: string;
  tires: string;
  emissions: string;
  bodywork: string;
  inspector: string | null;
  notes: string | null;
} | null;

type Appointment = {
  id: string;
  code: string;
  clientId: string;
  vehicleId: string | null;
  categoryId: string;
  serviceId: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  qrToken: string | null;
  queueNumber: number | null;
  notes: string | null;
  clientName: string;
  clientPhone: string;
  vehiclePlate: string;
  vehicleDesc: string;
  category?: Category;
  service?: Service;
  result?: Inspection;
};

type FormState = {
  id?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  categoryId: string;
  serviceId: string;
  date: string;
  slot: string;
  notes: string;
  channel: string;
};

const STATUS_KEYS: AppointmentStatus[] = [
  "PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED",
];

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // Detail dialog
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailAppt = useMemo(
    () => appts.find((a) => a.id === detailId) ?? null,
    [appts, detailId]
  );

  // Form dialog (create/edit)
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FormState>(emptyForm());

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function emptyForm(): FormState {
    return {
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      vehiclePlate: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      categoryId: "",
      serviceId: "",
      date: "",
      slot: "",
      notes: "",
      channel: "SMS",
    };
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter) params.set("date", new Date(dateFilter).toISOString());
      if (search.trim()) params.set("q", search.trim());
      const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ""}`;
      const [data, cats, svcs] = await Promise.all([
        fetch(url, { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/services").then((r) => r.json()),
      ]);
      setAppts(Array.isArray(data) ? data : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setServices(Array.isArray(svcs) ? svcs : []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const servicesByCat = useMemo(() => {
    const m = new Map<string, Service[]>();
    for (const s of services) {
      const arr = m.get(s.categoryId) ?? [];
      arr.push(s);
      m.set(s.categoryId, arr);
    }
    return m;
  }, [services]);

  function openCreate() {
    setFormMode("create");
    setForm(emptyForm());
    setFormOpen(true);
  }
  function openEdit(a: Appointment) {
    setFormMode("edit");
    setForm({
      id: a.id,
      clientName: a.clientName,
      clientPhone: a.clientPhone,
      clientEmail: "",
      vehiclePlate: a.vehiclePlate,
      vehicleBrand: a.vehicleDesc.split(" ")[0] ?? "",
      vehicleModel: a.vehicleDesc.split(" ").slice(1, -1).join(" ") || "",
      vehicleYear: a.vehicleDesc.match(/\((\d+)\)/)?.[1] ?? "",
      categoryId: a.categoryId,
      serviceId: a.serviceId,
      date: a.date.split("T")[0],
      slot: a.slot,
      notes: a.notes ?? "",
      channel: "SMS",
    });
    setFormOpen(true);
  }

  async function saveForm() {
    if (!form.clientName || !form.clientPhone || !form.vehiclePlate ||
        !form.categoryId || !form.serviceId || !form.date || !form.slot) {
      toast.error("Tous les champs requis doivent être renseignés");
      return;
    }
    setBusy(true);
    try {
      if (formMode === "create") {
        const body = {
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          clientEmail: form.clientEmail,
          vehiclePlate: form.vehiclePlate,
          vehicleBrand: form.vehicleBrand,
          vehicleModel: form.vehicleModel,
          vehicleYear: form.vehicleYear,
          vehicleCategory: "VOITURE",
          categoryId: form.categoryId,
          serviceId: form.serviceId,
          date: new Date(form.date).toISOString(),
          slot: form.slot,
          channel: form.channel,
        };
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error || "Échec de la création");
          return;
        }
        toast.success(`RDV créé · code ${json.code}`);
      } else {
        const body = {
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          vehiclePlate: form.vehiclePlate,
          vehicleDesc: `${form.vehicleBrand} ${form.vehicleModel} (${form.vehicleYear})`.trim(),
          categoryId: form.categoryId,
          serviceId: form.serviceId,
          date: new Date(form.date).toISOString(),
          slot: form.slot,
          notes: form.notes,
        };
        const res = await fetch(`/api/appointments/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error || "Échec de la modification");
          return;
        }
        toast.success("RDV modifié");
      }
      setFormOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(a: Appointment, status: AppointmentStatus) {
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec du changement de statut");
        return;
      }
      toast.success(`RDV ${a.code} → ${STATUS_META[status].label}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Échec de la suppression");
        return;
      }
      toast.success("RDV supprimé");
      await load();
    } finally {
      setBusy(false);
      setDeleteId(null);
    }
  }

  function resetFilters() {
    setStatusFilter("all");
    setDateFilter("");
    setSearch("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy sm:text-2xl">Rendez-vous</h2>
          <p className="text-sm text-muted-foreground">
            Gérez l'ensemble des RDV : créer, modifier, changer le statut, supprimer.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 text-white hover:bg-green-700">
          <Plus className="h-4 w-4" />
          Nouveau RDV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-l-4 border-green-500">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Statut
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUS_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_META[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Date
              </Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Recherche
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Code, nom, téléphone, plaque…"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          {(statusFilter !== "all" || dateFilter || search) && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">
                <Filter className="mr-1 inline h-3 w-3" />
                {appts.length} résultat{appts.length > 1 ? "s" : ""}
              </p>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : appts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-navy">Aucun rendez-vous</p>
                <p className="text-sm text-muted-foreground">
                  Aucun RDV ne correspond à vos filtres.
                </p>
              </div>
            </div>
          ) : (
            <div className="scroll-thin max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase">Code</TableHead>
                    <TableHead className="text-[11px] uppercase">Client</TableHead>
                    <TableHead className="text-[11px] uppercase">Véhicule</TableHead>
                    <TableHead className="text-[11px] uppercase">Service</TableHead>
                    <TableHead className="text-[11px] uppercase">Date / Heure</TableHead>
                    <TableHead className="text-[11px] uppercase">Statut</TableHead>
                    <TableHead className="w-28 text-right text-[11px] uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appts.map((a) => {
                    const st = STATUS_META[a.status];
                    const sc = COLOR_MAP[st.color];
                    const catColor = COLOR_MAP[a.category?.color as CategoryColor] ?? COLOR_MAP.green;
                    return (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer text-[13px] hover:bg-surface-2/30"
                        onClick={() => setDetailId(a.id)}
                      >
                        <TableCell>
                          <div className="font-mono font-semibold text-navy">{a.code}</div>
                          {a.queueNumber && (
                            <div className="text-[10px] text-muted-foreground">
                              #{a.queueNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-navy">{a.clientName}</div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="h-2.5 w-2.5" />
                            {a.clientPhone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-[12px] text-navy">
                              {a.vehiclePlate}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {a.vehicleDesc}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full", catColor.bg)} />
                            <span className="text-navy">{a.service?.name ?? "—"}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {a.category?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-navy">{formatDate(a.date)}</div>
                          <div className="text-[11px] text-muted-foreground">{a.slot}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(sc.soft, sc.fg, "hover:opacity-80")}>
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setDetailId(a.id)}
                              aria-label="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(a)}
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  aria-label="Changer statut"
                                  disabled={busy}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {STATUS_KEYS.map((k) => (
                                  <DropdownMenuItem
                                    key={k}
                                    onClick={() => changeStatus(a, k)}
                                    disabled={a.status === k}
                                  >
                                    {STATUS_META[k].label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteId(a.id)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Detail dialog */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detailAppt && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="font-mono text-navy">
                      RDV {detailAppt.code}
                    </DialogTitle>
                    <DialogDescription>
                      Détails du rendez-vous et résultat d'inspection
                    </DialogDescription>
                  </div>
                  <StatusBadge status={detailAppt.status} />
                </div>
              </DialogHeader>
              <div className="space-y-4">
                {/* Client + vehicle */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoBlock label="Client" value={detailAppt.clientName} sub={detailAppt.clientPhone} />
                  <InfoBlock label="Véhicule" value={detailAppt.vehiclePlate} sub={detailAppt.vehicleDesc} />
                  <InfoBlock
                    label="Catégorie"
                    value={detailAppt.category?.name ?? "—"}
                    sub={detailAppt.category?.slug}
                  />
                  <InfoBlock
                    label="Service"
                    value={detailAppt.service?.name ?? "—"}
                    sub={`${detailAppt.service?.price ?? 0} MAD · ${detailAppt.service?.durationMin ?? 0} min`}
                  />
                  <InfoBlock
                    label="Date & heure"
                    value={formatDate(detailAppt.date)}
                    sub={detailAppt.slot}
                  />
                  <InfoBlock
                    label="File d'attente"
                    value={detailAppt.queueNumber ? `#${detailAppt.queueNumber}` : "—"}
                    sub={detailAppt.qrToken ? "QR généré ✓" : "Pas de QR"}
                  />
                </div>

                {detailAppt.notes && (
                  <div className="rounded-md border border-border bg-surface-2/30 p-3">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 text-[13px] text-navy">{detailAppt.notes}</p>
                  </div>
                )}

                {/* Inspection result */}
                {detailAppt.result ? (
                  <InspectionBlock result={detailAppt.result} />
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-surface-2/20 p-4 text-center">
                    <p className="text-[12px] text-muted-foreground">
                      Aucun résultat d'inspection enregistré.
                    </p>
                  </div>
                )}

                {detailAppt.qrToken && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-semibold uppercase text-emerald-700">
                      Token QR de validation
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-emerald-800">
                      {detailAppt.qrToken}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailId(null)}>
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailId(null);
                    openEdit(detailAppt);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / edit form */}
      <Dialog open={formOpen} onOpenChange={(o) => setFormOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Nouveau rendez-vous" : "Modifier le RDV"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Créez un RDV manuellement pour un client."
                : "Modifiez les informations du rendez-vous."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom client *</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone *</Label>
                <Input
                  value={form.clientPhone}
                  onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))}
                  placeholder="+2126XXXXXXXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Plaque *</Label>
                <Input
                  value={form.vehiclePlate}
                  onChange={(e) => setForm((p) => ({ ...p, vehiclePlate: e.target.value.toUpperCase() }))}
                  placeholder="12345-A-6"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Marque</Label>
                <Input
                  value={form.vehicleBrand}
                  onChange={(e) => setForm((p) => ({ ...p, vehicleBrand: e.target.value }))}
                  placeholder="Renault"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modèle</Label>
                <Input
                  value={form.vehicleModel}
                  onChange={(e) => setForm((p) => ({ ...p, vehicleModel: e.target.value }))}
                  placeholder="Clio"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Année</Label>
                <Input
                  value={form.vehicleYear}
                  onChange={(e) => setForm((p) => ({ ...p, vehicleYear: e.target.value }))}
                  placeholder="2020"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Catégorie *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v, serviceId: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service *</Label>
                <Select
                  value={form.serviceId}
                  onValueChange={(v) => setForm((p) => ({ ...p, serviceId: v }))}
                  disabled={!form.categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(servicesByCat.get(form.categoryId) ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.price} MAD
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Créneau *</Label>
                <Select
                  value={form.slot}
                  onValueChange={(v) => setForm((p) => ({ ...p, slot: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SLOTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formMode === "edit" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={saveForm}
              disabled={busy}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {formMode === "create" ? "Créer le RDV" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le RDV sera définitivement supprimé de la base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => deleteId && remove(deleteId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const st = STATUS_META[status];
  const sc = COLOR_MAP[st.color];
  return (
    <Badge className={cn(sc.soft, sc.fg, "text-[12px]")}>
      {st.label}
    </Badge>
  );
}

function InfoBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[14px] font-semibold text-navy">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function InspectionBlock({ result }: { result: NonNullable<Inspection> }) {
  const pass = result.overallResult === "PASS";
  const items: { label: string; value: string }[] = [
    { label: "Freins", value: result.brakes },
    { label: "Éclairage", value: result.lights },
    { label: "Pneus", value: result.tires },
    { label: "Émissions", value: result.emissions },
    { label: "Carrosserie", value: result.bodywork },
  ];
  return (
    <div
      className={cn(
        "rounded-md border p-4",
        pass ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          Résultat d'inspection
        </p>
        <Badge
          className={cn(
            pass
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          )}
        >
          {pass ? <Award className="mr-1 h-3.5 w-3.5" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
          {pass ? "Conforme" : "Non conforme"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "rounded border px-2 py-1.5 text-center",
              it.value === "PASS"
                ? "border-green-200 bg-white"
                : "border-red-200 bg-white"
            )}
          >
            <p className="text-[10px] uppercase text-muted-foreground">{it.label}</p>
            <p
              className={cn(
                "text-[12px] font-bold",
                it.value === "PASS" ? "text-green-700" : "text-red-700"
              )}
            >
              {it.value === "PASS" ? "OK" : "KO"}
            </p>
          </div>
        ))}
      </div>
      {result.inspector && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Inspecteur : <span className="font-medium text-navy">{result.inspector}</span>
        </p>
      )}
      {result.notes && (
        <p className="mt-1 text-[12px] text-navy">{result.notes}</p>
      )}
    </div>
  );
}
