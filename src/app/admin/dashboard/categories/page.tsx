"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  FolderTree,
  Save,
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
import { Switch } from "@/components/ui/switch";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort: number;
};

type Service = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  durationMin: number;
  price: number;
  active: boolean;
  category?: Category;
};

const ICON_CHOICES = [
  "Car", "Truck", "Bike", "Bus", "Wrench", "Gauge", "Cog", "Settings",
  "ShieldCheck", "ClipboardCheck", "Container", "Caravan", "Tractor",
];
const COLOR_KEYS = Object.keys(COLOR_MAP) as CategoryColor[];

function getIcon(name: string) {
  return (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? LucideIcons.Folder;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type CatDialog = {
  open: boolean;
  mode: "create" | "edit";
  data: Partial<Category>;
};
type SvcDialog = {
  open: boolean;
  categoryId: string | null;
  mode: "create" | "edit";
  data: Partial<Service>;
};
type DeleteTarget =
  | { kind: "category"; id: string; name: string }
  | { kind: "service"; id: string; name: string }
  | null;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  const [catDialog, setCatDialog] = useState<CatDialog>({
    open: false,
    mode: "create",
    data: {},
  });
  const [svcDialog, setSvcDialog] = useState<SvcDialog>({
    open: false,
    categoryId: null,
    mode: "create",
    data: {},
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, svcs] = await Promise.all([
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/services").then((r) => r.json()),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setServices(Array.isArray(svcs) ? svcs : []);
    } finally {
      setLoading(false);
    }
  }, []);

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

  function toggleCat(id: string) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateCat() {
    setCatDialog({
      open: true,
      mode: "create",
      data: {
        name: "",
        slug: "",
        description: "",
        icon: "Car",
        color: "blue",
        sort: categories.length + 1,
      },
    });
  }
  function openEditCat(c: Category) {
    setCatDialog({ open: true, mode: "edit", data: { ...c } });
  }
  async function saveCat() {
    const d = catDialog.data;
    if (!d.name || !d.slug || !d.color) {
      toast.error("Nom, slug et couleur sont requis");
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: d.name,
        slug: d.slug,
        description: d.description || "",
        icon: d.icon || "Car",
        color: d.color,
        sort: Number(d.sort ?? 0),
      };
      const res = catDialog.mode === "create"
        ? await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/categories/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success(catDialog.mode === "create" ? "Catégorie créée" : "Catégorie modifiée");
      setCatDialog((p) => ({ ...p, open: false }));
      await load();
    } finally {
      setBusy(false);
    }
  }
  async function deleteCat(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Échec de la suppression");
        return;
      }
      toast.success("Catégorie supprimée");
      await load();
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  function openCreateSvc(categoryId: string) {
    setSvcDialog({
      open: true,
      categoryId,
      mode: "create",
      data: {
        name: "",
        slug: "",
        description: "",
        durationMin: 30,
        price: 0,
        active: true,
      },
    });
    setOpenCats((prev) => new Set(prev).add(categoryId));
  }
  function openEditSvc(s: Service) {
    setSvcDialog({
      open: true,
      categoryId: s.categoryId,
      mode: "edit",
      data: { ...s },
    });
  }
  async function saveSvc() {
    const d = svcDialog.data;
    if (!d.name || !d.slug || !svcDialog.categoryId || d.price == null) {
      toast.error("Nom, slug et prix sont requis");
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: d.name,
        slug: d.slug,
        description: d.description || "",
        durationMin: Number(d.durationMin ?? 30),
        price: Number(d.price ?? 0),
        categoryId: svcDialog.categoryId,
        active: d.active ?? true,
      };
      const res = svcDialog.mode === "create"
        ? await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/services/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success(svcDialog.mode === "create" ? "Service créé" : "Service modifié");
      setSvcDialog((p) => ({ ...p, open: false }));
      await load();
    } finally {
      setBusy(false);
    }
  }
  async function deleteSvc(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Échec de la suppression");
        return;
      }
      toast.success("Service supprimé");
      await load();
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Catégories & Services</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les types de véhicules, les prestations associées et leur tarification.
          </p>
        </div>
        <Button onClick={openCreateCat} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="border-border/60 shadow-card">
          <CardContent className="flex h-48 flex-col items-center justify-center gap-3 text-center">
            <FolderTree className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="font-semibold text-foreground">Aucune catégorie</p>
              <p className="text-sm text-muted-foreground">
                Commencez par créer une catégorie de véhicule.
              </p>
            </div>
            <Button onClick={openCreateCat} className="bg-primary text-white hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Créer la première catégorie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const c = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.blue;
            const Icon = getIcon(cat.icon);
            const svcs = servicesByCat.get(cat.id) ?? [];
            const isOpen = openCats.has(cat.id);
            return (
              <Card key={cat.id} className={cn("overflow-hidden border-l-4 shadow-card", c.border)}>
                <Collapsible open={isOpen} onOpenChange={() => toggleCat(cat.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40">
                      <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-md", c.soft, c.fg)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[15px] font-semibold text-foreground">
                            {cat.name}
                          </h3>
                          <Badge variant="outline" className={cn("text-[10px]", c.fg, c.border)}>
                            {cat.slug}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {svcs.length} service{svcs.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        {cat.description && (
                          <p className="truncate text-[12px] text-muted-foreground">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditCat(cat)}
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            setDeleteTarget({ kind: "category", id: cat.id, name: cat.name })
                          }
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="ml-1 shrink-0 text-muted-foreground">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/20 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Services de la catégorie
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreateSvc(cat.id)}
                          className="border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter un service
                        </Button>
                      </div>
                      {svcs.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border bg-card px-4 py-6 text-center text-[12px] text-muted-foreground">
                          Aucun service pour cette catégorie.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-md border border-border bg-card">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/40">
                                <TableHead className="text-[11px] uppercase">Service</TableHead>
                                <TableHead className="text-[11px] uppercase">Durée</TableHead>
                                <TableHead className="text-[11px] uppercase">Prix</TableHead>
                                <TableHead className="text-[11px] uppercase">Statut</TableHead>
                                <TableHead className="w-20 text-right text-[11px] uppercase">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {svcs.map((s) => (
                                <TableRow key={s.id} className="text-[13px]">
                                  <TableCell>
                                    <div className="font-medium text-foreground">{s.name}</div>
                                    {s.description && (
                                      <div className="text-[11px] text-muted-foreground">
                                        {s.description}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap text-muted-foreground">
                                    {s.durationMin} min
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap font-semibold text-foreground">
                                    {s.price.toLocaleString("fr-MA")} MAD
                                  </TableCell>
                                  <TableCell>
                                    {s.active ? (
                                      <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Actif</Badge>
                                    ) : (
                                      <Badge variant="secondary">Inactif</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => openEditSvc(s)}
                                        aria-label="Modifier service"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() =>
                                          setDeleteTarget({ kind: "service", id: s.id, name: s.name })
                                        }
                                        aria-label="Supprimer service"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={catDialog.open}
        onOpenChange={(o) => setCatDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {catDialog.mode === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}
            </DialogTitle>
            <DialogDescription>
              Définissez le type de véhicule, son icône et sa couleur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input
                  value={catDialog.data.name ?? ""}
                  onChange={(e) =>
                    setCatDialog((p) => ({
                      ...p,
                      data: { ...p.data, name: e.target.value, slug: p.mode === "create" ? slugify(e.target.value) : p.data.slug },
                    }))
                  }
                  placeholder="Voiture Particulière"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Slug *</Label>
                <Input
                  value={catDialog.data.slug ?? ""}
                  onChange={(e) =>
                    setCatDialog((p) => ({ ...p, data: { ...p.data, slug: slugify(e.target.value) } }))
                  }
                  placeholder="voiture"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={catDialog.data.description ?? ""}
                onChange={(e) =>
                  setCatDialog((p) => ({ ...p, data: { ...p.data, description: e.target.value } }))
                }
                placeholder="Contrôle technique pour véhicules particuliers…"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Icône</Label>
                <Select
                  value={catDialog.data.icon ?? "Car"}
                  onValueChange={(v) => setCatDialog((p) => ({ ...p, data: { ...p.data, icon: v } }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_CHOICES.map((ic) => {
                      const Ic = getIcon(ic);
                      return (
                        <SelectItem key={ic} value={ic}>
                          <span className="inline-flex items-center gap-2">
                            <Ic className="h-4 w-4" />
                            {ic}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Couleur</Label>
                <Select
                  value={catDialog.data.color ?? "blue"}
                  onValueChange={(v) => setCatDialog((p) => ({ ...p, data: { ...p.data, color: v } }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ background: COLOR_MAP[k].hex }}
                          />
                          {COLOR_MAP[k].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ordre</Label>
                <Input
                  type="number"
                  value={catDialog.data.sort ?? 0}
                  onChange={(e) =>
                    setCatDialog((p) => ({ ...p, data: { ...p.data, sort: Number(e.target.value) } }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog((p) => ({ ...p, open: false }))}>
              Annuler
            </Button>
            <Button onClick={saveCat} disabled={busy} className="bg-primary text-white hover:bg-primary/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={svcDialog.open}
        onOpenChange={(o) => setSvcDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {svcDialog.mode === "create" ? "Nouveau service" : "Modifier le service"}
            </DialogTitle>
            <DialogDescription>
              Une prestation proposée aux clients pour cette catégorie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input
                  value={svcDialog.data.name ?? ""}
                  onChange={(e) =>
                    setSvcDialog((p) => ({
                      ...p,
                      data: { ...p.data, name: e.target.value, slug: p.mode === "create" ? slugify(e.target.value) : p.data.slug },
                    }))
                  }
                  placeholder="Visite Technique Périodique"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Slug *</Label>
                <Input
                  value={svcDialog.data.slug ?? ""}
                  onChange={(e) =>
                    setSvcDialog((p) => ({ ...p, data: { ...p.data, slug: slugify(e.target.value) } }))
                  }
                  placeholder="vt-periodique"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={svcDialog.data.description ?? ""}
                onChange={(e) =>
                  setSvcDialog((p) => ({ ...p, data: { ...p.data, description: e.target.value } }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Durée (min)</Label>
                <Input
                  type="number"
                  value={svcDialog.data.durationMin ?? 30}
                  onChange={(e) =>
                    setSvcDialog((p) => ({ ...p, data: { ...p.data, durationMin: Number(e.target.value) } }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prix (MAD)</Label>
                <Input
                  type="number"
                  value={svcDialog.data.price ?? 0}
                  onChange={(e) =>
                    setSvcDialog((p) => ({ ...p, data: { ...p.data, price: Number(e.target.value) } }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
              <div>
                <p className="text-[13px] font-medium text-foreground">Service actif</p>
                <p className="text-[11px] text-muted-foreground">
                  Les services inactifs ne sont pas proposés à la réservation.
                </p>
              </div>
              <Switch
                checked={svcDialog.data.active ?? true}
                onCheckedChange={(v) =>
                  setSvcDialog((p) => ({ ...p, data: { ...p.data, active: v } }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSvcDialog((p) => ({ ...p, open: false }))}>
              Annuler
            </Button>
            <Button onClick={saveSvc} disabled={busy} className="bg-primary text-white hover:bg-primary/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === "category" ? (
                <>
                  Vous allez supprimer la catégorie <strong>{deleteTarget?.name}</strong> ainsi que
                  tous ses services associés. Cette action est irréversible.
                </>
              ) : (
                <>
                  Vous allez supprimer le service <strong>{deleteTarget?.name}</strong>. Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.kind === "category") deleteCat(deleteTarget.id);
                else deleteSvc(deleteTarget.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
