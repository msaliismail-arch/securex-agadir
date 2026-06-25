"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  UserCog,
  Save,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  ADMIN_ROLES,
  COLOR_MAP,
  type AdminRole,
  type CategoryColor,
} from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  phone: string | null;
  active: boolean;
  createdAt: string;
};

const ROLE_BADGE: Record<AdminRole, { color: CategoryColor; icon: React.ComponentType<{ className?: string }> }> = {
  SUPER: { color: "green", icon: ShieldCheck },
  VALIDATION: { color: "blue", icon: Shield },
  RECEPTION: { color: "orange", icon: ShieldAlert },
};

type Dialog = {
  open: boolean;
  mode: "create" | "edit";
  data: Partial<AdminUser> & { password?: string };
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [me, setMe] = useState<{ sub: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [dialog, setDialog] = useState<Dialog>({
    open: false,
    mode: "create",
    data: {},
  });
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, m] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/auth/me", { cache: "no-store" }).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setMe(m);
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
        name: "",
        email: "",
        role: "RECEPTION",
        phone: "",
        active: true,
        password: "",
      },
    });
    setShowPwd(false);
  }
  function openEdit(u: AdminUser) {
    setDialog({ open: true, mode: "edit", data: { ...u, password: "" } });
    setShowPwd(false);
  }

  async function save() {
    const d = dialog.data;
    if (!d.name || !d.email || !d.role) {
      toast.error("Nom, email et rôle sont requis");
      return;
    }
    if (dialog.mode === "create") {
      if (!d.password || d.password.length < 6) {
        toast.error("Mot de passe requis (6 caractères min.) à la création");
        return;
      }
    } else if (d.password && d.password.length < 6) {
      toast.error("Le nouveau mot de passe doit faire au moins 6 caractères");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        name: d.name,
        email: d.email.toLowerCase().trim(),
        role: d.role,
        phone: d.phone || null,
        active: d.active ?? true,
      };
      // In edit mode only send password if the user typed a new one.
      if (dialog.mode === "create" || (dialog.mode === "edit" && d.password)) {
        body.password = d.password;
      }
      const res = dialog.mode === "create"
        ? await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: d.id, ...body }),
          });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success(dialog.mode === "create" ? "Administrateur créé" : "Administrateur modifié");
      setDialog((p) => ({ ...p, open: false }));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: AdminUser, value: boolean) {
    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, active: value } : x))
    );
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, active: value }),
      });
      if (!res.ok) {
        toast.error("Échec de la mise à jour");
        await load();
        return;
      }
      toast.success(value ? "Compte activé" : "Compte désactivé");
    } catch {
      await load();
    }
  }

  async function remove(u: AdminUser) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.error || "Échec de la suppression");
        return;
      }
      toast.success("Administrateur supprimé");
      await load();
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Super admins first, then by name
      if (a.role === "SUPER" && b.role !== "SUPER") return -1;
      if (b.role === "SUPER" && a.role !== "SUPER") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [users]);

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
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Utilisateurs administrateur</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les comptes habilités à accéder aux espaces d'administration.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Ajouter un administrateur
        </Button>
      </div>

      <Card className="border-l-4 border-primary/60 shadow-card">
        <CardContent className="p-0">
          {sortedUsers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              <UserCog className="h-8 w-8 text-muted-foreground/50" />
              <p className="font-semibold text-foreground">Aucun utilisateur</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez votre premier compte administrateur.
              </p>
            </div>
          ) : (
            <div className="scroll-thin max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="text-[11px] uppercase">Administrateur</TableHead>
                    <TableHead className="text-[11px] uppercase">Email</TableHead>
                    <TableHead className="text-[11px] uppercase">Rôle</TableHead>
                    <TableHead className="text-[11px] uppercase">Téléphone</TableHead>
                    <TableHead className="text-center text-[11px] uppercase">Actif</TableHead>
                    <TableHead className="w-28 text-right text-[11px] uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((u) => {
                    const rb = ROLE_BADGE[u.role] ?? ROLE_BADGE.RECEPTION;
                    const rc = COLOR_MAP[rb.color];
                    const Icon = rb.icon;
                    const isMe = me?.sub === u.id;
                    return (
                      <TableRow key={u.id} className="text-[13px]">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className={cn("text-[11px] font-semibold", rc.soft, rc.fg)}>
                                {initials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">{u.name}</span>
                                {isMe && (
                                  <Badge variant="outline" className="text-[9px] text-primary">
                                    Vous
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                Depuis {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(rc.soft, rc.fg, "gap-1")}>
                            <Icon className="h-3 w-3" />
                            {ADMIN_ROLES[u.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.phone || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={u.active}
                            onCheckedChange={(v) => toggleActive(u, v)}
                            disabled={isMe}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(u)}
                              aria-label="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent"
                              onClick={() => setDeleteTarget(u)}
                              disabled={isMe}
                              aria-label="Supprimer"
                              title={isMe ? "Vous ne pouvez pas vous supprimer" : "Supprimer"}
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
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "create" ? "Nouvel administrateur" : "Modifier l'administrateur"}
            </DialogTitle>
            <DialogDescription>
              Définissez les accès de l'utilisateur et son rôle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom complet *</Label>
              <Input
                value={dialog.data.name ?? ""}
                onChange={(e) => setDialog((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                placeholder="Youssef El Amrani"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={dialog.data.email ?? ""}
                onChange={(e) => setDialog((p) => ({ ...p, data: { ...p.data, email: e.target.value } }))}
                placeholder="admin@securex-connect.ma"
              />
              <p className="text-[11px] text-muted-foreground">
                L'email déterminera le rôle de connexion sur la page d'authentification.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {dialog.mode === "create" ? "Mot de passe *" : "Nouveau mot de passe"}
              </Label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={dialog.data.password ?? ""}
                  onChange={(e) =>
                    setDialog((p) => ({ ...p, data: { ...p.data, password: e.target.value } }))
                  }
                  placeholder={dialog.mode === "create" ? "Securex@2026" : "Laisser vide pour conserver l'actuel"}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPwd ? "Masquer" : "Afficher"}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {dialog.mode === "create"
                  ? "Minimum 6 caractères. Sera chiffré (bcrypt) en base."
                  : "Renseignez uniquement pour réinitialiser le mot de passe."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rôle *</Label>
              <Select
                value={dialog.data.role ?? "RECEPTION"}
                onValueChange={(v) => setDialog((p) => ({ ...p, data: { ...p.data, role: v as AdminRole } }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ADMIN_ROLES) as AdminRole[]).map((r) => {
                    const rb = ROLE_BADGE[r];
                    const Icon = rb.icon;
                    return (
                      <SelectItem key={r} value={r}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {ADMIN_ROLES[r].label} · Niv. {ADMIN_ROLES[r].level}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={dialog.data.phone ?? ""}
                onChange={(e) => setDialog((p) => ({ ...p, data: { ...p.data, phone: e.target.value } }))}
                placeholder="+2126XXXXXXXX"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
              <div>
                <p className="text-[13px] font-medium text-foreground">Compte actif</p>
                <p className="text-[11px] text-muted-foreground">
                  Les comptes désactivés ne peuvent plus se connecter.
                </p>
              </div>
              <Switch
                checked={dialog.data.active ?? true}
                onCheckedChange={(v) =>
                  setDialog((p) => ({ ...p, data: { ...p.data, active: v } }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog((p) => ({ ...p, open: false }))}>
              Annuler
            </Button>
            <Button onClick={save} disabled={busy} className="bg-primary text-white hover:bg-primary/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer le compte de <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}).
              Cette action est irréversible. L'utilisateur ne pourra plus se connecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => deleteTarget && remove(deleteTarget)}
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
