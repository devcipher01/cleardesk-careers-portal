export const VDE_TOKEN_REGEX = /^VDE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const NETVERIFY_REGISTRAR_URL = "https://registrar.netverify-express.io";

export const WORKSPACE_PASS_PERCENT = 60;

/** Minimum score shown to candidates in emails and workspace UI. */
export const SKILLS_SCORE_DISPLAY_FLOOR = 50;

export function displaySkillsScore(actualPercent: number): number {
  return Math.max(SKILLS_SCORE_DISPLAY_FLOOR, Math.round(actualPercent));
}

/** Normalize legacy role titles for workspace UI and emails. */
export function displayRoleTitle(title: string): string {
  const t = title.trim();
  if (!t) return "Remote Transcription Specialist";
  if (/transcription validator|ai content/i.test(t)) return "Remote Transcription Specialist";
  return t;
}

export const PIPELINE_SESSION_KEY = "wn_application_id";

export type SkillsQuizOption = {
  id: string;
  label: string;
  correct?: boolean;
};

export type SkillsQuizQuestion = {
  id: string;
  question: string;
  options: SkillsQuizOption[];
};

const AI_VALIDATOR_QUIZ: SkillsQuizQuestion[] = [
  {
    id: "ai-priority",
    question: "When reviewing AI-generated copy for a client, what should you check first?",
    options: [
      { id: "a", label: "Factual accuracy and meaning before grammar tweaks", correct: true },
      { id: "b", label: "Whether the text is long enough to bill more time" },
      { id: "c", label: "If you can approve without reading the source context" },
      { id: "d", label: "Only the font and formatting" },
    ],
  },
  {
    id: "ai-transcript",
    question: "A machine transcript spells a client's product name incorrectly. You should:",
    options: [
      { id: "a", label: "Re-listen and correct it using the client style guide", correct: true },
      { id: "b", label: "Leave the machine spelling to save time" },
      { id: "c", label: "Delete the entire paragraph" },
      { id: "d", label: "Replace it with a generic term" },
    ],
  },
  {
    id: "ai-datasheet",
    question: "Two columns in an AI-extracted data sheet disagree on the same value. Best action?",
    options: [
      { id: "a", label: "Flag the row and apply the documented validation rule", correct: true },
      { id: "b", label: "Pick whichever value appears first" },
      { id: "c", label: "Clear both cells and move on" },
      { id: "d", label: "Submit without logging the conflict" },
    ],
  },
  {
    id: "ai-ambiguity",
    question: "You are unsure whether an AI summary changes the original meaning. You should:",
    options: [
      { id: "a", label: "Escalate or compare against source material before approving", correct: true },
      { id: "b", label: "Approve quickly to keep queue velocity high" },
      { id: "c", label: "Rewrite randomly until it sounds fluent" },
      { id: "d", label: "Skip the task entirely" },
    ],
  },
  {
    id: "ai-confidential",
    question: "Handling confidential AI training or client review materials means:",
    options: [
      { id: "a", label: "Working only in approved tools and never sharing exports", correct: true },
      { id: "b", label: "Saving samples to personal cloud drives for reference" },
      { id: "c", label: "Discussing tricky cases in public freelancer forums" },
      { id: "d", label: "Forwarding files to a friend for a second opinion" },
    ],
  },
  {
    id: "ai-pace",
    question: "You are behind on a validator queue with a fixed deadline. Best approach?",
    options: [
      { id: "a", label: "Keep accuracy standards and notify your lead if at risk", correct: true },
      { id: "b", label: "Approve batches without reading to catch up" },
      { id: "c", label: "Ignore the style guide for this shift" },
      { id: "d", label: "Close tasks without submitting" },
    ],
  },
];

const MEDICAL_TRANSCRIPTION_QUIZ: SkillsQuizQuestion[] = [
  {
    id: "med-accuracy",
    question: "A dictated medication dosage in a transcript looks unusual. You should:",
    options: [
      { id: "a", label: "Replay the audio and verify against context before finalizing", correct: true },
      { id: "b", label: "Type what the speech engine guessed to stay on pace" },
      { id: "c", label: "Leave it blank and submit" },
      { id: "d", label: "Round the number to the nearest whole unit" },
    ],
  },
  {
    id: "med-hipaa",
    question: "Which practice aligns with HIPAA-aware medical transcription work?",
    options: [
      { id: "a", label: "Accessing records only through approved secure systems", correct: true },
      { id: "b", label: "Emailing partial dictations to your personal account" },
      { id: "c", label: "Discussing case details in open team chats without need" },
      { id: "d", label: "Storing audio on a public file-sharing link" },
    ],
  },
  {
    id: "med-terminology",
    question: "You encounter an unfamiliar anatomical term in a dictation. Best step?",
    options: [
      { id: "a", label: "Use approved references and flag if still uncertain", correct: true },
      { id: "b", label: "Substitute a common lay term without checking" },
      { id: "c", label: "Omit the term to avoid errors" },
      { id: "d", label: "Invent a phonetic spelling and move on" },
    ],
  },
  {
    id: "med-format",
    question: "A client template requires strict section headings in clinical notes. You should:",
    options: [
      { id: "a", label: "Follow the template exactly, even if it takes extra passes", correct: true },
      { id: "b", label: "Merge sections to finish faster" },
      { id: "c", label: "Use your own preferred layout" },
      { id: "d", label: "Drop headings that seem repetitive" },
    ],
  },
  {
    id: "med-audio",
    question: "Poor audio quality makes a phrase inaudible in a medical file. You should:",
    options: [
      { id: "a", label: "Mark unclear segments per client policy and continue accurately elsewhere", correct: true },
      { id: "b", label: "Guess the phrase based on similar cases" },
      { id: "c", label: "Delete the inaudible section" },
      { id: "d", label: "Fill in plausible medical language" },
    ],
  },
  {
    id: "med-deadline",
    question: "Turnaround time is tight on a long operative report. Best approach?",
    options: [
      { id: "a", label: "Maintain clinical accuracy and communicate early if SLA is at risk", correct: true },
      { id: "b", label: "Skip proofreading to submit sooner" },
      { id: "c", label: "Abbreviate all diagnoses without checking standards" },
      { id: "d", label: "Submit a partial note without telling anyone" },
    ],
  },
];

export const SKILLS_QUIZ_BY_ROLE: Record<string, SkillsQuizQuestion[]> = {
  "ai-content-transcription-validator": AI_VALIDATOR_QUIZ,
  "medical-transcriptionist": MEDICAL_TRANSCRIPTION_QUIZ,
};

/** @deprecated Use getSkillsQuizForRole */
export const SKILLS_PROFILE_QUIZ = AI_VALIDATOR_QUIZ;

export function getSkillsQuizForRole(roleSlug: string): SkillsQuizQuestion[] {
  return SKILLS_QUIZ_BY_ROLE[roleSlug] ?? AI_VALIDATOR_QUIZ;
}

/** Shuffle option order so the correct answer is not always listed first. */
export function shuffleQuizOptions(questions: SkillsQuizQuestion[]): SkillsQuizQuestion[] {
  return questions.map((q) => ({
    ...q,
    options: shuffleInPlace([...q.options]),
  }));
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function scoreSkillsProfile(
  answers: Record<string, string>,
  questions: SkillsQuizQuestion[],
): number {
  if (questions.length === 0) return 0;
  let correct = 0;
  for (const q of questions) {
    const chosen = answers[q.id];
    const match = q.options.find((o) => o.id === chosen);
    if (match?.correct) correct += 1;
  }
  return Math.round((correct / questions.length) * 100);
}
