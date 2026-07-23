import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatMAD } from "@/lib/utils";
import { buildKnowledgeBase, getBotAnswer } from "@/lib/chatbot-knowledge";

/**
 * SÉCUREX CONNECT — Assistant IA du site (Groq, gratuit).
 *
 * - Récupère les tarifs EN DIRECT depuis la base (toujours à jour).
 * - Construit un prompt système ancré sur les données réelles du site.
 * - Répond dans la langue du client (français / arabe / anglais).
 * - Si la clé GROQ_API_KEY est absente ou l'appel échoue, retombe
 *   automatiquement sur l'assistant à règles (le site ne casse jamais).
 */

export const runtime = "nodejs";

type ChatRole = "user" | "assistant";
interface ChatMsg {
  role: ChatRole;
  content: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Modèle Groq actuellement supporté (les anciens Llama 3.x sont en fin de vie).
// Modifiable sans toucher au code via la variable d'environnement GROQ_MODEL.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/** Récupère les tarifs à jour depuis la base et les met en forme. */
async function getLiveTarifs(): Promise<string> {
  try {
    const categories = await db.category.findMany({
      orderBy: { sort: "asc" },
      include: { services: { where: { active: true }, orderBy: { price: "asc" } } },
    });
    const lines: string[] = [];
    for (const cat of categories) {
      if (!cat.services.length) continue;
      lines.push(`${cat.name} :`);
      for (const s of cat.services) {
        lines.push(`  - ${s.name} : ${formatMAD(s.price)} (durée ~${s.durationMin} min)`);
      }
    }
    return lines.join("\n");
  } catch {
    return ""; // en cas d'erreur DB, buildKnowledgeBase utilisera les tarifs par défaut
  }
}

function buildSystemPrompt(knowledge: string): string {
  return [
    "Tu es l'assistant virtuel officiel de SÉCUREX CONNECT, un centre de contrôle technique automobile agréé à Agadir, au Maroc.",
    "",
    "RÈGLES IMPORTANTES :",
    "- Réponds UNIQUEMENT à partir des INFORMATIONS ci-dessous. N'invente jamais un prix, une date, une horaire ou un fait.",
    "- Si l'information demandée n'y figure pas, dis-le poliment et invite le client à contacter le centre (téléphone ou email ci-dessous).",
    "- Détecte la langue du dernier message du client et réponds DANS LA MÊME LANGUE. Tu dois gérer le français, l'arabe (y compris le darija marocain) et l'anglais.",
    "- Sois chaleureux, professionnel et CONCIS. Phrases courtes. Pas de longs paragraphes.",
    "- Pour les tarifs, donne exactement les montants en MAD (dirham) indiqués.",
    "- Quand c'est pertinent, encourage le client à prendre rendez-vous en ligne (page « Rendez-vous »).",
    "- Reste strictement sur le sujet du centre et du contrôle technique. Ne réponds pas à des sujets sans rapport.",
    "",
    "===== INFORMATIONS DU CENTRE =====",
    knowledge,
    "==================================",
  ].join("\n");
}

export async function POST(req: Request) {
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) {
      messages = body.messages
        .filter((m: ChatMsg) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12); // garde les 12 derniers tours
    }
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  // Base de connaissances avec tarifs en direct
  const liveTarifs = await getLiveTarifs();
  const knowledge = buildKnowledgeBase(liveTarifs);

  // Pas de clé → mode à règles (secours), le site continue de fonctionner
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const fallback = getBotAnswer(lastUser);
    return NextResponse.json({ reply: fallback.text, action: fallback.action, source: "rules" });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 700,
        messages: [{ role: "system", content: buildSystemPrompt(knowledge) }, ...messages],
      }),
      // évite de bloquer trop longtemps
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Groq error", res.status, detail);
      const fallback = getBotAnswer(lastUser);
      return NextResponse.json({ reply: fallback.text, action: fallback.action, source: "rules" });
    }

    const data = await res.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) {
      const fallback = getBotAnswer(lastUser);
      return NextResponse.json({ reply: fallback.text, action: fallback.action, source: "rules" });
    }
    return NextResponse.json({ reply, source: "ai" });
  } catch (err) {
    console.error("Chatbot route error", err);
    const fallback = getBotAnswer(lastUser);
    return NextResponse.json({ reply: fallback.text, action: fallback.action, source: "rules" });
  }
}
