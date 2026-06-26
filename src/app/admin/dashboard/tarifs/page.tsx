"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, RefreshCw, Save, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  color: string;
};

type Service = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  durationMin: number;
  price: number;
  active: boolean;
  category?: Category;
};

type EditState = {
  // serviceId -> { price, duration, dirty }
  [id: string]: { price: number; duration: number; dirty: boolean };
};

export default function TarifsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<EditState>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, svcs] = await Promise.all([
        fetch("/api/categories").then((r) => r.json()),
        fetch("/api/services").then((r) => r.json()),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setServices(Array.isArray(svcs) ? svcs : []);
      // Reset edits with current values
      const init: EditState = {};
      for (const s of svcs as Service[]) {
        init[s.id] = { price: s.price, duration: s.durationMin, dirty: false };
      }
      setEdits(init);
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

  const dirtyCount = Object.values(edits).filter((e) => e.dirty).length;

  function updateField(id: string, field: "price" | "duration", value: number) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value, dirty: true },
    }));
  }

  async function saveOne(id: string) {
    const e = edits[id];
    if (!e) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: e.price, durationMin: e.duration }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'enregistrement");
        return;
      }
      toast.success("Tarif mis à jour");
      setEdits((prev) => ({ ...prev, [id]: { ...e, dirty: false } }));
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, price: e.price, durationMin: e.duration } : s
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  async function saveAll() {
    const ids = Object.entries(edits)
      .filter(([, e]) => e.dirty)
      .map(([id]) => id);
    if (ids.length === 0) {
      toast.info("Aucune modification à enregistrer");
      return;
    }
    setSavingId("__all__");
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/services/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              price: edits[id].price,
              durationMin: edits[id].duration,
            }),
          }).then((r) => ({ id, ok: r.ok }))
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(`${failed} service(s) en échec`);
      } else {
        toast.success(`${ids.length} tarif(s) mis à jour`);
      }
      await load();
    } finally {
      setSavingId(null);
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
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Tarifs & Durées</h2>
          <p className="text-sm text-muted-foreground">
            Modifiez en ligne le prix et la durée de chaque prestation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button
            onClick={saveAll}
            disabled={dirtyCount === 0 || savingId === "__all__"}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {savingId === "__all__" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Tout enregistrer{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card className="border-border/60 shadow-card">
          <CardContent className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <Tag className="h-8 w-8 text-muted-foreground/50" />
            <p className="font-semibold text-foreground">Aucune catégorie</p>
            <p className="text-sm text-muted-foreground">
              Créez d'abord des catégories dans l'onglet dédié.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {categories.map((cat) => {
            const c = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.emerald;
            const svcs = servicesByCat.get(cat.id) ?? [];
            return (
              <Card key={cat.id} className={cn("border-l-4 shadow-card", c.border)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", c.bg)} />
                    <CardTitle className="text-[15px] font-semibold text-foreground">
                      {cat.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {svcs.length} service{svcs.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {svcs.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border bg-card px-4 py-6 text-center text-[12px] text-muted-foreground">
                      Aucun service pour cette catégorie.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="min-w-[200px] text-[11px] uppercase">Service</TableHead>
                            <TableHead className="w-32 text-[11px] uppercase">Durée (min)</TableHead>
                            <TableHead className="w-36 text-[11px] uppercase">Prix (MAD)</TableHead>
                            <TableHead className="w-24 text-right text-[11px] uppercase">Statut</TableHead>
                            <TableHead className="w-24 text-right text-[11px] uppercase">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {svcs.map((s) => {
                            const e = edits[s.id];
                            const dirty = e?.dirty;
                            return (
                              <TableRow key={s.id} className="text-[13px]">
                                <TableCell>
                                  <div className="font-medium text-foreground">{s.name}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {s.slug}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={e?.duration ?? s.durationMin}
                                    onChange={(ev) =>
                                      updateField(s.id, "duration", Number(ev.target.value))
                                    }
                                    className="h-9 w-24 font-mono text-[13px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={e?.price ?? s.price}
                                      onChange={(ev) =>
                                        updateField(s.id, "price", Number(ev.target.value))
                                      }
                                      className={cn(
                                        "h-9 w-32 pr-10 font-mono text-[13px]",
                                        dirty && "border-primary/60 ring-1 ring-primary/25"
                                      )}
                                    />
                                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                                      MAD
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {s.active ? (
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Actif</Badge>
                                  ) : (
                                    <Badge variant="secondary">Inactif</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant={dirty ? "default" : "ghost"}
                                    disabled={!dirty || savingId === s.id}
                                    onClick={() => saveOne(s.id)}
                                    className={cn(
                                      dirty
                                        ? "bg-primary text-white hover:bg-primary/90"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {savingId === s.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : dirty ? (
                                      <Save className="h-3.5 w-3.5" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
