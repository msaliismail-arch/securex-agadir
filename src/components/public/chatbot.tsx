"use client";

/**
 * SÉCUREX CONNECT — Chatbot flottant (assistant virtuel).
 *
 * 100% gratuit : les réponses sont générées côté client à partir de la base de
 * connaissances (src/lib/chatbot-knowledge.ts). Aucune clé API, aucun coût.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Bot, MessageCircle, Send, X, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  getBotAnswer,
  SUGGESTED_QUESTIONS,
  type BotAnswer,
} from "@/lib/chatbot-knowledge";

interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text: string;
  action?: BotAnswer["action"];
}

let msgId = 0;
const nextId = () => ++msgId;

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      from: "bot",
      text: `Bonjour 👋 Je suis l'assistant virtuel de ${BRAND.name}. Posez-moi votre question sur le contrôle technique, les tarifs, les horaires ou la prise de rendez-vous — en français, arabe ou anglais !`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Focus l'input à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || typing) return;

    // Historique envoyé à l'IA (rôles OpenAI), en excluant le message d'accueil
    const history = messages
      .filter((m) => m.text.trim().length > 0)
      .map((m) => ({ role: m.from === "bot" ? "assistant" : "user", content: m.text }));

    setMessages((m) => [...m, { id: nextId(), from: "user", text: clean }]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: clean }].slice(-12),
        }),
      });
      const data = await res.json().catch(() => null);
      const reply: string =
        (data && typeof data.reply === "string" && data.reply) ||
        // secours local si la réponse est vide/inattendue
        getBotAnswer(clean).text;
      const action = data?.action ?? undefined;
      setMessages((m) => [...m, { id: nextId(), from: "bot", text: reply, action }]);
    } catch {
      // secours 100% hors-ligne : l'assistant à règles
      const answer = getBotAnswer(clean);
      setMessages((m) => [
        ...m,
        { id: nextId(), from: "bot", text: answer.text, action: answer.action },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        type="button"
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant virtuel"}
        onClick={() => setOpen((o) => !o)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-glow",
          "bg-primary transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Pastille de notification */}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
        )}
      </motion.button>

      {/* Fenêtre de discussion */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className={cn(
              "fixed bottom-24 right-5 z-[60] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-float",
              "h-[min(30rem,70vh)]"
            )}
            role="dialog"
            aria-label="Assistant virtuel SÉCUREX CONNECT"
          >
            {/* En-tête */}
            <div className="flex items-center gap-3 bg-brand-gradient px-4 py-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">Assistant SÉCUREX</p>
                <p className="flex items-center gap-1.5 text-xs text-white/85">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
                  En ligne · FR · AR · EN
                </p>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3.5 py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft",
                      m.from === "user"
                        ? "rounded-br-md bg-primary text-white"
                        : "rounded-bl-md border border-border bg-background text-foreground"
                    )}
                  >
                    <p dir="auto" className="whitespace-pre-line">{m.text}</p>
                    {m.action && (
                      <Link
                        href={m.action.href}
                        onClick={() => setOpen(false)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                      >
                        {m.action.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicateur de saisie */}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 shadow-soft">
                    {[0, 0.15, 0.3].map((d) => (
                      <motion.span
                        key={d}
                        className="h-2 w-2 rounded-full bg-muted-foreground/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions (uniquement au début) */}
              {messages.length <= 1 && !typing && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Saisie */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-border bg-background px-3 py-2.5"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre message…"
                className="flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background"
                maxLength={300}
              />
              <button
                type="submit"
                aria-label="Envoyer"
                disabled={!input.trim() || typing}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
