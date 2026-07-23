/**
 * SÉCUREX CONNECT — Base de connaissances du chatbot (100% gratuite, sans API).
 *
 * Le chatbot répond côté client à partir de ces données. Aucun service externe,
 * aucune clé API, aucun coût. Il fait correspondre le message de l'utilisateur à
 * une intention via des mots-clés (normalisés, sans accents) et renvoie la réponse.
 */

import { BRAND } from "@/lib/constants";
import { formatMAD } from "@/lib/utils";

/** Un type de réponse « riche » : texte + éventuel lien d'action. */
export interface BotAnswer {
  /** Texte de la réponse (peut contenir des retours à la ligne \n). */
  text: string;
  /** Lien interne optionnel proposé sous la réponse. */
  action?: { label: string; href: string };
}

/** Une intention = un ensemble de mots-clés déclencheurs + une réponse. */
interface Intent {
  id: string;
  /** Mots-clés (déjà en minuscules, sans accents). Un seul suffit à matcher. */
  keywords: string[];
  answer: BotAnswer;
}

/* ------------------------------------------------------------------ */
/* Données tarifaires (miroir de prisma/seed.ts)                       */
/* ------------------------------------------------------------------ */

const PRICES = {
  voiture: [
    { name: "Visite Technique Périodique", price: 350, duree: 30 },
    { name: "Contre-visite", price: 100, duree: 20 },
    { name: "Visite de cession", price: 400, duree: 30 },
  ],
  utilitaire: [
    { name: "Visite Technique Utilitaire", price: 450, duree: 40 },
    { name: "Contre-visite Utilitaire", price: 120, duree: 25 },
  ],
  moto: [
    { name: "Visite Technique Moto", price: 200, duree: 20 },
    { name: "Contre-visite Moto", price: 70, duree: 15 },
  ],
  poidsLourd: [
    { name: "Visite Technique Poids Lourd", price: 800, duree: 60 },
    { name: "Visite Technique Bus", price: 900, duree: 60 },
  ],
};

function tarifsText(): string {
  const line = (l: { name: string; price: number }) =>
    `• ${l.name} : ${formatMAD(l.price)}`;
  return [
    "Voici nos principaux tarifs :",
    "",
    "🚗 Voiture particulière",
    ...PRICES.voiture.map(line),
    "",
    "🚚 Véhicule utilitaire",
    ...PRICES.utilitaire.map(line),
    "",
    "🏍️ Moto & deux-roues",
    ...PRICES.moto.map(line),
    "",
    "🚌 Poids lourd & bus",
    ...PRICES.poidsLourd.map(line),
    "",
    "Les prix sont indicatifs ; un devis détaillé peut vous être remis sur place.",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Normalisation du texte (minuscules + suppression des accents)       */
/* ------------------------------------------------------------------ */

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .replace(/[^a-z0-9\s]/g, " ") // retire la ponctuation
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Intentions                                                          */
/* ------------------------------------------------------------------ */

const INTENTS: Intent[] = [
  {
    id: "salutation",
    keywords: ["bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "cc", "slm", "salam", "ahlan"],
    answer: {
      text: `Bonjour et bienvenue chez ${BRAND.name} ! 👋 Je suis votre assistant virtuel. Je peux vous renseigner sur les tarifs, les horaires, les documents à apporter, la prise de rendez-vous, la contre-visite, et plus encore. Que puis-je faire pour vous ?`,
    },
  },
  {
    id: "tarifs",
    keywords: ["tarif", "prix", "cout", "coute", "combien", "cher", "payer", "montant", "devis", "mad", "dirham", "budget"],
    answer: {
      text: tarifsText(),
      action: { label: "Voir tous les tarifs", href: "/tarifs" },
    },
  },
  {
    id: "rendez-vous",
    keywords: ["rendez", "rdv", "reserver", "reservation", "booking", "prendre", "creneau", "reserve", "planifier"],
    answer: {
      text:
        "Pour prendre rendez-vous en ligne, c'est simple et en 4 étapes :\n" +
        "1. Choisissez le type de véhicule\n" +
        "2. Sélectionnez le service souhaité\n" +
        "3. Choisissez une date et un créneau horaire\n" +
        "4. Renseignez vos informations et confirmez\n\n" +
        "Vous recevrez un code de référence à 6 caractères à présenter le jour du contrôle.",
      action: { label: "Prendre rendez-vous", href: "/rendez-vous" },
    },
  },
  {
    id: "documents",
    keywords: ["document", "papier", "apporter", "carte grise", "assurance", "cin", "identite", "besoin", "necessaire", "dois-je apporter", "amener"],
    answer: {
      text:
        "Documents à apporter le jour du contrôle :\n" +
        "• La carte grise originale en cours de validité\n" +
        "• L'attestation d'assurance en cours de validité\n" +
        "• La carte d'identité nationale (CIN) du propriétaire\n\n" +
        "Pour une contre-visite, ajoutez le procès-verbal de la visite précédente. " +
        "Si le véhicule n'est pas à votre nom, prévoyez une procuration signée + copie de la CIN du propriétaire.",
      action: { label: "Voir la page Documents", href: "/documents" },
    },
  },
  {
    id: "horaires",
    keywords: ["horaire", "heure", "ouvert", "ouverture", "ferme", "fermeture", "quand", "dimanche", "samedi", "jour"],
    answer: {
      text:
        `Nos horaires d'ouverture :\n${BRAND.hours}\n\n` +
        "• Lundi à vendredi : 08h00 – 16h00\n" +
        "• Samedi : 08h00 – 12h00\n" +
        "• Dimanche : fermé",
    },
  },
  {
    id: "adresse",
    keywords: ["adresse", "ou", "situe", "localisation", "trouver", "acces", "venir", "maps", "plan", "agadir", "situ"],
    answer: {
      text: `Nous sommes situés à :\n${BRAND.address}\n\nVille : ${BRAND.city}.`,
      action: { label: "Nous localiser & contact", href: "/contact" },
    },
  },
  {
    id: "contact",
    keywords: ["contact", "telephone", "numero", "appeler", "joindre", "email", "mail", "whatsapp", "tel"],
    answer: {
      text:
        "Vous pouvez nous contacter :\n" +
        `• Téléphone : ${BRAND.phone}\n` +
        `• Email : ${BRAND.email}\n\n` +
        "Notre équipe est à votre écoute pendant les heures d'ouverture.",
      action: { label: "Page contact", href: "/contact" },
    },
  },
  {
    id: "frequence",
    keywords: ["frequence", "tous les ans", "souvent", "combien de fois", "periodicite", "renouveler", "renouvellement", "chaque annee", "obligatoire quand"],
    answer: {
      text:
        "La fréquence du contrôle technique au Maroc :\n" +
        "• Tous les ans pour les véhicules de moins de 10 ans\n" +
        "• Tous les 6 mois pour les véhicules de plus de 10 ans\n\n" +
        "La première visite doit avoir lieu dans l'année suivant la première mise en circulation.",
    },
  },
  {
    id: "duree",
    keywords: ["duree", "temps", "combien de temps", "long", "dure", "minutes", "rapide"],
    answer: {
      text:
        "Un contrôle technique complet dure en moyenne 30 minutes. " +
        "Prévoyez environ 45 minutes au total entre l'accueil, le contrôle et la remise du certificat.",
    },
  },
  {
    id: "contre-visite",
    keywords: ["contre visite", "contre-visite", "contrevisite", "rate", "echoue", "refuse", "recale", "defaut", "reparation", "repasser", "pas passe"],
    answer: {
      text:
        "La contre-visite est une re-vérification après réparation des défauts détectés lors du contrôle initial.\n\n" +
        "• Voiture particulière : 100 MAD\n" +
        "• Délai : à effectuer dans les 2 mois\n\n" +
        "Sans contre-visite dans ce délai, une nouvelle visite complète sera nécessaire. " +
        "Un procès-verbal de non-conformité vous est remis en cas de défauts.",
    },
  },
  {
    id: "certificat",
    keywords: ["certificat", "attestation", "valable", "validite", "resultat", "vignette", "proces verbal"],
    answer: {
      text:
        "Dès que le contrôle est validé par notre équipe, le certificat officiel vous est remis immédiatement. " +
        "Il est valable jusqu'à la prochaine échéance (1 an ou 6 mois selon l'âge du véhicule). " +
        "Si vous avez un compte client, vous pouvez aussi le télécharger depuis votre espace.",
      action: { label: "Espace client", href: "/espace-client" },
    },
  },
  {
    id: "paiement",
    keywords: ["paiement", "payer", "espece", "carte", "virement", "tpe", "moyens de paiement", "regler", "cash"],
    answer: {
      text:
        "Moyens de paiement acceptés : espèces, carte bancaire (TPE) et virement. " +
        "Le règlement s'effectue après la réalisation du contrôle technique.",
    },
  },
  {
    id: "cession",
    keywords: ["cession", "vendre", "vente", "acheter", "achat", "revendre", "mutation"],
    answer: {
      text:
        "Pour la vente d'un véhicule, une visite de cession peut être exigée. " +
        "Nous proposons ce service (400 MAD pour une voiture particulière) qui certifie l'état du véhicule au moment de la vente.",
      action: { label: "Prendre rendez-vous", href: "/rendez-vous" },
    },
  },
  {
    id: "espace-client",
    keywords: ["espace client", "compte", "connexion", "connecter", "mon compte", "login", "se connecter", "otp", "rappel"],
    answer: {
      text:
        "Avec un compte client, vous vous connectez par téléphone + code OTP. Vous pouvez y suivre vos rendez-vous, " +
        "retrouver votre code de référence, télécharger vos certificats et recevoir un rappel 30 jours avant l'expiration " +
        "de votre contrôle (par SMS, email ou WhatsApp).",
      action: { label: "Accéder à l'espace client", href: "/espace-client" },
    },
  },
  {
    id: "merci",
    keywords: ["merci", "thanks", "parfait", "super", "genial", "cool", "top", "shukran"],
    answer: {
      text: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions. Bonne route !",
    },
  },
  {
    id: "aurevoir",
    keywords: ["au revoir", "bye", "aurevoir", "ciao", "a bientot", "salut a"],
    answer: {
      text: `Merci de votre visite et à bientôt chez ${BRAND.name} ! 👋`,
    },
  },
];

/** Réponse par défaut quand aucune intention ne correspond. */
const FALLBACK: BotAnswer = {
  text:
    "Je ne suis pas sûr d'avoir bien compris 🤔. Je peux vous aider sur : les tarifs, les horaires, " +
    "les documents à apporter, la prise de rendez-vous, la contre-visite, le certificat, ou le paiement. " +
    "Pour une question spécifique, notre équipe reste joignable.",
  action: { label: "Nous contacter", href: "/contact" },
};

/** Questions suggérées affichées dans le widget. */
export const SUGGESTED_QUESTIONS = [
  "Quels sont vos tarifs ?",
  "Quels documents dois-je apporter ?",
  "Quels sont vos horaires ?",
  "Comment prendre rendez-vous ?",
  "C'est quoi une contre-visite ?",
];

/* ------------------------------------------------------------------ */
/* Base de connaissances pour l'IA (Groq)                              */
/* ------------------------------------------------------------------ */

/** FAQ de référence — sert à nourrir le contexte de l'IA. */
export const FAQ_ENTRIES: { q: string; a: string }[] = [
  { q: "À quelle fréquence dois-je passer le contrôle technique au Maroc ?", a: "Tous les ans pour les véhicules de moins de 10 ans, et tous les 6 mois pour ceux de plus de 10 ans. La première visite doit avoir lieu dans l'année suivant la première mise en circulation." },
  { q: "Combien de temps dure un contrôle technique ?", a: "En moyenne 30 minutes. Prévoyez environ 45 minutes au total (accueil, contrôle, remise du certificat)." },
  { q: "Quels documents dois-je apporter ?", a: "La carte grise originale en cours de validité, l'attestation d'assurance en cours de validité, et la carte d'identité nationale (CIN) du propriétaire. Pour une contre-visite, ajoutez le procès-verbal précédent." },
  { q: "Qu'est-ce qu'une contre-visite et combien coûte-t-elle ?", a: "Une re-vérification après réparation des défauts. 100 MAD pour une voiture particulière, à effectuer dans un délai de 2 mois." },
  { q: "Que se passe-t-il si mon véhicule ne passe pas le contrôle ?", a: "Un procès-verbal de non-conformité vous est remis. Vous avez 2 mois pour réparer et passer la contre-visite, sinon une nouvelle visite complète est nécessaire." },
  { q: "Le certificat est-il valable immédiatement ?", a: "Oui, dès validation par l'équipe. Il est valable jusqu'à la prochaine échéance (1 an ou 6 mois selon l'âge du véhicule)." },
  { q: "Puis-je passer le contrôle avec un véhicule qui n'est pas à mon nom ?", a: "Oui, avec une procuration signée par le propriétaire et une copie de sa CIN, en plus des documents habituels." },
  { q: "Comment prendre rendez-vous en ligne ?", a: "Sur la page Rendez-vous : choisissez le type de véhicule, le service, la date et le créneau, puis renseignez vos informations. Vous recevez un code de référence à 6 caractères." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Espèces, carte bancaire (TPE) et virement. Le règlement se fait après le contrôle." },
  { q: "Le contrôle est-il obligatoire pour vendre mon véhicule ?", a: "Une visite de cession peut être exigée lors de la vente. Nous la proposons (400 MAD pour une voiture particulière)." },
  { q: "Reçois-je un rappel avant l'expiration ?", a: "Oui, si vous avez un compte client : un rappel par SMS, email ou WhatsApp 30 jours avant l'expiration." },
];

/** Étapes de prise de rendez-vous. */
const BOOKING_STEPS =
  "Prise de rendez-vous (4 étapes) : 1) type de véhicule, 2) service souhaité, " +
  "3) date et créneau, 4) informations client + confirmation. Un code de référence à 6 caractères est ensuite fourni.";

/**
 * Construit le bloc de connaissances (texte) injecté dans le prompt système de l'IA.
 * @param liveTarifs texte des tarifs à jour (récupéré côté serveur depuis la base). Si absent, utilise les tarifs par défaut.
 */
export function buildKnowledgeBase(liveTarifs?: string): string {
  return [
    `NOM : ${BRAND.name} — ${BRAND.tagline}.`,
    `ADRESSE : ${BRAND.address} (ville : ${BRAND.city}).`,
    `TÉLÉPHONE : ${BRAND.phone} · EMAIL : ${BRAND.email}.`,
    `HORAIRES : ${BRAND.hours} (Lun–Ven 08:00–16:00 · Sam 08:00–12:00 · Dim fermé).`,
    "",
    "TARIFS (en MAD / dirham) :",
    liveTarifs && liveTarifs.trim() ? liveTarifs : tarifsText(),
    "",
    BOOKING_STEPS,
    "",
    "DOCUMENTS À APPORTER : carte grise originale valide, attestation d'assurance valide, CIN du propriétaire. " +
      "Contre-visite : ajouter le procès-verbal précédent. Véhicule au nom d'un tiers : procuration signée + copie CIN du propriétaire.",
    "",
    "MOYENS DE PAIEMENT : espèces, carte bancaire (TPE), virement — après le contrôle.",
    "",
    "FAQ :",
    ...FAQ_ENTRIES.map((f) => `Q: ${f.q}\nR: ${f.a}`),
  ].join("\n");
}

/**
 * Trouve la meilleure réponse pour un message donné.
 * Score = nombre de mots-clés correspondants (le plus élevé gagne).
 */
export function getBotAnswer(message: string): BotAnswer {
  const text = normalize(message);
  if (!text) return FALLBACK;

  let best: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      const k = normalize(kw);
      if (!k) continue;
      // mot-clé multi-mots => recherche de sous-chaîne ; mot simple => limite de mot
      if (k.includes(" ")) {
        if (text.includes(k)) score += 2;
      } else {
        // tolère les pluriels/féminins français courants (tarif→tarifs, document→documents)
        const re = new RegExp(`(^|\\s)${k}(s|es|x)?(\\s|$)`);
        if (re.test(text)) score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { intent, score };
    }
  }

  return best ? best.intent.answer : FALLBACK;
}
