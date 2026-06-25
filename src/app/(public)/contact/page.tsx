"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Clock, Navigation, Facebook, Instagram, Linkedin, Send } from "lucide-react";
import { BRAND, MAPS_EMBED, MAPS_LINK } from "@/lib/constants";
import { isValidMaPhone } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  phone: z.string().refine(isValidMaPhone, "Numéro marocain invalide (+212)"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  subject: z.string().min(2, "Le sujet est requis"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      toast.success("Message envoyé !", {
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      reset();
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-red-500">Contact & localisation</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy">Contactez-nous</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Une question, une demande de renseignement ou une réclamation ? Notre équipe vous répond.
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <Card className="border-border p-7">
          <h2 className="text-lg font-semibold text-navy">Envoyez-nous un message</h2>
          <p className="text-sm text-muted-foreground">Nous vous répondons sous 24h.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input id="name" placeholder="Votre nom" className="mt-1.5" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input id="phone" placeholder="+212 6 12 34 56 78" className="mt-1.5" {...register("phone")} />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="vous@email.com" className="mt-1.5" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Sujet *</Label>
              <Input id="subject" placeholder="Objet de votre demande" className="mt-1.5" {...register("subject")} />
              {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" rows={5} placeholder="Votre message..." className="mt-1.5 resize-none" {...register("message")} />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-emerald-brand text-white hover:bg-emerald-brand/90">
              {submitting ? "Envoi..." : (<><Send className="mr-2 h-4 w-4" /> Envoyer le message</>)}
            </Button>
          </form>
        </Card>

        {/* Info */}
        <div className="space-y-6">
          <Card className="border-border p-7">
            <h2 className="text-lg font-semibold text-navy">Informations de contact</h2>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><MapPin className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-navy">Adresse</p><p className="text-sm text-muted-foreground">{BRAND.address}</p></div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><Phone className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-navy">Téléphone</p><a href={`tel:${BRAND.phoneRaw}`} className="text-sm text-muted-foreground hover:text-red-600">{BRAND.phone}</a></div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><Mail className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-navy">Email</p><a href={`mailto:${BRAND.email}`} className="text-sm text-muted-foreground hover:text-red-600">{BRAND.email}</a></div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-navy">Horaires</p><p className="text-sm text-muted-foreground">{BRAND.hours}</p></div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-5">
              <a href={BRAND.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-navy hover:text-white"><Facebook className="h-4 w-4" /></a>
              <a href={BRAND.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-navy hover:text-white"><Instagram className="h-4 w-4" /></a>
              <a href={BRAND.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-navy hover:text-white"><Linkedin className="h-4 w-4" /></a>
            </div>
          </Card>

          <Card className="overflow-hidden border-border">
            <iframe
              title="Localisation SÉCUREX CONNECT Agadir"
              src={MAPS_EMBED}
              width="100%"
              height="220"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
            <div className="p-4">
              <Button asChild variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer"><Navigation className="mr-2 h-4 w-4" /> Obtenir l'itinéraire</a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
