"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { isValidMaPhone } from "@/lib/utils";

const subjects = [
  "Prise de rendez-vous",
  "Question sur les tarifs",
  "Documents requis",
  "Contre-visite",
  "Autre demande",
] as const;

const schema = z.object({
  name: z
    .string()
    .min(2, "Veuillez saisir votre nom complet (2 caractères minimum).")
    .max(80, "Nom trop long."),
  phone: z
    .string()
    .refine(isValidMaPhone, "Numéro marocain invalide (ex. 06XXXXXXXX ou +212XXXXXXXXX)."),
  email: z.string().email("Adresse e-mail invalide.").max(120, "E-mail trop long."),
  subject: z.string().min(1, "Veuillez choisir un sujet."),
  message: z
    .string()
    .min(10, "Votre message doit contenir au moins 10 caractères.")
    .max(1500, "Message trop long (1500 caractères max)."),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (data: FormValues) => {
    // Simulated client-side submit (no backend).
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message envoyé", {
      description: `Merci ${data.name.split(" ")[0]}, nous vous recontactons sous 24h.`,
    });
    setSubmitted(true);
    reset();
    // Hide the success banner after a few seconds so the user can send another message.
    setTimeout(() => setSubmitted(false), 6000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Nom complet <span className="text-danger">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ex. Mehdi Tazi"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-danger">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">
            Téléphone <span className="text-danger">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-danger">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Adresse e-mail <span className="text-danger">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-danger">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-sm font-medium">
          Sujet <span className="text-danger">*</span>
        </Label>
        <select
          id="subject"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          aria-invalid={!!errors.subject}
          {...register("subject")}
        >
          <option value="" disabled>
            Choisir un sujet…
          </option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className="text-xs text-danger">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-sm font-medium">
          Message <span className="text-danger">*</span>
        </Label>
        <Textarea
          id="message"
          rows={5}
          placeholder="Décrivez votre demande…"
          aria-invalid={!!errors.message}
          {...register("message")}
        />
        {errors.message && (
          <p className="text-xs text-danger">{errors.message.message}</p>
        )}
      </div>

      {submitted && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 text-sm text-emerald-brand">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Votre message a bien été envoyé. Nous vous répondrons rapidement.</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-emerald-brand hover:bg-emerald-brand/90 text-white h-11 px-6"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Envoyer le message
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Champs obligatoires <span className="text-danger">*</span> — Vos données
        restent confidentielles et ne sont jamais partagées.
      </p>
    </form>
  );
}
