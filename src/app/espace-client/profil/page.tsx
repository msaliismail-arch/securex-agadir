"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

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

/* -------------------------------------------------------------------------- */
/*                                  Schema                                    */
/* -------------------------------------------------------------------------- */

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nom trop court")
    .max(80, "Nom trop long"),

  email: z
    .string()
    .email("Adresse e-mail invalide")
    .optional()
    .or(z.literal("")),

  channel: z.enum([
    "SMS",
    "EMAIL",
    "WHATSAPP",
  ]),
});

type ProfileValues =
  z.infer<typeof profileSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Options                                   */
/* -------------------------------------------------------------------------- */

const channelOptions = [
  {
    value: "SMS",
    label: "SMS",
    icon: MessageSquare,
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    icon: Smartphone,
  },
  {
    value: "EMAIL",
    label: "E-mail",
    icon: Mail,
  },
] as const;

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

async function readJsonSafely<T>(
  response: Response,
): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function ProfilPage() {
  const router = useRouter();

  const { signOut } = useClerk();

  const {
    data,
    loading,
    error,
    unauthorized,
    refresh,
  } = useClientData();

  const [saving, setSaving] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  /* ------------------------------------------------------------------------ */
  /*                            Unauthorized client                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (unauthorized) {
      router.replace(
        "/espace-client",
      );
    }
  }, [
    unauthorized,
    router,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                                   Form                                   */
  /* ------------------------------------------------------------------------ */

  const form =
    useForm<ProfileValues>({
      resolver:
        zodResolver(
          profileSchema,
        ),

      defaultValues: {
        name: "",
        email: "",
        channel: "SMS",
      },

      mode: "onTouched",
    });

  /* ------------------------------------------------------------------------ */
  /*                           Hydrate client data                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!data) {
      return;
    }

    form.reset({
      name: data.name,

      email:
        data.email ??
        "",

      channel:
        data.channel,
    });
  }, [
    data,
    form,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                              Save profile                                */
  /* ------------------------------------------------------------------------ */

  const onSubmit =
    form.handleSubmit(
      async (values) => {
        setSaving(true);

        try {
          const response =
            await fetch(
              "/api/clients/me",
              {
                method: "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  name:
                    values.name.trim(),

                  channel:
                    values.channel,
                }),
              },
            );

          const body =
            await readJsonSafely<{
              error?: string;
            }>(response);

          if (!response.ok) {
            throw new Error(
              body?.error ||
                `Erreur lors de l'enregistrement (${response.status}).`,
            );
          }

          toast.success(
            "Profil mis à jour avec succès.",
          );

          await refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erreur lors de l'enregistrement.",
          );
        } finally {
          setSaving(false);
        }
      },
    );

  /* ------------------------------------------------------------------------ */
  /*                                Clerk logout                              */
  /* ------------------------------------------------------------------------ */

  async function logout() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      /*
       * IMPORTANT:
       * Le client utilise Clerk.
       *
       * On ne touche PAS au cookie JWT admin.
       */
      await signOut({
        redirectUrl: "/",
      });
    } catch (error) {
      console.error(
        "[CLIENT_LOGOUT]",
        error,
      );

      toast.error(
        "Impossible de vous déconnecter.",
      );

      setSigningOut(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                Loading                                   */
  /* ------------------------------------------------------------------------ */

  if (
    loading ||
    unauthorized
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                  Error                                   */
  /* ------------------------------------------------------------------------ */

  if (
    error ||
    !data
  ) {
    return (
      <Card className="glass-card">
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {error ||
              "Impossible de charger votre profil."}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void refresh();
            }}
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                  View                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <Link
          href="/espace-client"
          className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" />

          Tableau de bord
        </Link>

        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Mon profil
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos informations personnelles et vos préférences de notification.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}

        <Card className="glass-card h-fit lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="h-8 w-8" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {data.name}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  Client depuis{" "}
                  {new Date(
                    data.createdAt,
                  ).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              {/* Phone */}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />

                <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                  {data.phone}
                </span>

                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] text-muted-foreground"
                >
                  Non modifiable
                </Badge>
              </div>

              {/* Email */}

              {data.email ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />

                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {data.email}
                  </span>

                  <Badge
                    variant="outline"
                    className="shrink-0 border-primary/30 text-[10px] text-primary"
                  >
                    Vérifié
                  </Badge>
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                void logout();
              }}
              disabled={
                signingOut
              }
            >
              {signingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}

              {signingOut
                ? "Déconnexion..."
                : "Déconnexion"}
            </Button>
          </CardContent>
        </Card>

        {/* Edit form */}

        <Card className="glass-card lg:col-span-2">
          <CardContent className="p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-4 w-1 rounded bg-brand-gradient" />

              Informations personnelles
            </h2>

            <Form {...form}>
              <form
                onSubmit={
                  onSubmit
                }
                className="space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Name */}

                  <FormField
                    control={
                      form.control
                    }
                    name="name"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <FormLabel>
                          Nom complet *
                        </FormLabel>

                        <FormControl>
                          <Input
                            placeholder="Votre nom"
                            autoComplete="name"
                            disabled={
                              saving
                            }
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}

                  <FormField
                    control={
                      form.control
                    }
                    name="email"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <FormLabel>
                          E-mail vérifié
                        </FormLabel>

                        <FormControl>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                              type="email"
                              readOnly
                              className="bg-muted/30 pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>

                        <FormDescription>
                          Cette adresse provient de votre compte Clerk et n&apos;est pas modifiée depuis cette page.
                        </FormDescription>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notification channel */}

                <FormField
                  control={
                    form.control
                  }
                  name="channel"
                  render={({
                    field,
                  }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>
                        Canal de notification préféré
                      </FormLabel>

                      <FormDescription>
                        Ce canal sera utilisé pour les rappels et confirmations lorsque le service de notification correspondant est activé.
                      </FormDescription>

                      <FormControl>
                        <RadioGroup
                          onValueChange={
                            field.onChange
                          }
                          value={
                            field.value
                          }
                          disabled={
                            saving
                          }
                          className="grid gap-2 sm:grid-cols-3"
                        >
                          {channelOptions.map(
                            (
                              option,
                            ) => {
                              const Icon =
                                option.icon;

                              const active =
                                field.value ===
                                option.value;

                              return (
                                <label
                                  key={
                                    option.value
                                  }
                                  htmlFor={`prof-${option.value}`}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-2.5 rounded-lg border-2 p-3 transition-all",

                                    active
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/40",

                                    saving &&
                                      "cursor-not-allowed opacity-60",
                                  )}
                                >
                                  <RadioGroupItem
                                    id={`prof-${option.value}`}
                                    value={
                                      option.value
                                    }
                                  />

                                  <Icon
                                    className={cn(
                                      "h-4 w-4",

                                      active
                                        ? "text-primary"
                                        : "text-muted-foreground",
                                    )}
                                  />

                                  <span className="text-sm font-medium text-foreground">
                                    {
                                      option.label
                                    }
                                  </span>
                                </label>
                              );
                            },
                          )}
                        </RadioGroup>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      saving
                    }
                    onClick={() => {
                      form.reset({
                        name:
                          data.name,

                        email:
                          data.email ??
                          "",

                        channel:
                          data.channel,
                      });
                    }}
                  >
                    Annuler
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      !form.formState
                        .isDirty
                    }
                    className="bg-brand-gradient text-white hover:opacity-90"
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles */}

      <Card className="glass-card">
        <CardContent className="p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="h-4 w-1 rounded bg-brand-gradient" />

            Mes véhicules ({data.vehicles.length})
          </h2>

          {data.vehicles.length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun véhicule enregistré.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.vehicles.map(
                (
                  vehicle,
                ) => (
                  <div
                    key={
                      vehicle.id
                    }
                    className="rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <p className="font-mono text-sm font-semibold uppercase text-foreground">
                      {
                        vehicle.plate
                      }
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {
                        vehicle.brand
                      }{" "}
                      {
                        vehicle.model
                      }{" "}
                      ·{" "}
                      {
                        vehicle.year
                      }
                    </p>

                    {vehicle.fuel ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Carburant :{" "}
                        {
                          vehicle.fuel
                        }
                      </p>
                    ) : null}
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}