import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import { sendHelpChatMessage } from "@/lib/chat.functions";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** Cronologia inviata al server per il contesto multi-turno: solo gli ultimi scambi, per limitare i costi. */
const MAX_HISTORY_TURNS = 12;

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm",
          isUser
            ? "bg-gradient-brand text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function HelpChatWidget() {
  const { t, locale } = useI18n();
  const sendMessage = useServerFn(sendHelpChatMessage);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("chat.greeting") }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages.slice(-MAX_HISTORY_TURNS);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      const result = await sendMessage({ data: { message: text, history, locale } });
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err instanceof Error ? err.message : t("chat.error") },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[min(30rem,75vh)] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-gradient-brand px-4 py-3">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Bot className="size-5" />
              <span className="text-sm font-semibold">{t("chat.title")}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi"
              className="rounded-md p-1 text-primary-foreground/90 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>

          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <ChatBubble key={i} message={m} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-secondary px-3.5 py-2 text-sm text-muted-foreground">
                    {t("chat.typing")}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !input.trim()}
                className="shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t("chat.disclaimer")}
            </p>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("chat.openLabel")}
          className="bg-gradient-brand ml-auto flex size-14 items-center justify-center rounded-full text-primary-foreground shadow-xl transition-transform hover:scale-105"
        >
          <MessageCircle className="size-6" />
        </button>
      )}
    </div>
  );
}

/** Nascosto nel back office admin: è un aiuto per abbonati/visitatori, non per lo staff. */
export function HelpChatWidgetGate() {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) return null;
  return <HelpChatWidget />;
}
