"use client";

import * as React from "react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn, formatMAD, isValidMaPhone, isValidMaPlate } from "@/lib/utils";
import { COLOR_MAP, DEFAULT_SLOTS, type CategoryColor } from "@/lib/constants";
import { BookingSuccess, type BookingSuccessData } from "@/components/client/booking-success";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort: number;
  services?: ServiceItem[];
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

const STEPS = [
  { num: 1, label: "Véhicule", icon: "car" },
  { num: 2, label: "Service & Créneau", icon: "calendar" },
  { num: 3, label: "Informations", icon: "user" },
  { num: 4, label: "Confirmation", icon: "check" },
] as const;

const channelOptions = [
  { value: "SMS", label: "SMS", icon: MessageSquare, hint: "Recevoir les rappels par SMS" },
  { value: "WHATSAPP", label: "WhatsApp", icon: Smartphone, hint: "Notifications WhatsApp" },
  { value: "EMAIL", label: "E-mail", icon: Mail, hint: "E-mails de confirmation" },
] as const;

const formSchema = z.object({
  clientName: z
    .string({ required_error: "Le nom est requis" })
    .min(3, "Nom complet trop court (3 caractères min.)")
    .max(80, "Nom trop long"),
  clientPhone: z
    .string({ required_error: "Le téléphone est requis" })
    .refine(isValidMaPhone, "Numéro marocain invalide (ex: +212 6 12 34 56 78)"),
  clientEmail: z
    .string()
    .email("Adresse e-mail invalide")
    .optional()
    .or(z.literal("")),
  vehiclePlate: z
    .string({ required_error: "Immatriculation requise" })
    .refine(isValidMaPlate, "Plaque invalide (ex: 12345-A-6 ou 1-A-12345)"),
  vehicleBrand: z.string().min(2, "Marque requise"),
  vehicleModel: z.string().min(1, "Modèle requis"),
  vehicleYear: z
    .coerce.number({ invalid_type_error: "Année invalide" })
    .int("Année invalide")
    .min(1980, "Année trop ancienne")
    .max(new Date().getFullYear() + 1, "Année invalide"),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"], {
    required_error: "Choisissez un canal de notification",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RendezVousPage() {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <BookingWizard />
    </Suspense>
  );
}

function WizardSkeleton() {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-brand" />
    </div>
  );
}

function BookingWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [success, setSuccess] = useState<BookingSuccessData | null>(null);

  // Wizard state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-select category from ?category=<slug>
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch("/api/categories?withServices=1", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load categories");
        const data: CategoryItem[] = await res.json();
        if (!active) return;
        setCategories(data);
        const slug = searchParams.get("category");
        if (slug) {
          const found = data.find((c) => c.slug === slug);
          if (found) {
            setSelectedCat(found);
            setStep(2);
          }
        }
      } catch {
        if (active) toast.error("Impossible de charger les catégories. Réessayez.");
      } finally {
        if (active) setLoadingCats(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "+212 ",
      clientEmail: "",
      vehiclePlate: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: new Date().getFullYear(),
      channel: "SMS",
    },
    mode: "onTouched",
  });

  const canContinueStep1 = !!selectedCat;
  const canContinueStep2 = !!selectedService && !!selectedDate && !!selectedSlot;

  const submit = form.handleSubmit(async (values) => {
    if (!selectedCat || !selectedService || !selectedDate || !selectedSlot) {
      toast.error("Veuillez compléter toutes les étapes précédentes.");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        clientName: values.clientName.trim(),
        clientPhone: values.clientPhone.trim(),
        clientEmail: values.clientEmail?.trim() || null,
        vehiclePlate: values.vehiclePlate.trim().toUpperCase(),
        vehicleBrand: values.vehicleBrand.trim(),
        vehicleModel: values.vehicleModel.trim(),
        vehicleYear: Number(values.vehicleYear),
        vehicleCategory: selectedCat.slug.toUpperCase(),
        categoryId: selectedCat.id,
        serviceId: selectedService.id,
        date: selectedDate.toISOString(),
        slot: selectedSlot,
        channel: values.channel,
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de la réservation");
      }
      setSuccess({
        code: data.code,
        queueNumber: data.queueNumber ?? 1,
        date: data.date,
        slot: data.slot,
        categoryName: data.category?.name ?? selectedCat.name,
        categoryColor: (data.category?.color ?? selectedCat.color) as CategoryColor,
        serviceName: data.service?.name ?? selectedService.name,
        servicePrice: data.service?.price ?? selectedService.price,
        vehiclePlate: data.vehiclePlate ?? body.vehiclePlate,
        vehicleDesc: data.vehicleDesc ?? `${body.vehicleBrand} ${body.vehicleModel} (${body.vehicleYear})`,
        clientName: data.clientName ?? body.clientName,
        clientPhone: data.clientPhone ?? body.clientPhone,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la réservation");
    } finally {
      setSubmitting(false);
    }
  });

  if (success) {
    return <BookingSuccess data={success} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-brand">
          Réservation en ligne
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy md:text-4xl">
          Prendre rendez-vous
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
          Wizard en 4 étapes — choisissez votre véhicule, votre créneau, et confirmez. C&apos;est
          rapide et sécurisé.
        </p>
      </div>

      {/* Progress */}
      <ProgressIndicator current={step} onStepClick={(n) => n < step && setStep(n as 1 | 2 | 3 | 4)} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepWrapper key="step1">
            <Step1
              categories={categories}
              loading={loadingCats}
              selected={selectedCat}
              onSelect={(c) => {
                setSelectedCat(c);
                // reset downstream if category changes
                if (selectedService && !c.services?.some((s) => s.id === selectedService.id)) {
                  setSelectedService(null);
                  setSelectedSlot(null);
                }
              }}
            />
            <WizardNav
              onNext={() => setStep(2)}
              nextDisabled={!canContinueStep1}
              nextLabel="Continuer"
              hideBack
            />
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper key="step2">
            <Step2
              category={selectedCat!}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
            <WizardNav
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              nextDisabled={!canContinueStep2}
              nextLabel="Continuer"
            />
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper key="step3">
            <Step3 form={form} />
            <WizardNav
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              nextLabel="Vérifier la demande"
              nextDisabled={!form.formState.isValid}
            />
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper key="step4">
            <Step4
              cat={selectedCat!}
              service={selectedService!}
              date={selectedDate!}
              slot={selectedSlot!}
              values={form.getValues()}
              onEdit={() => setStep(3)}
            />
            <WizardNav
              onBack={() => setStep(3)}
              onNext={submit}
              nextDisabled={submitting}
              nextLabel={submitting ? "Réservation en cours…" : "Confirmer le rendez-vous"}
              nextLoading={submitting}
              highlightNext
            />
          </StepWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------- Progress indicator -------------------------- */
function ProgressIndicator({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick?: (n: number) => void;
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-1 md:gap-2">
      {STEPS.map((s, idx) => {
        const isDone = s.num < current;
        const isCurrent = s.num === current;
        const clickable = !!onStepClick && s.num < current;
        return (
          <React.Fragment key={s.num}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(s.num)}
              className={cn(
                "group flex flex-1 flex-col items-center gap-1.5 text-center",
                clickable && "cursor-pointer"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all md:h-10 md:w-10",
                  isDone && "border-emerald-brand bg-emerald-brand text-white",
                  isCurrent && "border-emerald-brand bg-emerald-brand/10 text-emerald-brand ring-4 ring-emerald-brand/10",
                  !isDone && !isCurrent && "border-border bg-background text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : s.num}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight md:text-xs",
                  isCurrent ? "text-emerald-brand" : isDone ? "text-navy" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-0.5 flex-1 rounded-full transition-colors md:mb-6",
                  s.num < current ? "bg-emerald-brand" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextLoading,
  hideBack,
  highlightNext,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  hideBack?: boolean;
  highlightNext?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
      {!hideBack ? (
        <Button type="button" variant="outline" onClick={onBack} size="lg" className="w-full sm:w-auto">
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Retour
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        size="lg"
        className={cn(
          "w-full sm:w-auto",
          highlightNext && "bg-emerald-brand hover:bg-emerald-brand/90"
        )}
      >
        {nextLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {nextLabel}
        {!nextLoading && <ChevronRight className="ml-1.5 h-4 w-4" />}
      </Button>
    </div>
  );
}

/* --------------------------------- Step 1 --------------------------------- */
function Step1({
  categories,
  loading,
  selected,
  onSelect,
}: {
  categories: CategoryItem[];
  loading: boolean;
  selected: CategoryItem | null;
  onSelect: (c: CategoryItem) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune catégorie disponible pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Étape 1"
        title="Type de véhicule"
        subtitle="Sélectionnez la catégorie qui correspond à votre véhicule."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const color = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.blue;
          const isSelected = selected?.id === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat)}
              className={cn(
                "group relative flex flex-col rounded-xl border-2 bg-card p-5 text-left transition-all hover:shadow-md",
                isSelected
                  ? cn(color.border, "shadow-md ring-2", color.ring)
                  : "border-border hover:border-muted-foreground/30"
              )}
              aria-pressed={isSelected}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg text-xl font-bold",
                    color.soft,
                    color.fg
                  )}
                >
                  {cat.name.charAt(0)}
                </span>
                {isSelected && (
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-white", color.bg)}>
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-navy">{cat.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cat.services?.slice(0, 3).map((s) => (
                  <Badge key={s.id} variant="outline" className={cn("font-normal", color.fg, color.border)}>
                    {s.name}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------- Step 2 --------------------------------- */
function Step2({
  category,
  selectedService,
  onSelectService,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}: {
  category: CategoryItem;
  selectedService: ServiceItem | null;
  onSelectService: (s: ServiceItem | null) => void;
  selectedDate: Date | undefined;
  onSelectDate: (d: Date | undefined) => void;
  selectedSlot: string | null;
  onSelectSlot: (s: string | null) => void;
}) {
  const services = category.services ?? [];
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Étape 2"
        title="Service & créneau"
        subtitle={`Pour ${category.name}. Choisissez un service puis une date et un horaire.`}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Services */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
            <span className="h-4 w-1 rounded bg-emerald-brand" /> Service souhaité
          </h3>
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun service actif pour cette catégorie.
              </CardContent>
            </Card>
          ) : (
            <RadioGroup
              value={selectedService?.id ?? ""}
              onValueChange={(v) => {
                const s = services.find((x) => x.id === v) ?? null;
                onSelectService(s);
              }}
              className="gap-3"
            >
              {services.map((s) => {
                const isSelected = selectedService?.id === s.id;
                return (
                  <label
                    key={s.id}
                    htmlFor={`svc-${s.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-card p-4 transition-all hover:border-emerald-brand/40",
                      isSelected ? "border-emerald-brand ring-2 ring-emerald-brand/10" : "border-border"
                    )}
                  >
                    <RadioGroupItem value={s.id} id={`svc-${s.id}`} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-navy">{s.name}</span>
                        <span className="text-sm font-bold text-emerald-brand">{formatMAD(s.price)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {s.durationMin} min
                      </div>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          )}
        </div>

        {/* Date + slots */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
            <span className="h-4 w-1 rounded bg-emerald-brand" /> Date
          </h3>
          <div className="flex justify-center rounded-xl border border-border bg-card p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onSelectDate}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d < today || date.getDay() === 0;
              }}
              fromDate={new Date()}
              locale={fr}
              className="mx-auto"
            />
          </div>

          <h3 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-navy">
            <span className="h-4 w-1 rounded bg-emerald-brand" /> Créneau horaire
          </h3>
          {!selectedDate ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Veuillez d&apos;abord sélectionner une date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {DEFAULT_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    className={cn(
                      "rounded-lg border-2 px-2 py-2.5 text-sm font-medium transition-all",
                      isSelected
                        ? "border-emerald-brand bg-emerald-brand text-white shadow-sm"
                        : "border-border bg-card text-navy hover:border-emerald-brand/40 hover:bg-accent"
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Step 3 --------------------------------- */
function Step3({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div>
      <SectionHeading
        eyebrow="Étape 3"
        title="Informations client & véhicule"
        subtitle="Renseignez vos coordonnées et celles de votre véhicule."
      />
      <Form {...form}>
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <Card>
            <CardContent className="space-y-4 p-5 md:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <User className="h-4 w-4 text-emerald-brand" /> Coordonnées
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mehdi Tazi" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone (+212) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="+212 6 12 34 56 78"
                            className="pl-9"
                            inputMode="tel"
                            autoComplete="tel"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Format marocain. Servira pour vos rappels.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>E-mail (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="vous@exemple.com"
                          autoComplete="email"
                          {...field}
                        />
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
                              htmlFor={`ch-${opt.value}`}
                              className={cn(
                                "flex cursor-pointer items-center gap-2.5 rounded-lg border-2 p-3 transition-all",
                                active
                                  ? "border-emerald-brand bg-emerald-brand/5"
                                  : "border-border hover:border-emerald-brand/40"
                              )}
                            >
                              <RadioGroupItem id={`ch-${opt.value}`} value={opt.value} />
                              <Icon className={cn("h-4 w-4", active ? "text-emerald-brand" : "text-muted-foreground")} />
                              <span className="text-sm font-medium text-navy">{opt.label}</span>
                            </label>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5 md:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <CalendarDays className="h-4 w-4 text-emerald-brand" /> Véhicule
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Immatriculation *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 12345-A-6"
                          className="uppercase"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormDescription>Format marocain (chiffres-lettre-chiffres).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marque *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Renault" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modèle *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Clio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1980}
                          max={new Date().getFullYear() + 1}
                          placeholder="Ex: 2020"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

/* --------------------------------- Step 4 --------------------------------- */
function Step4({
  cat,
  service,
  date,
  slot,
  values,
  onEdit,
}: {
  cat: CategoryItem;
  service: ServiceItem;
  date: Date;
  slot: string;
  values: FormValues;
  onEdit: () => void;
}) {
  const color = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.blue;
  return (
    <div>
      <SectionHeading
        eyebrow="Étape 4"
        title="Confirmation"
        subtitle="Vérifiez les informations ci-dessous puis confirmez votre rendez-vous."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="space-y-2">
              <SectionLabel>Rendez-vous</SectionLabel>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("font-medium", color.bg, "text-white border-transparent")}>{cat.name}</Badge>
                <Badge variant="outline" className="border-emerald-brand/30 text-emerald-brand">
                  {service.name}
                </Badge>
                <Badge variant="outline" className="font-bold text-navy">{formatMAD(service.price)}</Badge>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <RecapLine icon={<CalendarDays className="h-4 w-4 text-emerald-brand" />} label="Date">
                  {date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </RecapLine>
                <RecapLine icon={<Clock className="h-4 w-4 text-emerald-brand" />} label="Créneau">
                  {slot}
                </RecapLine>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <SectionLabel>Véhicule</SectionLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <RecapLine label="Immatriculation">
                  <span className="font-mono font-semibold">{values.vehiclePlate}</span>
                </RecapLine>
                <RecapLine label="Véhicule">
                  {values.vehicleBrand} {values.vehicleModel} ({values.vehicleYear})
                </RecapLine>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <SectionLabel>Client</SectionLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <RecapLine label="Nom">{values.clientName}</RecapLine>
                <RecapLine label="Téléphone">{values.clientPhone}</RecapLine>
                {values.clientEmail && <RecapLine label="E-mail">{values.clientEmail}</RecapLine>}
                <RecapLine label="Notifications">{values.channel}</RecapLine>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-4 p-5 md:p-6">
            <SectionLabel>Récapitulatif tarif</SectionLabel>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{service.name}</span>
              <span className="font-semibold text-navy">{formatMAD(service.price)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold text-navy">Total à payer sur place</span>
              <span className="text-xl font-bold text-emerald-brand">{formatMAD(service.price)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Paiement en espèces ou par carte au centre. Aucun paiement en ligne requis.
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={onEdit}>
              Modifier mes informations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------- shared bits ------------------------------ */
function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-brand">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-navy">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
  );
}

function RecapLine({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
      {icon && <span className="mt-0.5">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-navy">{children}</p>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="h-px w-full bg-border" />;
}
