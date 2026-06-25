"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ChevronLeft,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useClientData } from "@/components/client/types";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z
    .string({ required_error: "Le nom est requis" })
    .min(3, "Nom trop court")
    .max(80, "Nom trop long"),
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .optional()
    .or(z.literal("")),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"], {
    required_error: "Choisissez un canal de notification",
  }),
});
type ProfileValues = z.infer<typeof profileSchema>;

const channelOptions = [
  { value: "SMS", label: "SMS", icon: MessageSquare },
  { value: "WHATSAPP", label: "WhatsApp", icon: Smartphone },
  { value: "EMAIL", label: "E-mail", icon: Mail },
] as const;

export default function ProfilPage() {
  const router = useRouter();
  const { data, loading, error, unauthorized, refresh } = useClientData();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unauthorized) router.replace("/espace-client");
  }, [unauthorized, router]);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", channel: "SMS" },
    mode: "onTouched",
  });

  // Hydrate form once data arrives
  React.useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        email: data.email ?? "",
        channel: data.channel,
      });
    }
  }, [data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      const res = await fetch("/api/clients/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email?.trim() || null,
          channel: values.channel,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Erreur lors de l'enregistrement");
      }
      toast.success("Profil mis à jour avec succès.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  });

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  if (loading || unauthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {error || "Impossible de charger votre profil."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/espace-client"
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Tableau de bord
        </a>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Mon profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos informations personnelles et vos préférences de notification.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="glass-card lg:col-span-1 h-fit">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{data.name}</p>
                <p className="truncate text-xs text-muted-foreground">Client depuis {new Date(data.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-mono text-foreground">{data.phone}</span>
                <Badge variant="outline" className="ml-auto text-[10px] text-muted-foreground">
                  Non modifiable
                </Badge>
              </div>
              {data.email ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-foreground">{data.email}</span>
                </div>
              ) : null}
            </div>
            <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="glass-card lg:col-span-2">
          <CardContent className="p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-4 w-1 rounded bg-brand-gradient" /> Informations personnelles
            </h2>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom" autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="vous@exemple.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Canal de notification préféré</FormLabel>
                      <FormDescription>
                        Nous utiliserons ce canal pour vous envoyer les rappels et confirmations.
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid gap-2 sm:grid-cols-3"
                        >
                          {channelOptions.map((opt) => {
                            const Icon = opt.icon;
                            const active = field.value === opt.value;
                            return (
                              <label
                                key={opt.value}
                                htmlFor={`prof-${opt.value}`}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2.5 rounded-lg border-2 p-3 transition-all",
                                  active
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40"
                                )}
                              >
                                <RadioGroupItem id={`prof-${opt.value}`} value={opt.value} />
                                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => data && form.reset({ name: data.name, email: data.email ?? "", channel: data.channel })}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-brand-gradient text-white hover:opacity-90">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles summary */}
      <Card className="glass-card">
        <CardContent className="p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="h-4 w-1 rounded bg-brand-gradient" /> Mes véhicules ({data.vehicles.length})
          </h2>
          {data.vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun véhicule enregistré.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.vehicles.map((v) => (
                <div key={v.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-mono text-sm font-semibold uppercase text-foreground">{v.plate}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {v.brand} {v.model} · {v.year}
                  </p>
                  {v.fuel ? <p className="mt-0.5 text-[11px] text-muted-foreground">Carburant : {v.fuel}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
