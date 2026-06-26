"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Megaphone,
  Pin,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COLOR_MAP, type CategoryColor } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  visible: boolean;
  category: string;
  publishedAt: string;
};

const CAT_META: Record<string, { label: string; color: CategoryColor }> = {
  INFO: { label: "Info", color: "blue" },
  PROMO: { label: "Promo", color: "orange" },
  MAINTENANCE: { label: "Maintenance", color: "gray" },
  ALERT: { label: "Alerte", color: "red" },
};

type Dialog = {
  open: boolean;
  mode: "create" | "edit";
  data: Partial<Announcement>;
};

export default function AnnoncesPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<Dialog>({
    open: false,
    mode: "create",
    data: {},
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      data: {
        title: "",
        content: "",
        pinned: false,
        visible: true,
        category: "INFO",
      },
    });
  }
  function openEdit(a: Announcement) {
    setDialog({ open: true, mode: "edit", data: { ...a } });
  }

  async function save() {
    const d = dialog.data;
    if (!d.title || !d.content) {
      toast.error("Titre et contenu requis");
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: d.title,
        content: d.content,
        pinned: d.pinned ?? false,
        visible: d.visible ?? true,
        category: d.category || "INFO",
      };
      const res = dialog.mode === "create"
        ? await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/announcements/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success(dialog.mode === "create" ? "Annonce créée" : "Annonce modifiée");
      setDialog((p) => ({ ...p, open: false }));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleField(id: string, field: "pinned" | "visible", value: boolean) {
    // optimistic
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
    try {
      const current = items.find((a) => a.id === id);
      if (!current) return;
      const res = await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: current.title,
          content: current.content,
          pinned: field === "pinned" ? value : current.pinned,
          visible: field === "visible" ? value : current.visible,
          category: current.category,
        }),
      });
      if (!res.ok) {
        toast.error("Échec de la mise à jour");
        await load();
        return;
      }
      toast.success(value ? `${field === "pinned" ? "Épinglé" : "Affiché"}` : `${field === "pinned" ? "Désépinglé" : "Masqué"}`);
      if (field === "visible" && !value) {
        // Hidden ones no longer returned by the API; reload will remove it.
        toast.info("Annonce masquée — elle disparaît de la liste publique.");
        setTimeout(load, 600);
      }
    } catch {
      await load();
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Échec de la suppression");
        return;
      }
      toast.success("Annonce supprimée");
      await load();
    } finally {
      setBusy(false);
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Annonces</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les messages affichés sur le site public (bannière, promos, alertes).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button
            onClick={openCreate}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Nouvelle annonce
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-2.5 text-[12px] text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300">
        ℹ️ Seules les annonces <strong>visibles</strong> sont listées ici. Si vous masquez une annonce,
        elle disparaît de cette liste — mais reste en base et peut être ré-affichée via la base de données.
      </div>

      <Card className="border-l-4 border-orange-400 shadow-card">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground">Aucune annonce visible</p>
                <p className="text-sm text-muted-foreground">
                  Créez votre première annonce pour qu'elle apparaisse sur le site.
                </p>
              </div>
              <Button onClick={openCreate} className="bg-orange-500 text-white hover:bg-orange-600">
                <Plus className="h-4 w-4" />
                Créer une annonce
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50/40 dark:bg-orange-500/5">
                    <TableHead className="min-w-[260px] text-[11px] uppercase">Titre</TableHead>
                    <TableHead className="text-[11px] uppercase">Catégorie</TableHead>
                    <TableHead className="text-center text-[11px] uppercase">Épinglée</TableHead>
                    <TableHead className="text-center text-[11px] uppercase">Visible</TableHead>
                    <TableHead className="text-[11px] uppercase">Publiée le</TableHead>
                    <TableHead className="w-24 text-right text-[11px] uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((a) => {
                    const meta = CAT_META[a.category] ?? CAT_META.INFO;
                    const mc = COLOR_MAP[meta.color];
                    return (
                      <TableRow key={a.id} className="text-[13px]">
                        <TableCell>
                          <div className="flex items-start gap-2">
                            {a.pinned && (
                              <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                            )}
                            <div>
                              <div className="font-semibold text-foreground">{a.title}</div>
                              <div className="line-clamp-1 max-w-md text-[11px] text-muted-foreground">
                                {a.content}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(mc.soft, mc.fg, "hover:opacity-90")}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={a.pinned}
                            onCheckedChange={(v) => toggleField(a.id, "pinned", v)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={a.visible}
                            onCheckedChange={(v) => toggleField(a.id, "visible", v)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                          {formatDateTime(a.publishedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(a)}
                              aria-label="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteId(a.id)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Create / edit dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "create" ? "Nouvelle annonce" : "Modifier l'annonce"}
            </DialogTitle>
            <DialogDescription>
              Les annonces apparaissent sur la page d'accueil du site public.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Titre *</Label>
              <Input
                value={dialog.data.title ?? ""}
                onChange={(e) =>
                  setDialog((p) => ({ ...p, data: { ...p.data, title: e.target.value } }))
                }
                placeholder="Promo Contre-visite -50%"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contenu *</Label>
              <Textarea
                rows={4}
                value={dialog.data.content ?? ""}
                onChange={(e) =>
                  setDialog((p) => ({ ...p, data: { ...p.data, content: e.target.value } }))
                }
                placeholder="Détails de l'annonce…"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Catégorie</Label>
              <Select
                value={dialog.data.category ?? "INFO"}
                onValueChange={(v) => setDialog((p) => ({ ...p, data: { ...p.data, category: v } }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAT_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Épinglée</p>
                    <p className="text-[11px] text-muted-foreground">Affichage prioritaire</p>
                  </div>
                </div>
                <Switch
                  checked={dialog.data.pinned ?? false}
                  onCheckedChange={(v) =>
                    setDialog((p) => ({ ...p, data: { ...p.data, pinned: v } }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  {dialog.data.visible ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Visible</p>
                    <p className="text-[11px] text-muted-foreground">Affichée publiquement</p>
                  </div>
                </div>
                <Switch
                  checked={dialog.data.visible ?? true}
                  onCheckedChange={(v) =>
                    setDialog((p) => ({ ...p, data: { ...p.data, visible: v } }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((p) => ({ ...p, open: false }))}>
              Annuler
            </Button>
            <Button
              onClick={save}
              disabled={busy}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'annonce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'annonce sera retirée immédiatement du site public.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => deleteId && remove(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
