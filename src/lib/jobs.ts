export type JobStatus = "open" | "filled";

export interface JobDetails {
  responsibilities: string[];
  dayToDay: string[];
  onboarding: string;
  goodFit: string[];
}

export interface Job {
  slug: string;
  title: string;
  types: string[];
  pay: string;
  /** Short line on listing cards */
  description: string;
  /** Optional marketing line shown on the role detail page */
  pitch?: string;
  requirements: string[];
  status: JobStatus;
  /** Extended copy for /careers/:slug */
  details?: JobDetails;
}

export function getJobBySlug(slug: string): Job | undefined {
  return JOBS.find((j) => j.slug === slug);
}

export const JOBS: Job[] = [
  {
    slug: "ai-content-transcription-validator",
    title: "Remote Transcription Specialist",
    types: ["Full-Time", "Part-Time", "Remote"],
    pay: "$16–$22/hr USD",
    description:
      "Review and correct AI-generated text, audio transcriptions, and data sheets for accuracy.",
    pitch:
      "Review and correct AI-generated text, audio transcriptions, and data sheets for accuracy. No prior experience required; comprehensive virtual onboarding provided.",
    requirements: [
      "Strong written English and attention to detail",
      "Laptop or desktop with reliable high-speed internet",
      "Comfort reading on-screen for extended periods",
      "No prior AI or transcription experience required",
    ],
    status: "open",
    details: {
      responsibilities: [
        "Review AI-generated copy for grammar, clarity, and factual consistency",
        "Listen to audio clips and correct machine transcriptions against style guides",
        "Validate structured data sheets and flag errors before client delivery",
        "Apply client-specific formatting and terminology rules",
        "Escalate ambiguous cases to a lead reviewer when guidelines are unclear",
      ],
      dayToDay: [
        "Work from a fully remote queue of text, audio, and spreadsheet tasks",
        "Use Worknesta tools in your browser — no special software to install",
        "Track accuracy and turnaround time with clear daily targets",
        "Collaborate asynchronously with QA leads via written feedback",
      ],
      onboarding:
        "Every new validator completes comprehensive virtual onboarding: platform walkthrough, sample tasks with mentor review, and paid practice batches before live client work.",
      goodFit: [
        "You catch typos and awkward phrasing quickly",
        "You are patient with repetitive, detail-heavy work",
        "You want flexible remote hours with weekly pay",
        "You are comfortable learning new guidelines each week",
      ],
    },
  },
  {
    slug: "data-entry-specialist",
    title: "Data Entry Specialist",
    types: ["Full-Time", "Remote"],
    pay: "$14–$18/hr USD",
    description:
      "Entering, updating, and maintaining data in spreadsheets and internal systems with high accuracy.",
    requirements: [
      "Attention to detail",
      "Typing speed 45+ WPM",
      "Reliable high-speed internet",
      "Laptop or desktop",
    ],
    status: "filled",
  },
  {
    slug: "medical-transcriptionist",
    title: "Medical Transcriptionist",
    types: ["Full-Time", "Remote"],
    pay: "$20–$28/hr USD",
    description:
      "Transcribing medical dictations and clinical notes with strict accuracy and confidentiality.",
    requirements: [
      "Prior medical transcription experience",
      "Familiarity with medical terminology",
      "HIPAA awareness",
    ],
    status: "open",
  },
  {
    slug: "document-processing-clerk",
    title: "Document Processing Clerk",
    types: ["Part-Time", "Remote"],
    pay: "$13–$16/hr USD",
    description: "Reviewing, formatting, and organizing documents per client specifications.",
    requirements: ["Proficiency in MS Word / Google Docs", "Organized", "Reliable"],
    status: "filled",
  },
  {
    slug: "quality-assurance-reviewer",
    title: "Quality Assurance Reviewer",
    types: ["Full-Time", "Remote"],
    pay: "$18–$24/hr USD",
    description:
      "Reviewing completed data entry and transcription work for accuracy and consistency.",
    requirements: ["Detail-oriented", "Prior data / transcription experience required"],
    status: "filled",
  },
  {
    slug: "virtual-data-coordinator",
    title: "Virtual Data Coordinator",
    types: ["Full-Time", "Remote"],
    pay: "$16–$22/hr USD",
    description:
      "Coordinating data workflows between client teams and internal contractors.",
    requirements: ["Strong organization", "Clear written communication", "2+ years remote work"],
    status: "filled",
  },
];
