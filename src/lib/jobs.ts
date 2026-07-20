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
  /** Optional certification link shown on the listing card and detail page */
  certUrl?: string;
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
      "No prior transcription experience required",
    ],
    status: "open",
    details: {
      responsibilities: [
        "Listen to audio clips and correct machine transcriptions against style guides",
        "Review AI-generated copy for grammar, clarity, and factual consistency",
        "Validate structured transcription sheets and flag errors before client delivery",
        "Apply client-specific formatting and terminology rules",
        "Escalate ambiguous cases to a project lead when guidelines are unclear",
      ],
      dayToDay: [
        "Work from a fully remote queue of audio and transcription projects",
        "Use Worknesta workspace tools in your browser — no special software to install",
        "Track accuracy and turnaround time with clear daily module targets",
        "Collaborate asynchronously with quality leads via written feedback",
      ],
      onboarding:
        "Every new contractor completes comprehensive virtual onboarding: workspace walkthrough, sample modules with mentor review, and paid practice batches before live client projects.",
      goodFit: [
        "You catch typos and awkward phrasing quickly",
        "You are patient with repetitive, detail-heavy work",
        "You want flexible remote hours with weekly earnings",
        "You are comfortable learning new guidelines each week",
      ],
    },
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
    certUrl: "https://certifypath.online/courses/medical-transcriptionist#course-content",
  },
];
