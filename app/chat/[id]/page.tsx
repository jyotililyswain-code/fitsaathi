"use client";

/* eslint-disable @next/next/no-img-element -- social photos and encrypted media are served by the local API */
import { AlertTriangle, ArrowLeft, ImageIcon, Mic, Send, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { useSessionUser } from "@/lib/auth-client";
import { socialApi, socialAsset, type SocialProfile } from "@/lib/social";

type Message = {
  id: string;
  senderId: string;
  sender: { id: string; name: string };
  type: "text" | "image" | "voice" | "workout";
  content?: string | null;
  mediaUrl?: string | null;
  readAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
};

export default function ChatThreadPage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id || "";
  const { user } = useSessionUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<SocialProfile | null>(null);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [thread, conversations] = await Promise.all([
        socialApi<{ messages: Message[]; typing: boolean }>(`/conversations/${id}/messages`),
        socialApi<Array<{ id: string; partner: SocialProfile }>>("/conversations")
      ]);
      setMessages(thread.messages);
      setTyping(thread.typing);
      setPartner(conversations.find((item) => item.id === id)?.partner || null);
      setError("");
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load chat.");
    }
  }, [id]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const content = String(data.get("content") || "").trim();
    const file = data.get("media");
    if (!content && !(file instanceof File && file.size)) return;
    setSending(true);
    try {
      if (file instanceof File && file.size) {
        await socialApi(`/conversations/${id}/messages`, { method: "POST", body: data });
      } else {
        await socialApi(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ type: data.get("type") || "text", content }) });
      }
      form.reset();
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      await socialApi(`/messages/${messageId}`, { method: "DELETE" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not delete message.");
    }
  }

  async function reportConversation() {
    if (!id) return;
    const reason = window.prompt("Tell the safety team what happened:");
    if (!reason) return;
    try {
      await socialApi("/reports", { method: "POST", body: JSON.stringify({ targetId: id, type: "chat", reason }) });
      setError("Report sent to the safety team.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not report this chat.");
    }
  }

  async function emergencyHelp() {
    const message = window.prompt("Describe the emergency or immediate safety concern:");
    if (!message) return;
    try {
      await socialApi("/emergency", { method: "POST", body: JSON.stringify({ message }) });
      setError("Emergency request recorded for admin review.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not record emergency request.");
    }
  }

  return (
    <AuthGuard>
      <main className="mx-auto flex h-[calc(100dvh-84px)] min-h-[28rem] max-w-5xl flex-col px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[.04] p-4">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="rounded-xl border border-white/10 p-2 text-zinc-300"><ArrowLeft className="h-5 w-5" /></Link>
            <div>
              <h1 className="font-bold text-white">{partner?.name || "FitSaathi chat"}</h1>
              <p className="text-xs text-zinc-400">{typing ? "Typing..." : "Mutual connection chat"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={reportConversation} className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 px-3 py-2 text-xs text-amber-200"><ShieldAlert className="h-4 w-4" />Report</button>
            <button onClick={emergencyHelp} className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-3 py-2 text-xs text-red-200"><AlertTriangle className="h-4 w-4" />Emergency</button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm text-zinc-300">{error}</p> : null}
        <section className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="space-y-3">
            {messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${mine ? "bg-acid text-ink" : "bg-white/[.07] text-zinc-100"}`}>
                    <p className="text-xs opacity-70">{mine ? "You" : message.sender.name} · {new Date(message.createdAt).toLocaleTimeString()}</p>
                    {message.deletedAt ? <p className="mt-1 italic opacity-70">Message deleted</p> : null}
                    {!message.deletedAt && message.content ? <p className="mt-1 whitespace-pre-wrap leading-6">{message.content}</p> : null}
                    {!message.deletedAt && message.mediaUrl ? (
                      message.type === "image" ? <img src={socialAsset(message.mediaUrl)} alt="Shared chat media" className="mt-2 max-h-80 rounded-xl object-contain" /> : <a href={socialAsset(message.mediaUrl)} className="mt-2 inline-flex items-center gap-2 underline"><Mic className="h-4 w-4" />Open {message.type}</a>
                    ) : null}
                    {mine && !message.deletedAt ? <button onClick={() => deleteMessage(message.id)} className="mt-2 inline-flex items-center gap-1 text-xs opacity-70"><Trash2 className="h-3 w-3" />Delete</button> : null}
                  </div>
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </section>

        <form onSubmit={send} className="mt-4 rounded-3xl border border-white/10 bg-white/[.04] p-3">
          <div className="grid gap-2 sm:grid-cols-[150px_1fr_auto_auto]">
            <select name="type" className="field">
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="voice">Voice note</option>
              <option value="workout">Workout share</option>
            </select>
            <input name="content" onChange={() => socialApi(`/conversations/${id}/typing`, { method: "POST" }).catch(() => undefined)} placeholder="Write a safe message..." className="field" />
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/10 px-4 text-zinc-300">
              <ImageIcon className="h-5 w-5" />
              <input name="media" type="file" accept="image/*,audio/*,video/*" className="sr-only" />
            </label>
            <button disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-acid px-5 font-bold text-ink">
              <Send className="h-4 w-4" />{sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </main>
    </AuthGuard>
  );
}
