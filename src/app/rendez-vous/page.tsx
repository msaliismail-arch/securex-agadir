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
  AlertCircle, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, Phone, Smartphone, User, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn, formatMAD, isValidMaPhone, isValidMaPlateArabic, formatMaPlate } from "@/lib/utils";
import { COLOR_MAP, DEFAULT_SLOTS, getSlotsForDate, type CategoryColor } from "@/lib/constants";
import { BookingSuccess, type BookingSuccessData } from "@/components/client/booking-success";

interface CategoryItem { id: string; name: string; slug: string; description: string; icon: string; color: string; sort: number; services?: ServiceItem[]; }
interface ServiceItem { id: string; name: string; description: string; durationMin: number; price: number; }

const STEPS = [ { num: 1, label: "Véhicule" }, { num: 2, label: "Service & Créneau" }, { num: 3, label: "Informations" }, { num: 4, label: "Confirmation" } ] as const;
const channelOptions = [ { value: "SMS", label: "SMS", icon: MessageSquare }, { value: "WHATSAPP", label: "WhatsApp", icon: Smartphone }, { value: "EMAIL", label: "E-mail", icon: Mail } ] as const;

const formSchema = z.object({
  clientName: z.string({ required_error: "Le nom est requis" }).min(2, "Nom trop court"),
  clientPhone: z.string({ required_error: "Le téléphone est requis" }).refine(isValidMaPhone, "Numéro marocain invalide"),
  clientEmail: z.string({ required_error: "L'e-mail est requis" }).email("E-mail invalide"),
  clientPassword: z.string({ required_error: "Mot de passe requis" }).min(6, "6 caractères min."),
  clientPasswordConfirm: z.string({ required_error: "Veuillez confirmer" }),
  vehiclePlate: z.string({ required_error: "Immatriculation requise" }).refine(isValidMaPlateArabic, "Format invalide. Saisissez une lettre arabe (Ex: 12345-أ-6)"),
  vehicleBrand: z.string().min(2, "Marque requise"),
  vehicleModel: z.string().min(1, "Modèle requis"),
  vehicleYear: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1, "Année invalide"),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]),
}).refine((d) => d.clientPassword === d.clientPasswordConfirm, { message: "Les mots de passe ne correspondent pas", path: ["clientPasswordConfirm"] });

type FormValues = z.infer<typeof formSchema>;

export default function RendezVousPage() { return (<Suspense fallback={<WizardSkeleton />}><BookingWizard /></Suspense>); }
function WizardSkeleton() { return (<div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>); }

function ymdKey(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

function BookingWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [success, setSuccess] = useState<BookingSuccessData | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch("/api/categories?withServices=1", { cache: "no-store" });
        const data: CategoryItem[] = await res.json();
        if (!active) return;
        setCategories(data);
        const slug = searchParams.get("category");
        if (slug) { const found = data.find((c) => c.slug === slug); if (found) { setSelectedCat(found); setStep(2); } }
      } catch { if (active) toast.error("Erreur de chargement."); } finally { if (active) setLoadingCats(false); }
    })();
    return () => { active = false; };
  }, [searchParams]);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { clientName: "", clientPhone: "+212 ", clientEmail: "", clientPassword: "", clientPasswordConfirm: "", vehiclePlate: "", vehicleBrand: "", vehicleModel: "", vehicleYear: new Date().getFullYear(), channel: "SMS" }, mode: "onTouched" });

  const submit = form.handleSubmit(async (values) => {
    if (!selectedCat || !selectedService || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, vehiclePlate: values.vehiclePlate.trim(), vehicleYear: Number(values.vehicleYear), vehicleCategory: selectedCat.slug.toUpperCase(), categoryId: selectedCat.id, serviceId: selectedService.id, date: ymdKey(selectedDate), slot: selectedSlot }) });
      if (res.status === 409) { toast.error("Un compte existe déjà avec ces identifiants."); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors de la réservation");
      setSuccess({ code: data.code, queueNumber: data.queueNumber ?? 1, date: data.date, slot: data.slot, categoryName: data.category?.name ?? selectedCat.name, categoryColor: (data.category?.color ?? selectedCat.color) as CategoryColor, serviceName: data.service?.name ?? selectedService.name, servicePrice: data.service?.price ?? selectedService.price, vehiclePlate: data.vehiclePlate ?? values.vehiclePlate, vehicleDesc: `${values.vehicleBrand} ${values.vehicleModel}`, clientName: data.clientName ?? values.clientName, clientPhone: data.clientPhone ?? values.clientPhone });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); } finally { setSubmitting(false); }
  });

  if (success) return <BookingSuccess data={success} />;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Réservation en ligne</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Prendre rendez-vous</h1>
      </div>
      <ProgressIndicator current={step} onStepClick={(n) => n < step && setStep(n as 1 | 2 | 3 | 4)} />
      <AnimatePresence mode="wait">
        {step === 1 && (<StepWrapper key="s1"><Step1 categories={categories} loading={loadingCats} selected={selectedCat} onSelect={(c) => { setSelectedCat(c); if (selectedService && !c.services?.some((s) => s.id === selectedService.id)) { setSelectedService(null); setSelectedSlot(null); } }} /><WizardNav onNext={() => setStep(2)} nextDisabled={!selectedCat} nextLabel="Continuer" hideBack /></StepWrapper>)}
        {step === 2 && (<StepWrapper key="s2"><Step2 category={selectedCat!} selectedService={selectedService} onSelectService={setSelectedService} selectedDate={selectedDate} onSelectDate={setSelectedDate} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} /><WizardNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!selectedService || !selectedDate || !selectedSlot} nextLabel="Continuer" /></StepWrapper>)}
        {step === 3 && (<StepWrapper key="s3"><Step3 form={form} /><WizardNav onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!form.formState.isValid} nextLabel="Vérifier" /></StepWrapper>)}
        {step === 4 && (<StepWrapper key="s4"><Step4 cat={selectedCat!} service={selectedService!} date={selectedDate!} slot={selectedSlot!} values={form.getValues()} onEdit={() => setStep(3)} /><WizardNav onBack={() => setStep(3)} onNext={submit} nextDisabled={submitting} nextLabel={submitting ? "En cours…" : "Confirmer"} nextLoading={submitting} highlightNext /></StepWrapper>)}
      </AnimatePresence>
    </div>
  );
}

function ProgressIndicator({ current, onStepClick }: { current: number; onStepClick?: (n: number) => void; }) {
  return (<div className="mb-8 flex items-center justify-between gap-1 md:gap-2">{STEPS.map((s, idx) => { const isDone = s.num < current; const isCurrent = s.num === current; const clickable = !!onStepClick && s.num < current; return (<React.Fragment key={s.num}><button type="button" disabled={!clickable} onClick={() => clickable && onStepClick?.(s.num)} className={cn("group flex flex-1 flex-col items-center gap-1.5 text-center", clickable && "cursor-pointer")}><div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all md:h-10 md:w-10", isDone && "border-primary bg-brand-gradient text-white", isCurrent && "border-primary bg-primary/10 text-primary ring-4 ring-primary/10", !isDone && !isCurrent && "border-border bg-card text-muted-foreground")}>{isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : s.num}</div><span className={cn("text-[10px] font-medium leading-tight md:text-xs", isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground")}>{s.label}</span></button>{idx < STEPS.length - 1 && (<div className={cn("mb-5 h-0.5 flex-1 rounded-full transition-colors md:mb-6", s.num < current ? "bg-primary" : "bg-border")} />)}</React.Fragment>); })}</div>);
}

function StepWrapper({ children }: { children: React.ReactNode }) { return (<motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>{children}</motion.div>); }

function WizardNav({ onBack, onNext, nextLabel, nextDisabled, nextLoading, hideBack, highlightNext }: { onBack?: () => void; onNext?: () => void; nextLabel: string; nextDisabled?: boolean; nextLoading?: boolean; hideBack?: boolean; highlightNext?: boolean; }) {
  return (<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">{!hideBack ? (<Button type="button" variant="outline" onClick={onBack} size="lg" className="w-full sm:w-auto"><ChevronLeft className="mr-1.5 h-4 w-4" /> Retour</Button>) : (<span className="hidden sm:block" />)}<Button type="button" onClick={onNext} disabled={nextDisabled} size="lg" className={cn("w-full sm:w-auto", highlightNext && "bg-brand-gradient text-white hover:opacity-90")}>{nextLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{nextLabel}{!nextLoading && <ChevronRight className="ml-1.5 h-4 w-4" />}</Button></div>);
}

function Step1({ categories, loading, selected, onSelect }: { categories: CategoryItem[]; loading: boolean; selected: CategoryItem | null; onSelect: (c: CategoryItem) => void; }) {
  if (loading) return (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />))}</div>);
  return (<div><SectionHeading eyebrow="Étape 1" title="Type de véhicule" subtitle="Sélectionnez la catégorie." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((cat) => { const color = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.blue; const isSelected = selected?.id === cat.id; return (<button key={cat.id} type="button" onClick={() => onSelect(cat)} className={cn("group relative flex flex-col rounded-xl border-2 bg-card p-5 text-left transition-all hover:shadow-card", isSelected ? cn(color.border, "shadow-card ring-2", color.ring) : "border-border hover:border-muted-foreground/30")}><div className="mb-3 flex items-center justify-between"><span className={cn("flex h-11 w-11 items-center justify-center rounded-lg text-xl font-bold", color.soft, color.fg)}>{cat.name.charAt(0)}</span>{isSelected && (<span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-white", color.bg)}><Check className="h-4 w-4" strokeWidth={3} /></span>)}</div><h3 className="text-base font-semibold text-foreground">{cat.name}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p></button>); })}</div></div>);
}

interface CapacityDay { capaciteMax: number; confirmedCount: number; isFull: boolean; }

function Step2({ category, selectedService, onSelectService, selectedDate, onSelectDate, selectedSlot, onSelectSlot }: { category: CategoryItem; selectedService: ServiceItem | null; onSelectService: (s: ServiceItem | null) => void; selectedDate: Date | undefined; onSelectDate: (d: Date | undefined) => void; selectedSlot: string | null; onSelectSlot: (s: string | null) => void; }) {
  const services = category.services ?? [];
  const [capacityDays, setCapacityDays] = useState<Record<string, CapacityDay>>({});
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), -7);
    const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 14);
    (async () => { try { const res = await fetch(`/api/capacity?from=${ymdKey(start)}&to=${ymdKey(end)}`, { cache: "no-store" }); if (!res.ok) return; const data = await res.json(); if (!active) return; const map: Record<string, CapacityDay> = {}; for (const day of data.days ?? []) { map[day.date] = day; } setCapacityDays((prev) => ({ ...prev, ...map })); } catch {} })();
    return () => { active = false; };
  }, [visibleMonth]);

  useEffect(() => {
    if (!selectedDate) return setTakenSlots([]);
    fetch(`/api/slots?date=${ymdKey(selectedDate)}`, { cache: "no-store" })
      .then(r => r.json())
      .then((slots: string[]) => setTakenSlots(slots))
      .catch(() => setTakenSlots([]));
  }, [selectedDate]);

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Étape 2" title="Service & créneau" subtitle={`Pour ${category.name}.`} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><span className="h-4 w-1 rounded bg-brand-gradient" /> Service</h3>
          <RadioGroup value={selectedService?.id ?? ""} onValueChange={(v) => onSelectService(services.find((x) => x.id === v) ?? null)} className="gap-3">
            {services.map((s) => { const isSelected = selectedService?.id === s.id; return (<label key={s.id} htmlFor={`svc-${s.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-card p-4 transition-all", isSelected ? "border-primary ring-2 ring-primary/10" : "border-border")}><RadioGroupItem value={s.id} id={`svc-${s.id}`} className="mt-1" /><div className="flex-1"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-foreground">{s.name}</span><span className="text-sm font-bold text-primary">{formatMAD(s.price)}</span></div><p className="mt-1 text-xs text-muted-foreground">{s.description}</p></div></label>); })}
          </RadioGroup>
        </div>
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><span className="h-4 w-1 rounded bg-brand-gradient" /> Date</h3>
          <div className="flex justify-center rounded-xl border border-border bg-card p-2">
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => { if (d) onSelectDate(new Date(d.getFullYear(), d.getMonth(), d.getDate())); }} month={visibleMonth} onMonthChange={setVisibleMonth} disabled={(date) => { const today = new Date(); today.setHours(0,0,0,0); const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); if (d < today || date.getDay() === 0) return true; return capacityDays[ymdKey(d)]?.isFull === true; }} fromDate={new Date()} locale={fr} className="mx-auto" />
          </div>
          
          <h3 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-foreground"><span className="h-4 w-1 rounded bg-brand-gradient" /> Créneau</h3>
          {!selectedDate ? (<p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">Sélectionnez une date.</p>) : getSlotsForDate(selectedDate).length === 0 ? (<p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">Fermé ce jour.</p>) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {getSlotsForDate(selectedDate).map((slot) => {
                const isSelected = selectedSlot === slot;
                const now = new Date();
                const isToday = ymdKey(selectedDate) === ymdKey(now);
                const [h, m] = slot.split(":").map(Number);
                const slotPast = isToday && h * 60 + m <= now.getHours() * 60 + now.getMinutes();
                const isTaken = takenSlots.includes(slot);
                const isDisabled = slotPast || isTaken;

                return (<button key={slot} type="button" disabled={isDisabled} onClick={() => { if (!isDisabled) onSelectSlot(slot); }} title={isTaken ? "Déjà pris" : slotPast ? "Passé" : undefined} className={cn("flex items-center justify-center gap-1 rounded-lg border-2 px-2 py-2.5 text-sm font-medium transition-all", isDisabled ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground opacity-40" : isSelected ? "border-primary bg-brand-gradient text-white shadow-soft" : "border-border bg-card text-foreground hover:border-primary/40")}>
                  {isTaken ? <X className="h-3 w-3" /> : slotPast && <Lock className="h-3 w-3" />}
                  {isTaken ? "Pris" : slot}
                </button>);
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step3({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  const [showPwd, setShowPwd] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  return (<div><SectionHeading eyebrow="Étape 3" title="Informations" subtitle="Coordonnées et véhicule." /><Form {...form}><form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
    <Card className="glass-card"><CardContent className="space-y-4 p-5 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="clientName" render={({ field }) => (<FormItem><FormLabel>Nom complet *</FormLabel><FormControl><Input placeholder="Ex: Mehdi Tazi" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="clientPhone" render={({ field }) => (<FormItem><FormLabel>Téléphone (+212) *</FormLabel><FormControl><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="+212 6 12 34 56 78" className="pl-9" inputMode="tel" {...field} /></div></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="clientEmail" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>E-mail *</FormLabel><FormControl><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" placeholder="vous@exemple.com" className="pl-9" {...field} /></div></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="clientPassword" render={({ field }) => (<FormItem><FormLabel>Mot de passe *</FormLabel><FormControl><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type={showPwd ? "text" : "password" placeholder="********" className="pl-9 pr-10" {...field} /><button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground">{showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="clientPasswordConfirm" render={({ field }) => (<FormItem><FormLabel>Confirmer *</FormLabel><FormControl><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type={showPwdConfirm ? "text" : "password" placeholder="********" className="pl-9 pr-10" {...field} /><button type="button" onClick={() => setShowPwdConfirm(!showPwdConfirm)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground">{showPwdConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>)} />
      </div>
    </CardContent></Card>
    <Card className="glass-card"><CardContent className="space-y-4 p-5 md:p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><CalendarDays className="h-4 w-4 text-primary" /> Véhicule</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField control={form.control} name="vehiclePlate" render={({ field }) => (<FormItem className="sm:col-span-2"><FormLabel>Immatriculation *</FormLabel><FormControl><Input placeholder="Ex: 12345-أ-6" {...field} onBlur={(e) => { field.onBlur(e); field.onChange(formatMaPlate(e.target.value)); }} /></FormControl><FormDescription>Format : Chiffres - Lettre arabe - Code.</FormDescription><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="vehicleBrand" render={({ field }) => (<FormItem><FormLabel>Marque *</FormLabel><FormControl><Input placeholder="Ex: Renault" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="vehicleModel" render={({ field }) => (<FormItem><FormLabel>Modèle *</FormLabel><FormControl><Input placeholder="Ex: Clio" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="vehicleYear" render={({ field }) => (<FormItem><FormLabel>Année *</FormLabel><FormControl><Input type="number" min={1980} max={new Date().getFullYear() + 1} placeholder="2020" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
      </div>
    </CardContent></Card>
  </form></Form></div>);
}

function Step4({ cat, service, date, slot, values, onEdit }: { cat: CategoryItem; service: ServiceItem; date: Date; slot: string; values: FormValues; onEdit: () => void; }) {
  const color = COLOR_MAP[cat.color as CategoryColor] ?? COLOR_MAP.blue;
  return (<div><SectionHeading eyebrow="Étape 4" title="Confirmation" subtitle="Vérifiez et confirmez." /><div className="grid gap-5 lg:grid-cols-3"><Card className="glass-card lg:col-span-2"><CardContent className="space-y-5 p-5 md:p-6">
    <div className="flex flex-wrap items-center gap-2"><Badge className={cn("font-medium", color.bg, "text-white border-transparent")}>{cat.name}</Badge><Badge variant="outline" className="border-primary/30 text-primary">{service.name}</Badge><Badge variant="outline" className="font-bold text-foreground">{formatMAD(service.price)}</Badge></div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="rounded-md bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</p><p className="text-sm font-medium text-foreground">{date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p></div><div className="rounded-md bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Créneau</p><p className="text-sm font-medium text-foreground">{slot}</p></div></div>
    <div className="h-px w-full bg-border" />
    <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-md bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Immatriculation</p><p className="text-sm font-mono font-semibold text-foreground">{values.vehiclePlate}</p></div><div className="rounded-md bg-muted/30 px-3 py-2"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Véhicule</p><p className="text-sm font-medium text-foreground">{values.vehicleBrand} {values.vehicleModel} ({values.vehicleYear})</p></div></div>
  </CardContent></Card><Card className="glass-card h-fit"><CardContent className="space-y-4 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Récapitulatif</p><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total à payer sur place</span><span className="text-xl font-bold text-primary">{formatMAD(service.price)}</span></div><Button type="button" variant="outline" className="w-full" onClick={onEdit}>Modifier</Button></CardContent></Card></div></div>);
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string; }) { return (<div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>); }