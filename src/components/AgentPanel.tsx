import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sparkles, X, Send } from "lucide-react";
import clsx from "clsx";
import { chat } from "../lib/struere";

const SUGGESTIONS = [
  "Who scored the most points?",
  "Top scorers",
  "Which players are reporting pain?",
];

const AGENT_SLUG = "coach-stats";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
};

type ChatBodyProps = {
  messages: Message[];
  input: string;
  pending: boolean;
  error: string | null;
  threadId: string | undefined;
  setInput: (value: string) => void;
  send: (text: string) => Promise<void>;
};

function EmptyState({
  pending,
  onSuggest,
}: {
  pending: boolean;
  onSuggest: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 h-full px-4">
      <Sparkles className="size-10 text-brand" />
      <h2 className="text-lg font-semibold text-slate-900">Assistant</h2>
      <p className="text-sm text-slate-600">
        Ask your agent about your team, matches, and stats.
      </p>
      <p className="text-xs uppercase tracking-wide text-slate-500 mt-4">Suggestions</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={pending}
            onClick={() => onSuggest(suggestion)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBody({ messages, input, pending, error, setInput, send }: ChatBodyProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, pending]);

  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    setInput("");
    await send(trimmed);
  }

  return (
    <>
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState pending={pending} onSuggest={(text) => send(text)} />
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={clsx(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                    msg.role === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-900 rounded-bl-sm",
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-sm px-3 py-2 text-sm italic">
                  thinking…
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-slate-200 p-3">
        {error && (
          <div className="mb-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={pending}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={pending || input.trim().length === 0}
              aria-label="Send"
              className="inline-flex items-center justify-center rounded-lg bg-brand text-white p-2 min-h-11 min-w-11 hover:bg-brand-900 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function AgentPanel() {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);
    setError(null);
    try {
      const response = await chat({
        agentSlug: AGENT_SLUG,
        message: trimmed,
        threadId,
      });
      setThreadId(response.threadId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "agent", text: response.message },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error contacting the assistant");
    } finally {
      setPending(false);
    }
  }

  const bodyProps: ChatBodyProps = {
    messages,
    input,
    pending,
    error,
    threadId,
    setInput,
    send,
  };

  return (
    <>
      <aside
        aria-label="Assistant"
        className="hidden lg:flex fixed top-4 right-4 bottom-4 w-96 z-30 rounded-2xl bg-white/95 backdrop-blur shadow-lg shadow-slate-200/60 flex-col overflow-hidden"
      >
        <header className="h-14 px-4 flex items-center gap-3 border-b border-slate-200">
          <Sparkles className="size-5 text-brand" />
          <span className="font-bold">Assistant</span>
        </header>
        <ChatBody {...bodyProps} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
        className={clsx(
          "lg:hidden fixed bottom-6 right-6 z-50 size-14 rounded-full bg-brand text-white shadow-lg shadow-brand/30 flex items-center justify-center hover:bg-brand-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          open && "hidden",
        )}
      >
        <Sparkles className="size-6" />
      </button>

      <div
        role="dialog"
        aria-label="Assistant"
        className={clsx(
          "lg:hidden fixed bottom-6 right-4 left-4 md:right-6 md:left-auto z-50 w-auto md:w-96 h-[600px] max-h-[calc(100vh-4rem)] origin-bottom-right rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200">
          <div className="inline-flex items-center gap-2">
            <Sparkles className="size-5 text-brand" />
            <span className="font-bold">Assistant</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-slate-100 transition-colors duration-200 min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <X className="size-5" />
          </button>
        </header>
        <ChatBody {...bodyProps} />
      </div>
    </>
  );
}
