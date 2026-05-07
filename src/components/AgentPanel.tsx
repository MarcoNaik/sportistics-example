import { useEffect, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";

const SUGGESTIONS = [
  "Who scored the most points?",
  "Top scorers",
  "Which players are reporting pain?",
];

function EmptyState() {
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
            disabled
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 opacity-60 cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBody() {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <EmptyState />
      </div>
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <input
            disabled
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          />
          <button
            type="button"
            disabled
            aria-label="Send"
            className="inline-flex items-center justify-center rounded-lg bg-brand text-white p-2 opacity-60 cursor-not-allowed min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function AgentPanel() {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <aside
        aria-label="Assistant"
        className="hidden lg:flex fixed top-4 right-4 bottom-4 w-96 z-30 rounded-2xl bg-white/95 backdrop-blur shadow-lg shadow-slate-200/60 flex-col overflow-hidden"
      >
        <header className="h-14 px-4 flex items-center gap-3 border-b border-slate-200">
          <Sparkles className="size-5 text-brand" />
          <span className="font-bold">Assistant</span>
          <span className="ml-auto rounded-full bg-brand-50 text-brand px-2 py-0.5 text-xs font-medium">
            Coming soon
          </span>
        </header>
        <ChatBody />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
        className={`lg:hidden fixed bottom-6 right-6 z-50 size-14 rounded-full bg-brand text-white shadow-lg shadow-brand/30 flex items-center justify-center hover:bg-brand-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          open ? "hidden" : ""
        }`}
      >
        <Sparkles className="size-6" />
      </button>

      <div
        role="dialog"
        aria-label="Assistant"
        className={`lg:hidden fixed bottom-6 right-4 left-4 md:right-6 md:left-auto z-50 w-auto md:w-96 h-[600px] max-h-[calc(100vh-4rem)] origin-bottom-right rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        }`}
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
        <ChatBody />
      </div>
    </>
  );
}
