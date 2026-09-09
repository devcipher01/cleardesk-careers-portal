export type AssistTopic = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
};

export const LIVE_ASSIST_TOPICS: AssistTopic[] = [
  {
    id: "when-paid",
    title: "When do I get paid?",
    keywords: ["paid", "pay", "payout", "payment", "salary", "friday", "weekly", "when", "money", "earn", "earnings"],
    answer:
      "Eligible earnings are paid weekly on Fridays via Payoneer or bank transfer. A module must be fully submitted and pass review first. Most tasks are reviewed within 48 hours. Incomplete modules and modules below 97% accuracy are not paid.",
  },
  {
    id: "module-not-task",
    title: "Why is payout per module, not per task?",
    keywords: ["module", "task", "individual", "per task", "whole", "entire", "project", "why payment"],
    answer:
      "Payout is released per completed module, not per task. Reviewers score the module as one piece of work so quality stays consistent. Submitting some tasks and skipping others does not create a partial payout.",
  },
  {
    id: "zero-earnings",
    title: "Why do my earnings show ₱0?",
    keywords: ["zero", "peso", "php", "not eligible", "no pay", "nothing", "balance", "under review", "pending", "show 0", "shows 0"],
    answer:
      "Earnings stay at ₱0 when a module is incomplete (not all tasks submitted) or when reviewed accuracy is below 97%. Under review only applies while a full module is still being scored. A few submitted tasks in an unfinished module do not count as money owed.",
  },
  {
    id: "accuracy",
    title: "What is the accuracy standard?",
    keywords: ["accuracy", "97", "percent", "score", "quality", "standard", "below"],
    answer:
      "We expect 97% or higher accuracy. Modules below that are not eligible for payout. Use [inaudible] for unclear audio, label speakers, and do not guess at words, names, or figures. First submissions are reviewed closely.",
  },
  {
    id: "incomplete",
    title: "I did not finish every task. Can I still get paid?",
    keywords: ["incomplete", "finish", "finished", "left", "missed", "skipped", "4 of 6", "remaining", "didn’t complete", "did not complete"],
    answer:
      "No. If the module is incomplete, it is not eligible for payout. Submit every task in the module before the window ends. History of what you did submit still appears on Earnings, but the module total stays ₱0.",
  },
  {
    id: "tasks-gone",
    title: "Why did a module leave Tasks available?",
    keywords: ["disappeared", "gone", "removed", "available", "queue", "missing module", "vanished", "cleared"],
    answer:
      "A module leaves Tasks available when it is fully submitted or the submission window has ended. That is expected. You can still see it on Earnings.",
  },
  {
    id: "inaudible",
    title: "What if I cannot hear part of the audio?",
    keywords: ["hear", "audio", "inaudible", "unclear", "muffled", "guess", "can't hear", "cannot hear", "sound"],
    answer:
      "Type [inaudible] for any section you cannot make out. Never guess at words, drug names, spellings, or numbers. Guessing lowers accuracy and can make the module ineligible for payout.",
  },
  {
    id: "speakers",
    title: "How should I label speakers?",
    keywords: ["speaker", "speakers", "label", "a b", "dialogue", "who is talking"],
    answer:
      "Label multiple speakers as Speaker A, Speaker B, and so on. Keep the same label for the same person throughout the transcript. Do not invent names unless they are clearly spoken.",
  },
  {
    id: "more-time",
    title: "I need more time on a task. What do I do?",
    keywords: ["time", "extension", "deadline", "late", "extra time", "window", "hours", "extend"],
    answer:
      "Ask as early as you can, before the window ends, using the contact form on this page or admin@worknesta.com. Extra time is not guaranteed. Request it at least two hours before a deadline when you can.",
  },
  {
    id: "payment-details",
    title: "How do I add my payment details?",
    keywords: ["payoneer", "bank", "account", "settings", "payment method", "payout details", "gcash"],
    answer:
      "Open Settings in the workspace and add Payoneer or bank transfer. Keep the name and details accurate. We pay eligible earnings on Fridays using what you saved there.",
  },
  {
    id: "cert",
    title: "How do I get a medical transcription certificate?",
    keywords: ["certificate", "cert", "medical", "alison", "coursera", "training", "diploma"],
    answer:
      "Complete a medical transcription course on Alison (https://alison.com/course/diploma-in-medical-transcription) or Coursera, then upload the certificate in Settings. Keep a copy; we may verify it.",
  },
  {
    id: "signin",
    title: "My sign-in link expired or I got logged out.",
    keywords: ["sign in", "signin", "login", "logged out", "expired", "magic", "link", "session", "access"],
    answer:
      "Sign-in links expire. Request a new one from the workspace sign-in page using the same email on your account. Do not forward a link to anyone else. If a link still fails, email admin@worknesta.com.",
  },
  {
    id: "rereview",
    title: "I disagree with my review score. What now?",
    keywords: ["review", "re-review", "rereview", "disagree", "appeal", "wrong score", "unfair"],
    answer:
      "Use the contact form on this page and explain which module and why. Do not resubmit the same task outside the workspace. Re-review is for genuine disputes, not to delay a score that is clearly below 97%.",
  },
  {
    id: "human",
    title: "I need to talk to a person.",
    keywords: ["human", "person", "agent", "someone", "email", "contact", "help me", "staff", "team"],
    answer:
      "Use the contact form on this page. The talent team replies by email within one business day. You can also write admin@worknesta.com. Live assist only answers common questions from a fixed list.",
  },
];

export const LIVE_ASSIST_FALLBACK =
  "I don’t have a premade answer for that. Use the contact form on this page (or email admin@worknesta.com) and the talent team will reply by email. You can also pick one of the topics below.";

export const LIVE_ASSIST_STARTER_IDS = [
  "when-paid",
  "zero-earnings",
  "accuracy",
  "inaudible",
  "payment-details",
  "more-time",
] as const;

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/₦/g, "naira ")
    .replace(/[^a-z0-9%\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTopic(query: string, topic: AssistTopic): number {
  const q = normalize(query);
  if (!q) return 0;
  const title = normalize(topic.title);
  if (q === title) return 100;
  if (title.includes(q) || q.includes(title)) return 80;

  let score = 0;
  for (const kw of topic.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (q.includes(k) || k.includes(q)) {
      score += k.length >= 5 ? 3 : 2;
    }
  }

  const qWords = q.split(" ").filter((w) => w.length > 2);
  const titleWords = new Set(title.split(" ").filter((w) => w.length > 2));
  for (const w of qWords) {
    if (titleWords.has(w)) score += 1;
  }
  return score;
}

export function getAssistTopic(id: string): AssistTopic | undefined {
  return LIVE_ASSIST_TOPICS.find((t) => t.id === id);
}

export function starterTopics(): AssistTopic[] {
  return LIVE_ASSIST_STARTER_IDS.map((id) => getAssistTopic(id)).filter(
    (t): t is AssistTopic => Boolean(t),
  );
}

/** Returns the best topic, or null when the query is too weak to answer. */
export function matchAssistTopic(query: string): AssistTopic | null {
  const q = normalize(query);
  if (q.length < 2) return null;
  let best: AssistTopic | null = null;
  let bestScore = 0;
  for (const topic of LIVE_ASSIST_TOPICS) {
    const s = scoreTopic(q, topic);
    if (s > bestScore) {
      bestScore = s;
      best = topic;
    }
  }
  if (!best || bestScore < 3) return null;
  return best;
}
