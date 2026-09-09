import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Send, X } from "lucide-react";
import {
  type AssistTopic,
  LIVE_ASSIST_FALLBACK,
  matchAssistTopic,
  starterTopics,
} from "@/lib/liveAssist";

type ChatLine = { id: string; from: "bot" | "user"; text: string };

const WELCOME =
  "Hi — I’m Live assist. I answer common workspace questions from a fixed list. Pick a topic or type a question. For anything else, use the contact form on this page.";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LiveAssistButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 sm:text-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
      </span>
      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      Live assist
    </button>
  );
}

export function LiveAssistPanel({
  open,
  onClose,
  onAskHuman,
}: {
  open: boolean;
  onClose: () => void;
  onAskHuman: () => void;
}) {
  const [lines, setLines] = useState<ChatLine[]>([{ id: "welcome", from: "bot", text: WELCOME }]);
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [lines, open]);

  function pushBot(text: string) {
    setLines((prev) => [...prev, { id: newId(), from: "bot", text }]);
  }

  function answerTopic(topic: AssistTopic) {
    setLines((prev) => [
      ...prev,
      { id: newId(), from: "user", text: topic.title },
      { id: newId(), from: "bot", text: topic.answer },
    ]);
  }

  function submitDraft(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setDraft("");
    const topic = matchAssistTopic(text);
    if (topic) {
      setLines((prev) => [
        ...prev,
        { id: newId(), from: "user", text },
        { id: newId(), from: "bot", text: topic.answer },
      ]);
      return;
    }
    setLines((prev) => [
      ...prev,
      { id: newId(), from: "user", text },
      { id: newId(), from: "bot", text: LIVE_ASSIST_FALLBACK },
    ]);
  }

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const chips = starterTopics();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-end sm:p-6">
      <button
        type="button"
        aria-label="Close live assist"
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
      />
      <div className="relative flex h-[min(34rem,88vh)] w-full flex-col rounded-t-3xl border border-gray-200 bg-white shadow-2xl sm:h-[36rem] sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Live assist</p>
              <p className="text-[11px] text-gray-500">Premade answers · not a person</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {lines.map((line) => (
            <div key={line.id} className={`flex ${line.from === "user" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  line.from === "user"
                    ? "bg-ink text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {line.text}
              </p>
            </div>
          ))}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {chips.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => answerTopic(topic)}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              >
                {topic.title}
              </button>
            ))}
            <button
              type="button"
              onClick={onAskHuman}
              className="rounded-full border border-ink/15 bg-cream px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-ink/5"
            >
              Talk to a person
            </button>
          </div>
        </div>

        <form
          className="flex items-center gap-2 border-t border-gray-200 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submitDraft(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a question…"
            className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-lime/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/20"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
