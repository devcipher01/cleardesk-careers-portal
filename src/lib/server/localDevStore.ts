import { randomUUID } from "node:crypto";

export type LocalEmail = {
  id: string;
  createdAt: string;
  deliverAt: string;
  deliveredAt: string | null;
  to: string;
  subject: string;
  html: string;
  text?: string;
  scheduled: boolean;
};

export type LocalApplication = {
  id: string;
  status: string;
  full_name: string;
  email: string;
  role_title: string;
  role_slug: string;
  created_at: string;
};

export type LocalSkillsProfile = {
  application_id: string;
  score_percent: number;
  selected_for_workspace: boolean;
  submitted_at: string;
  answers: Record<string, string>;
};

export type LocalWorkspaceOnboarding = {
  application_id: string;
  nda_legal_name?: string;
  nda_signature?: string;
  nda_signed_at?: string;
  declare_accurate?: boolean;
  agree_schedule?: boolean;
  employee_signature?: string;
  witness_signature?: string;
  vde_token?: string;
  contract_submitted_at?: string;
};

const applications = new Map<string, LocalApplication & Record<string, unknown>>();
const skillsProfiles = new Map<string, LocalSkillsProfile>();
const workspaceOnboarding = new Map<string, LocalWorkspaceOnboarding>();
const emails: LocalEmail[] = [];

export const localDevStore = {
  insertApplication(row: Omit<LocalApplication, "id" | "created_at"> & Record<string, unknown>) {
    const id = randomUUID();
    const app = { id, created_at: new Date().toISOString(), ...row } as LocalApplication & Record<string, unknown>;
    applications.set(id, app);
    return app;
  },

  getApplication(id: string) {
    return applications.get(id) ?? null;
  },

  updateApplicationStatus(id: string, status: string) {
    const app = applications.get(id);
    if (!app) return;
    app.status = status;
  },

  getSkillsProfile(applicationId: string) {
    return skillsProfiles.get(applicationId) ?? null;
  },

  insertSkillsProfile(row: LocalSkillsProfile) {
    skillsProfiles.set(row.application_id, row);
  },

  getWorkspace(applicationId: string) {
    return workspaceOnboarding.get(applicationId) ?? null;
  },

  upsertWorkspaceNda(applicationId: string, nda: Pick<LocalWorkspaceOnboarding, "nda_legal_name" | "nda_signature" | "nda_signed_at">) {
    const existing = workspaceOnboarding.get(applicationId) ?? { application_id: applicationId };
    workspaceOnboarding.set(applicationId, { ...existing, ...nda });
  },

  updateWorkspaceContract(applicationId: string, patch: Partial<LocalWorkspaceOnboarding>) {
    const existing = workspaceOnboarding.get(applicationId) ?? { application_id: applicationId };
    workspaceOnboarding.set(applicationId, { ...existing, ...patch });
  },

  queueEmail(input: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    delayMs: number;
  }) {
    const now = Date.now();
    const email: LocalEmail = {
      id: randomUUID(),
      createdAt: new Date(now).toISOString(),
      deliverAt: new Date(now + input.delayMs).toISOString(),
      deliveredAt: input.delayMs <= 0 ? new Date(now).toISOString() : null,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      scheduled: input.delayMs > 0,
    };
    emails.unshift(email);

    if (input.delayMs > 0) {
      setTimeout(() => {
        email.deliveredAt = new Date().toISOString();
        console.info("\n[Worknesta LOCAL EMAIL — delivered]\n", {
          to: email.to,
          subject: email.subject,
          text: email.text,
        });
      }, input.delayMs);
    } else {
      console.info("\n[Worknesta LOCAL EMAIL — instant]\n", {
        to: email.to,
        subject: email.subject,
        text: email.text,
      });
    }

    return email;
  },

  listEmails() {
    return [...emails];
  },

  getLatestApplicationId() {
    const sorted = [...applications.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted[0]?.id ?? null;
  },
};
