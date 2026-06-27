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
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  User,
  X, // <-- HADI ZIDTHA
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
import { cn, formatMAD, isValidMaPhone, isValidMaPlateArabic, formatMaPlate } from "@/lib/utils"; // <-- HADI BDELTHA
import { COLOR_MAP, DEFAULT_SLOTS, getSlotsForDate, type CategoryColor } from "@/lib/constants";
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

const formSchema = z
  .object({
    clientName: z
      .string({ required_error: "Le nom est requis" })
      .min(2, "Nom complet trop court (2 caractères min.)")
      .max(80, "Nom trop long"),
    clientPhone: z
      .string({ required_error: "Le téléphone est requis" })
      .refine(isValidMaPhone, "Numéro marocain invalide (ex: +212 6 12 34 56 78)"),
    clientEmail: z
      .string({ required_error: "L'e-mail est requis" })
      .email("Adresse e-mail invalide"),
    clientPassword: z
      .string({ required_error: "Le mot de passe est requis" })
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    clientPasswordConfirm: z
      .string({ required_error: "Veuillez confirmer le mot de passe" }),
    vehiclePlate: z
      .string({ required_error: "Immatriculation requise" })
      .refine(isValidMaPlateArabic, "Format invalide. Saisissez une lettre arabe (Ex: 12345-أ-6)"), // <-- HADI BDELTHA
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
  })
  .refine((data) => data.clientPassword === data.clientPasswordConfirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["clientPasswordConfirm"],
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      clientPassword: "",
      clientPasswordConfirm: "",
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
        clientEmail: values.clientEmail.trim(),
        clientPassword: values.clientPassword,
        vehiclePlate: values.vehiclePlate.trim(),
        vehicleBrand: values.vehicleBrand.trim(),
        vehicleModel: values.vehicleModel.trim(),
        vehicleYear: Number(values.vehicleYear),
        vehicleCategory: selectedCat.slug.toUpperCase(),
        categoryId: selectedCat.id,
        serviceId: selectedService.id,
        date: ymdKey(selectedDate),
        slot: selectedSlot,
        channel: values.channel,
      };
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        toast.error(
          "Un compte existe déjà avec cet email ou téléphone. Connectez-vous à votre espace client ou utilisez d'autres identifiants."
        );
        return;
      }
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Réservation en ligne
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Prendre rendez-vous
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
          Wizard en 4 étapes — choisissez votre véhicule, votre créneau, et confirmez. C&apos;est
          rapide et sécur