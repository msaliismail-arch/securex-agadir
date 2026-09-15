"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Plus, Power, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PromoCode = { id: string; code: string; description: string | null; active: boolean; maxUses: number | null; usageCount: number; expiresAt: string | null; createdAt: string };

export default function PromoCodesPage() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/promo-codes", { cache: "no-store" });
    setItems(response.ok ? await response.json() : []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create() {
    setBusy(true);
    try {
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, maxUses: maxUses ? Number(maxUses) : null, expiresAt: expiresAt || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Création impossible");
      toast.success(`Code ${data.code} créé`);
      setDescription(""); setMaxUses(""); setExpiresAt("");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function toggle(item: PromoCode) {
    const response = await fetch("/api/promo-codes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, active: !item.active }) });
    if (!response.ok) return toast.error("Mise à jour impossible");
    await load();
  }

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold sm:text-2xl">Codes d’exemption d’acompte</h2><p className="text-sm text-muted-foreground">Ces codes suppriment uniquement le paiement en ligne de 25 %. Le prix total reste dû à l’agence.</p></div>
      <Card className="border-l-4 border-primary/60 shadow-card"><CardContent className="grid gap-4 p-5 md:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex. client fidèle" /></div>
        <div className="space-y-1.5"><Label>Nombre d’utilisations</Label><Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Illimité" /></div>
        <div className="space-y-1.5"><Label>Expiration</Label><Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>
        <Button onClick={create} disabled={busy} className="bg-primary text-white md:col-span-4 md:w-fit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Générer un code</Button>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="flex h-44 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : items.length === 0 ? <div className="flex h-44 flex-col items-center justify-center text-muted-foreground"><TicketPercent className="mb-2 h-8 w-8" /><p>Aucun code généré.</p></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead>Utilisations</TableHead><TableHead>Expiration</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-mono font-bold">{item.code}</TableCell><TableCell>{item.description || "—"}</TableCell><TableCell>{item.usageCount} / {item.maxUses ?? "∞"}</TableCell><TableCell>{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("fr-FR") : "Jamais"}</TableCell><TableCell><Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Actif" : "Inactif"}</Badge></TableCell><TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(item.code).then(() => toast.success("Code copié"))}><Copy className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => toggle(item)}><Power className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}
      </CardContent></Card>
    </div>
  );
}
