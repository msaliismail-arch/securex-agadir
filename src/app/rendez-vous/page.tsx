"use client";

import * as React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useForm,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  Phone,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
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

import {
  cn,
  formatMAD,
  isValidMaPhone,
  isValidMaPlateArabic,
  formatMaPlate,
} from "@/lib/utils";

import {
  COLOR_MAP,
  getSlotsForDate,
  type CategoryColor,
} from "@/lib/constants";

import {
  BookingSuccess,
  type BookingSuccessData,
} from "@/components/client/booking-success";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

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

interface CapacityDay {
  capaciteMax: number;
  confirmedCount: number;
  isFull: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const STEPS = [
  {
    num: 1,
    label: "Véhicule",
  },
  {
    num: 2,
    label: "Service & Créneau",
  },
  {
    num: 3,
    label: "Informations",
  },
  {
    num: 4,
    label: "Confirmation",
  },
] as const;

/* -------------------------------------------------------------------------- */
/*                                    Form                                    */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  clientName: z
    .string()
    .min(2, "Nom trop court"),

  clientPhone: z
    .string()
    .refine(
      isValidMaPhone,
      "Numéro marocain invalide",
    ),

  clientEmail: z
    .string()
    .email("E-mail invalide"),

  vehiclePlate: z
    .string()
    .refine(
      isValidMaPlateArabic,
      "Format invalide. Saisissez une immatriculation marocaine valide.",
    ),

  vehicleBrand: z
    .string()
    .min(2, "Marque requise"),

  vehicleModel: z
    .string()
    .min(1, "Modèle requis"),

  vehicleYear: z
    .number()
    .int("Année invalide")
    .min(1980, "Année invalide")
    .max(
      new Date().getFullYear() + 1,
      "Année invalide",
    ),

  channel: z.enum([
    "SMS",
    "EMAIL",
    "WHATSAPP",
  ]),
});

type FormValues =
  z.infer<typeof formSchema>;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function ymdKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

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

/* -------------------------------------------------------------------------- */
/*                               Booking Wizard                               */
/* -------------------------------------------------------------------------- */

function BookingWizard() {
  const searchParams =
    useSearchParams();

  const [step, setStep] =
    useState<1 | 2 | 3 | 4>(1);

  const [success, setSuccess] =
    useState<BookingSuccessData | null>(
      null,
    );

  const [categories, setCategories] =
    useState<CategoryItem[]>([]);

  const [
    loadingCats,
    setLoadingCats,
  ] = useState(true);

  const [
    selectedCat,
    setSelectedCat,
  ] =
    useState<CategoryItem | null>(
      null,
    );

  const [
    selectedService,
    setSelectedService,
  ] =
    useState<ServiceItem | null>(
      null,
    );

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<Date | undefined>(
      undefined,
    );

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<string | null>(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    clientProfile,
    setClientProfile,
  ] = useState<{
    name: string;
    phone: string;
    email: string | null;
    channel:
      | "SMS"
      | "EMAIL"
      | "WHATSAPP";
  } | null>(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    promoCode,
    setPromoCode,
  ] = useState("");

  /* ------------------------------------------------------------------------ */
  /*                                  Form                                    */
  /* ------------------------------------------------------------------------ */

  const form =
    useForm<FormValues>({
      resolver:
        zodResolver(formSchema),

      defaultValues: {
        clientName: "",
        clientPhone: "+212 ",
        clientEmail: "",
        vehiclePlate: "",
        vehicleBrand: "",
        vehicleModel: "",
        vehicleYear:
          new Date().getFullYear(),
        channel: "SMS",
      },

      mode: "onTouched",
    });

  /* ------------------------------------------------------------------------ */
  /*                          Load categories/services                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setLoadingCats(true);

      try {
        const response =
          await fetch(
            "/api/categories?withServices=1",
            {
              cache: "no-store",
            },
          );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les catégories.",
          );
        }

        const data =
          await readJsonSafely<
            CategoryItem[]
          >(response);

        if (!active) {
          return;
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Réponse catégories invalide.",
          );
        }

        setCategories(data);

        const slug =
          searchParams.get(
            "category",
          );

        if (slug) {
          const found =
            data.find(
              (category) =>
                category.slug ===
                slug,
            );

          if (found) {
            setSelectedCat(
              found,
            );

            setStep(2);
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur de chargement.",
        );
      } finally {
        if (active) {
          setLoadingCats(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, [searchParams]);

  /* ------------------------------------------------------------------------ */
  /*                         Load authenticated client                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let active = true;

    async function loadClient() {
      setAuthLoading(true);

      try {
        const response =
          await fetch(
            "/api/clients/me",
            {
              cache: "no-store",
            },
          );

        if (!active) {
          return;
        }

        if (!response.ok) {
          setClientProfile(null);
          return;
        }

        const profile =
          await readJsonSafely<{
            name: string;
            phone: string;
            email: string | null;
            channel:
              | "SMS"
              | "EMAIL"
              | "WHATSAPP";
          }>(response);

        if (
          !profile ||
          !profile.name ||
          !profile.phone
        ) {
          setClientProfile(null);
          return;
        }

        setClientProfile(
          profile,
        );

        form.reset({
          ...form.getValues(),

          clientName:
            profile.name,

          clientPhone:
            profile.phone,

          clientEmail:
            profile.email ??
            "",

          channel:
            profile.channel ??
            "SMS",
        });
      } catch {
        if (active) {
          setClientProfile(
            null,
          );
        }
      } finally {
        if (active) {
          setAuthLoading(
            false,
          );
        }
      }
    }

    void loadClient();

    return () => {
      active = false;
    };
  }, [form]);

  /* ------------------------------------------------------------------------ */
  /*                                  Submit                                  */
  /* ------------------------------------------------------------------------ */

  const submit =
    form.handleSubmit(
      async (values) => {
        if (
          !selectedCat ||
          !selectedService ||
          !selectedDate ||
          !selectedSlot
        ) {
          toast.error(
            "Veuillez compléter toutes les étapes.",
          );

          return;
        }

        setSubmitting(true);

        try {
          const response =
            await fetch(
              "/api/appointments",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  ...values,

                  promoCode:
                    promoCode
                      .trim()
                      .toUpperCase(),

                  vehiclePlate:
                    values.vehiclePlate.trim(),

                  vehicleYear:
                    Number(
                      values.vehicleYear,
                    ),

                  vehicleCategory:
                    selectedCat.slug.toUpperCase(),

                  categoryId:
                    selectedCat.id,

                  serviceId:
                    selectedService.id,

                  date: ymdKey(
                    selectedDate,
                  ),

                  slot:
                    selectedSlot,
                }),
              },
            );

          const data =
            await readJsonSafely<{
              error?: string;
              checkoutUrl?: string;

              code?: string;
              queueNumber?: number;

              date?: string;
              slot?: string;

              vehiclePlate?: string;
              clientName?: string;
              clientPhone?: string;

              category?: {
                name?: string;
                color?: string;
              };

              service?: {
                name?: string;
                price?: number;
              };
            }>(response);

          if (
            response.status ===
            401
          ) {
            toast.error(
              "Votre session a expiré. Veuillez vous reconnecter.",
            );

            window.location.assign(
              "/espace-client?next=/rendez-vous",
            );

            return;
          }

          if (!response.ok) {
            throw new Error(
              data?.error ||
                `Erreur lors de la réservation (${response.status}).`,
            );
          }

          if (!data) {
            throw new Error(
              "Réponse serveur invalide.",
            );
          }

          /*
           * Stripe checkout.
           */
          if (
            data.checkoutUrl
          ) {
            window.location.assign(
              data.checkoutUrl,
            );

            return;
          }

          if (!data.code) {
            throw new Error(
              "Code de réservation manquant.",
            );
          }

          setSuccess({
            code: data.code,

            queueNumber:
              data.queueNumber ??
              1,

            date:
              data.date ??
              ymdKey(
                selectedDate,
              ),

            slot:
              data.slot ??
              selectedSlot,

            categoryName:
              data.category
                ?.name ??
              selectedCat.name,

            categoryColor:
              (data.category
                ?.color ??
                selectedCat.color) as CategoryColor,

            serviceName:
              data.service
                ?.name ??
              selectedService.name,

            servicePrice:
              data.service
                ?.price ??
              selectedService.price,

            vehiclePlate:
              data.vehiclePlate ??
              values.vehiclePlate,

            vehicleDesc: `${values.vehicleBrand} ${values.vehicleModel}`,

            clientName:
              data.clientName ??
              values.clientName,

            clientPhone:
              data.clientPhone ??
              values.clientPhone,
          });

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erreur lors de la réservation.",
          );
        } finally {
          setSubmitting(
            false,
          );
        }
      },
    );

  /* ------------------------------------------------------------------------ */
  /*                              Authentication                              */
  /* ------------------------------------------------------------------------ */

  if (authLoading) {
    return <WizardSkeleton />;
  }

  if (!clientProfile) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-lg items-center px-4 py-12">
        <Card className="glass-card w-full border-primary/20 shadow-card">
          <CardContent className="p-7 text-center">
            <Lock className="mx-auto h-12 w-12 text-primary" />

            <h1 className="mt-4 text-2xl font-bold">
              Identifiez-vous avant de réserver
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Créez votre compte,
              confirmez votre email,
              puis complétez votre
              profil avant de prendre
              rendez-vous.
            </p>

            <Button
              asChild
              className="mt-6 bg-brand-gradient text-white hover:opacity-90"
            >
              <Link href="/espace-client?next=/rendez-vous">
                Connexion ou inscription
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                 Success                                  */
  /* ------------------------------------------------------------------------ */

  if (success) {
    return (
      <BookingSuccess
        data={success}
      />
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                  Wizard                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Réservation en ligne
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Prendre rendez-vous
        </h1>
      </div>

      <ProgressIndicator
        current={step}
        onStepClick={(number) => {
          if (
            number < step
          ) {
            setStep(
              number as
                | 1
                | 2
                | 3
                | 4,
            );
          }
        }}
      />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepWrapper key="s1">
            <Step1
              categories={
                categories
              }
              loading={
                loadingCats
              }
              selected={
                selectedCat
              }
              onSelect={(
                category,
              ) => {
                setSelectedCat(
                  category,
                );

                if (
                  selectedService &&
                  !category.services?.some(
                    (service) =>
                      service.id ===
                      selectedService.id,
                  )
                ) {
                  setSelectedService(
                    null,
                  );

                  setSelectedSlot(
                    null,
                  );
                }
              }}
            />

            <WizardNav
              onNext={() =>
                setStep(2)
              }
              nextDisabled={
                !selectedCat
              }
              nextLabel="Continuer"
              hideBack
            />
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper key="s2">
            <Step2
              category={
                selectedCat!
              }
              selectedService={
                selectedService
              }
              onSelectService={(
                service,
              ) => {
                setSelectedService(
                  service,
                );
              }}
              selectedDate={
                selectedDate
              }
              onSelectDate={
                setSelectedDate
              }
              selectedSlot={
                selectedSlot
              }
              onSelectSlot={
                setSelectedSlot
              }
            />

            <WizardNav
              onBack={() =>
                setStep(1)
              }
              onNext={() =>
                setStep(3)
              }
              nextDisabled={
                !selectedService ||
                !selectedDate ||
                !selectedSlot
              }
              nextLabel="Continuer"
            />
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper key="s3">
            <Step3
              form={form}
            />

            <WizardNav
              onBack={() =>
                setStep(2)
              }
              onNext={async () => {
                const valid =
                  await form.trigger();

                if (valid) {
                  setStep(4);
                }
              }}
              nextLabel="Vérifier"
            />
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper key="s4">
            <Step4
              cat={
                selectedCat!
              }
              service={
                selectedService!
              }
              date={
                selectedDate!
              }
              slot={
                selectedSlot!
              }
              values={
                form.getValues()
              }
              promoCode={
                promoCode
              }
              onPromoCodeChange={
                setPromoCode
              }
              onEdit={() =>
                setStep(3)
              }
            />

            <WizardNav
              onBack={() =>
                setStep(3)
              }
              onNext={() => {
                void submit();
              }}
              nextDisabled={
                submitting
              }
              nextLabel={
                submitting
                  ? "En cours..."
                  : promoCode.trim()
                    ? "Confirmer avec le code"
                    : "Payer l'acompte de 25 %"
              }
              nextLoading={
                submitting
              }
              highlightNext
            />
          </StepWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Progress indicator                              */
/* -------------------------------------------------------------------------- */

function ProgressIndicator({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick?: (
    number: number,
  ) => void;
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-1 md:gap-2">
      {STEPS.map(
        (item, index) => {
          const isDone =
            item.num <
            current;

          const isCurrent =
            item.num ===
            current;

          const clickable =
            Boolean(
              onStepClick,
            ) &&
            item.num <
              current;

          return (
            <React.Fragment
              key={
                item.num
              }
            >
              <button
                type="button"
                disabled={
                  !clickable
                }
                onClick={() => {
                  if (
                    clickable
                  ) {
                    onStepClick?.(
                      item.num,
                    );
                  }
                }}
                className={cn(
                  "group flex flex-1 flex-col items-center gap-1.5 text-center",
                  clickable &&
                    "cursor-pointer",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all md:h-10 md:w-10",

                    isDone &&
                      "border-primary bg-brand-gradient text-white",

                    isCurrent &&
                      "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",

                    !isDone &&
                      !isCurrent &&
                      "border-border bg-card text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <Check
                      className="h-4 w-4"
                      strokeWidth={
                        3
                      }
                    />
                  ) : (
                    item.num
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight md:text-xs",

                    isCurrent
                      ? "text-primary"
                      : isDone
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </button>

              {index <
                STEPS.length -
                  1 && (
                <div
                  className={cn(
                    "mb-5 h-0.5 flex-1 rounded-full transition-colors md:mb-6",

                    item.num <
                      current
                      ? "bg-primary"
                      : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          );
        },
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Step wrapper                                */
/* -------------------------------------------------------------------------- */

function StepWrapper({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 24,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: -24,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Wizard nav                                  */
/* -------------------------------------------------------------------------- */

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
  onNext?: () =>
    | void
    | Promise<void>;

  nextLabel: string;

  nextDisabled?: boolean;
  nextLoading?: boolean;
  hideBack?: boolean;
  highlightNext?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
      {!hideBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          size="lg"
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Retour
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}

      <Button
        type="button"
        onClick={() => {
          void onNext?.();
        }}
        disabled={
          nextDisabled
        }
        size="lg"
        className={cn(
          "w-full sm:w-auto",

          highlightNext &&
            "bg-brand-gradient text-white hover:opacity-90",
        )}
      >
        {nextLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}

        {nextLabel}

        {!nextLoading && (
          <ChevronRight className="ml-1.5 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Step 1                                   */
/* -------------------------------------------------------------------------- */

function Step1({
  categories,
  loading,
  selected,
  onSelect,
}: {
  categories:
    CategoryItem[];

  loading: boolean;

  selected:
    CategoryItem | null;

  onSelect: (
    category: CategoryItem,
  ) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({
          length: 6,
        }).map(
          (_, index) => (
            <div
              key={
                index
              }
              className="h-44 animate-pulse rounded-xl bg-muted"
            />
          ),
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Étape 1"
        title="Type de véhicule"
        subtitle="Sélectionnez la catégorie."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(
          (category) => {
            const color =
              COLOR_MAP[
                category.color as CategoryColor
              ] ??
              COLOR_MAP.blue;

            const isSelected =
              selected?.id ===
              category.id;

            return (
              <button
                key={
                  category.id
                }
                type="button"
                onClick={() =>
                  onSelect(
                    category,
                  )
                }
                className={cn(
                  "group relative flex flex-col rounded-xl border-2 bg-card p-5 text-left transition-all hover:shadow-card",

                  isSelected
                    ? cn(
                        color.border,
                        "shadow-card ring-2",
                        color.ring,
                      )
                    : "border-border hover:border-muted-foreground/30",
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-lg text-xl font-bold",

                      color.soft,
                      color.fg,
                    )}
                  >
                    {category.name.charAt(
                      0,
                    )}
                  </span>

                  {isSelected && (
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-white",
                        color.bg,
                      )}
                    >
                      <Check
                        className="h-4 w-4"
                        strokeWidth={
                          3
                        }
                      />
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-foreground">
                  {
                    category.name
                  }
                </h3>

                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {
                    category.description
                  }
                </p>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Step 2                                   */
/* -------------------------------------------------------------------------- */

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

  selectedService:
    ServiceItem | null;

  onSelectService: (
    service:
      | ServiceItem
      | null,
  ) => void;

  selectedDate:
    Date | undefined;

  onSelectDate: (
    date:
      | Date
      | undefined,
  ) => void;

  selectedSlot:
    string | null;

  onSelectSlot: (
    slot:
      | string
      | null,
  ) => void;
}) {
  const services =
    category.services ??
    [];

  const [
    capacityDays,
    setCapacityDays,
  ] = useState<
    Record<
      string,
      CapacityDay
    >
  >({});

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState<Date>(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ),
  );

  const [
    takenSlots,
    setTakenSlots,
  ] =
    useState<string[]>([]);

  /* Capacity */

  useEffect(() => {
    let active = true;

    const start =
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        -7,
      );

    const end =
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() +
          1,
        14,
      );

    async function loadCapacity() {
      try {
        const response =
          await fetch(
            `/api/capacity?from=${ymdKey(start)}&to=${ymdKey(end)}`,
            {
              cache: "no-store",
            },
          );

        if (
          !response.ok
        ) {
          return;
        }

        const data =
          await readJsonSafely<{
            days?: Array<
              CapacityDay & {
                date: string;
              }
            >;
          }>(response);

        if (
          !active ||
          !data
        ) {
          return;
        }

        const map: Record<
          string,
          CapacityDay
        > = {};

        for (const day of
          data.days ??
          []) {
          map[day.date] = {
            capaciteMax:
              day.capaciteMax,
            confirmedCount:
              day.confirmedCount,
            isFull:
              day.isFull,
          };
        }

        setCapacityDays(
          (previous) => ({
            ...previous,
            ...map,
          }),
        );
      } catch {
        // Non-bloquant.
      }
    }

    void loadCapacity();

    return () => {
      active = false;
    };
  }, [visibleMonth]);

  /* Taken slots */

  useEffect(() => {
    let active = true;

    if (!selectedDate) {
      setTakenSlots([]);
      return;
    }

    async function loadSlots() {
      try {
        const response =
          await fetch(
            `/api/slots?date=${ymdKey(selectedDate!)}`,
            {
              cache: "no-store",
            },
          );

        if (
          !response.ok
        ) {
          if (active) {
            setTakenSlots([]);
          }

          return;
        }

        const slots =
          await readJsonSafely<
            string[]
          >(response);

        if (!active) {
          return;
        }

        setTakenSlots(
          Array.isArray(
            slots,
          )
            ? slots
            : [],
        );
      } catch {
        if (active) {
          setTakenSlots([]);
        }
      }
    }

    void loadSlots();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Étape 2"
        title="Service et créneau"
        subtitle={`Pour ${category.name}.`}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Service */}

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="h-4 w-1 rounded bg-brand-gradient" />
            Service
          </h3>

          <RadioGroup
            value={
              selectedService?.id ??
              ""
            }
            onValueChange={(
              value,
            ) => {
              onSelectService(
                services.find(
                  (service) =>
                    service.id ===
                    value,
                ) ??
                  null,
              );
            }}
            className="gap-3"
          >
            {services.map(
              (service) => {
                const isSelected =
                  selectedService?.id ===
                  service.id;

                return (
                  <label
                    key={
                      service.id
                    }
                    htmlFor={`svc-${service.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-card p-4 transition-all",

                      isSelected
                        ? "border-primary ring-2 ring-primary/10"
                        : "border-border",
                    )}
                  >
                    <RadioGroupItem
                      value={
                        service.id
                      }
                      id={`svc-${service.id}`}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {
                            service.name
                          }
                        </span>

                        <span className="text-sm font-bold text-primary">
                          {formatMAD(
                            service.price,
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          service.description
                        }
                      </p>
                    </div>
                  </label>
                );
              },
            )}
          </RadioGroup>

          {services.length ===
            0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Aucun service
              disponible pour cette
              catégorie.
            </p>
          )}
        </div>

        {/* Date */}

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="h-4 w-1 rounded bg-brand-gradient" />
            Date
          </h3>

          <div className="flex justify-center rounded-xl border border-border bg-card p-2">
            <Calendar
              mode="single"
              selected={
                selectedDate
              }
              onSelect={(
                date,
              ) => {
                /*
                 * Quand la date change,
                 * l'ancien créneau
                 * doit être supprimé.
                 */
                onSelectSlot(
                  null,
                );

                if (!date) {
                  onSelectDate(
                    undefined,
                  );

                  return;
                }

                onSelectDate(
                  new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                  ),
                );
              }}
              month={
                visibleMonth
              }
              onMonthChange={
                setVisibleMonth
              }
              disabled={(
                date,
              ) => {
                const today =
                  new Date();

                today.setHours(
                  0,
                  0,
                  0,
                  0,
                );

                const cleanDate =
                  new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                  );

                /*
                 * Pas de dates passées.
                 * Dimanche = fermé.
                 */
                if (
                  cleanDate <
                    today ||
                  date.getDay() ===
                    0
                ) {
                  return true;
                }

                return (
                  capacityDays[
                    ymdKey(
                      cleanDate,
                    )
                  ]?.isFull ===
                  true
                );
              }}
              fromDate={
                new Date()
              }
              locale={fr}
              className="mx-auto"
            />
          </div>

          {/* Slots */}

          <h3 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="h-4 w-1 rounded bg-brand-gradient" />
            Créneau
          </h3>

          {!selectedDate ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Sélectionnez une
              date.
            </p>
          ) : getSlotsForDate(
              selectedDate,
            ).length ===
            0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              Fermé ce jour.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {getSlotsForDate(
                selectedDate,
              ).map(
                (slot) => {
                  const isSelected =
                    selectedSlot ===
                    slot;

                  const now =
                    new Date();

                  const isToday =
                    ymdKey(
                      selectedDate,
                    ) ===
                    ymdKey(now);

                  const [
                    hours,
                    minutes,
                  ] = slot
                    .split(":")
                    .map(Number);

                  const slotMinutes =
                    hours * 60 +
                    minutes;

                  const currentMinutes =
                    now.getHours() *
                      60 +
                    now.getMinutes();

                  const slotPast =
                    isToday &&
                    slotMinutes <=
                      currentMinutes;

                  const isTaken =
                    takenSlots.includes(
                      slot,
                    );

                  const isDisabled =
                    slotPast ||
                    isTaken;

                  return (
                    <button
                      key={
                        slot
                      }
                      type="button"
                      disabled={
                        isDisabled
                      }
                      onClick={() => {
                        if (
                          !isDisabled
                        ) {
                          onSelectSlot(
                            slot,
                          );
                        }
                      }}
                      title={
                        isTaken
                          ? "Déjà pris"
                          : slotPast
                            ? "Passé"
                            : undefined
                      }
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg border-2 px-2 py-2.5 text-sm font-medium transition-all",

                        isDisabled
                          ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground opacity-40"
                          : isSelected
                            ? "border-primary bg-brand-gradient text-white shadow-soft"
                            : "border-border bg-card text-foreground hover:border-primary/40",
                      )}
                    >
                      {isTaken ? (
                        <X className="h-3 w-3" />
                      ) : slotPast ? (
                        <Lock className="h-3 w-3" />
                      ) : null}

                      {isTaken
                        ? "Pris"
                        : slot}
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Step 3                                   */
/* -------------------------------------------------------------------------- */

function Step3({
  form,
}: {
  form: UseFormReturn<FormValues>;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Étape 3"
        title="Informations"
        subtitle="Coordonnées et véhicule."
      />

      <Form {...form}>
        <form
          className="space-y-8"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          {/* Client */}

          <Card className="glass-card">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={
                    form.control
                  }
                  name="clientName"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Nom complet
                      </FormLabel>

                      <FormControl>
                        <Input
                          readOnly
                          className="bg-muted/30"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={
                    form.control
                  }
                  name="clientPhone"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Téléphone
                      </FormLabel>

                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            readOnly
                            className="bg-muted/30 pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={
                    form.control
                  }
                  name="clientEmail"
                  render={({
                    field,
                  }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>
                        E-mail vérifié
                      </FormLabel>

                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            readOnly
                            className="bg-muted/30 pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle */}

          <Card className="glass-card">
            <CardContent className="space-y-4 p-5 md:p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Véhicule
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={
                    form.control
                  }
                  name="vehiclePlate"
                  render={({
                    field,
                  }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>
                        Immatriculation *
                      </FormLabel>

                      <FormControl>
                        <Input
                          placeholder="Ex: 12345-A-6"
                          {...field}
                          onBlur={(
                            event,
                          ) => {
                            field.onBlur();

                            field.onChange(
                              formatMaPlate(
                                event.target
                                  .value,
                              ),
                            );
                          }}
                        />
                      </FormControl>

                      <FormDescription>
                        Saisissez
                        l&apos;immatriculation
                        marocaine du
                        véhicule.
                      </FormDescription>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={
                    form.control
                  }
                  name="vehicleBrand"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Marque *
                      </FormLabel>

                      <FormControl>
                        <Input
                          placeholder="Ex: Renault"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={
                    form.control
                  }
                  name="vehicleModel"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Modèle *
                      </FormLabel>

                      <FormControl>
                        <Input
                          placeholder="Ex: Clio"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={
                    form.control
                  }
                  name="vehicleYear"
                  render={({
                    field,
                  }) => (
                    <FormItem>
                      <FormLabel>
                        Année *
                      </FormLabel>

                      <FormControl>
                        <Input
                          type="number"
                          min={1980}
                          max={
                            new Date().getFullYear() +
                            1
                          }
                          placeholder="2020"
                          name={
                            field.name
                          }
                          ref={
                            field.ref
                          }
                          onBlur={
                            field.onBlur
                          }
                          value={
                            field.value ??
                            ""
                          }
                          onChange={(
                            event,
                          ) => {
                            const value =
                              event
                                .target
                                .value;

                            if (
                              value ===
                              ""
                            ) {
                              field.onChange(
                                undefined,
                              );

                              return;
                            }

                            field.onChange(
                              event
                                .target
                                .valueAsNumber,
                            );
                          }}
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

/* -------------------------------------------------------------------------- */
/*                                   Step 4                                   */
/* -------------------------------------------------------------------------- */

function Step4({
  cat,
  service,
  date,
  slot,
  values,
  promoCode,
  onPromoCodeChange,
  onEdit,
}: {
  cat: CategoryItem;
  service: ServiceItem;
  date: Date;
  slot: string;
  values: FormValues;
  promoCode: string;

  onPromoCodeChange: (
    value: string,
  ) => void;

  onEdit: () => void;
}) {
  const color =
    COLOR_MAP[
      cat.color as CategoryColor
    ] ??
    COLOR_MAP.blue;

  const deposit =
    Math.round(
      service.price *
        0.25 *
        100,
    ) / 100;

  return (
    <div>
      <SectionHeading
        eyebrow="Étape 4"
        title="Confirmation"
        subtitle="Vérifiez les informations avant de confirmer."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardContent className="space-y-5 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "border-transparent font-medium text-white",
                  color.bg,
                )}
              >
                {cat.name}
              </Badge>

              <Badge
                variant="outline"
                className="border-primary/30 text-primary"
              >
                {
                  service.name
                }
              </Badge>

              <Badge
                variant="outline"
                className="font-bold text-foreground"
              >
                {formatMAD(
                  service.price,
                )}
              </Badge>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-muted/30 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Date
                </p>

                <p className="text-sm font-medium text-foreground">
                  {date.toLocaleDateString(
                    "fr-FR",
                    {
                      weekday:
                        "long",
                      day: "2-digit",
                      month:
                        "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>

              <div className="rounded-md bg-muted/30 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Créneau
                </p>

                <p className="text-sm font-medium text-foreground">
                  {slot}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-muted/30 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Immatriculation
                </p>

                <p className="font-mono text-sm font-semibold text-foreground">
                  {
                    values.vehiclePlate
                  }
                </p>
              </div>

              <div className="rounded-md bg-muted/30 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Véhicule
                </p>

                <p className="text-sm font-medium text-foreground">
                  {
                    values.vehicleBrand
                  }{" "}
                  {
                    values.vehicleModel
                  }{" "}
                  (
                  {
                    values.vehicleYear
                  }
                  )
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}

        <Card className="glass-card h-fit">
          <CardContent className="space-y-4 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paiement
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Prix total
              </span>

              <span className="font-semibold">
                {formatMAD(
                  service.price,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
              <span className="text-sm text-muted-foreground">
                Acompte en
                ligne (25 %)
              </span>

              <span className="text-xl font-bold text-primary">
                {formatMAD(
                  deposit,
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="promo-code"
                className="text-xs font-medium"
              >
                Code
                d&apos;exemption
                (facultatif)
              </label>

              <Input
                id="promo-code"
                value={
                  promoCode
                }
                onChange={(
                  event,
                ) =>
                  onPromoCodeChange(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="SX-XXXXXXXX"
                className="font-mono uppercase"
              />

              <p className="text-[11px] text-muted-foreground">
                Un code valide
                supprime
                l&apos;acompte ;
                la totalité sera
                alors payée à
                l&apos;agence.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onEdit}
            >
              Modifier
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Section heading                               */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}