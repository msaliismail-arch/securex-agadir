"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Phone, Mail, MapPin, Clock, Navigation, Facebook, Instagram, Linkedin, Send, Loader2, CheckCircle2,
} from "lucide-react";
import { BRAND, MAPS_EMBED, MAPS_LINK } from "@/lib/constants";
import { isValidMaPhone } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/public/reveal";

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
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      toast.success("Message envoyé !", {
        description: `Merci ${data.name.split(" ")[0]}, nous vous répondons sous 24h.`,
      });
      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 6000);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-mesh">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Contact &amp; localisation
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Contactez-nous</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Une question, une demande de renseignement ou une réclamation ? Notre équipe vous
              répond.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <Reveal>
            <Card className="border-border p-7 shadow-soft">
              <h2 className="text-lg font-semibold text-foreground">Envoyez-nous un message</h2>
              <p className="text-sm text-muted-foreground">Nous vous répondons sous 24h.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    className="mt-1.5 focus-visible:ring-primary/40"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      placeholder="+212 6 12 34 56 78"
                      className="mt-1.5 focus-visible:ring-primary/40"
                      aria-invalid={!!errors.phone}
                      {...register("phone")}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@email.com"
                      className="mt-1.5 focus-visible:ring-primary/40"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Sujet *</Label>
                  <Input
                    id="subject"
                    placeholder="Objet de votre demande"
                    className="mt-1.5 focus-visible:ring-primary/40"
                    aria-invalid={!!errors.subject}
                    {...register("subject")}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject.message}</p>}
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Votre message..."
                    className="mt-1.5 resize-none focus-visible:ring-primary/40"
                    aria-invalid={!!errors.message}
                    {...register("message")}
                  />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>}
                </div>

                {submitted && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Votre message a bien été envoyé. Nous vous répondrons rapidement.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-gradient text-white shadow-soft hover:opacity-90 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </Reveal>

          {/* Info */}
          <Reveal delay={0.1}>
            <div className="space-y-6">
              <Card className="border-border p-7 shadow-soft">
                <h2 className="text-lg font-semibold text-foreground">Informations de contact</h2>
                <div className="mt-5 space-y-4">
                  <ContactInfoRow icon={MapPin} title="Adresse">
                    <p className="text-sm text-muted-foreground">{BRAND.address}</p>
                  </ContactInfoRow>
                  <ContactInfoRow icon={Phone} title="Téléphone">
                    <a href={`tel:${BRAND.phoneRaw}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {BRAND.phone}
                    </a>
                  </ContactInfoRow>
                  <ContactInfoRow icon={Mail} title="Email">
                    <a href={`mailto:${BRAND.email}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {BRAND.email}
                    </a>
                  </ContactInfoRow>
                  <ContactInfoRow icon={Clock} title="Horaires">
                    <p className="text-sm text-muted-foreground">{BRAND.hours}</p>
                  </ContactInfoRow>
                </div>
                <div className="mt-6 flex gap-3 border-t border-border pt-5">
                  <SocialLink href={BRAND.social.facebook} label="Facebook" />
                  <SocialLink href={BRAND.social.instagram} label="Instagram" />
                  <SocialLink href={BRAND.social.linkedin} label="LinkedIn" />
                </div>
              </Card>

              <Card className="overflow-hidden border-border shadow-soft">
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
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-2 h-4 w-4" /> Obtenir l'itinéraire
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function ContactInfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {children}
      </div>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-soft transition-all hover:bg-primary hover:text-white hover:shadow-glow"
    >
      {label === "Facebook" && <Facebook className="h-4 w-4" />}
      {label === "Instagram" && <Instagram className="h-4 w-4" />}
      {label === "LinkedIn" && <Linkedin className="h-4 w-4" />}
    </a>
  );
}
