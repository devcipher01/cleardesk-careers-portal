import { ALISON_MT_CERT_URL, COURSERA_MT_CERT_URL } from "@/lib/certLinks";

/**
 * Workspace notices, shown one at a time (first undismissed).
 * Each item needs unique dismiss/session keys — do not reuse wn_* storage.
 */
export type WorkspaceAnnouncementAudience = "all" | "module1_tasks_1_to_4_only";

export type WorkspaceAnnouncement = {
  id: string;
  dismissKey: string;
  sessionKey: string;
  title: string;
  paragraphs: string[];
  links?: { label: string; href: string }[];
  highlight?: string;
  showSupportLink?: boolean;
  showSettingsLink?: boolean;
  /** Default: everyone. `module1_tasks_1_to_4_only` = did 1–4, never submitted 5 or 6. */
  audience?: WorkspaceAnnouncementAudience;
  icon?: "alert" | "megaphone";
};

const MODULE1_GENERAL = ["m1t01", "m1t02", "m1t03", "m1t04"] as const;
const MODULE1_MEDICAL = ["m1t05", "m1t06"] as const;

function isFinishedStatus(status: string | undefined) {
  return status === "submitted" || status === "reviewed";
}

/** True if this person submitted/reviewed any of tasks 1–4 and neither 5 nor 6. */
export function isModule1Tasks1To4Only(
  tasks: { task_id: string; status: string }[],
): boolean {
  const byId = new Map(tasks.map((t) => [t.task_id, t.status]));
  const didGeneral = MODULE1_GENERAL.some((id) => isFinishedStatus(byId.get(id)));
  const didMedical = MODULE1_MEDICAL.some((id) => isFinishedStatus(byId.get(id)));
  return didGeneral && !didMedical;
}

export function announcementMatchesAudience(
  notice: WorkspaceAnnouncement,
  tasks: { task_id: string; status: string }[],
): boolean {
  if (!notice.audience || notice.audience === "all") return true;
  if (notice.audience === "module1_tasks_1_to_4_only") return isModule1Tasks1To4Only(tasks);
  return true;
}

export const WORKSPACE_ANNOUNCEMENTS: WorkspaceAnnouncement[] = [
  {
    id: "cert-alison-coursera-v2",
    dismissKey: "wn_announcement_cert_alison_coursera_v2",
    sessionKey: "wn_announcement_session_cert_alison_coursera_v2",
    title: "Certificate verification delays",
    paragraphs: [
      "We're currently seeing delays with some MedTransCert verifications. This may affect how quickly certain modules are unlocked.",
      "If your module requires certification, use Alison or Coursera. Both issue an online-verifiable certificate.",
    ],
    links: [
      { label: "Use Alison", href: ALISON_MT_CERT_URL },
      { label: "Use Coursera", href: COURSERA_MT_CERT_URL },
    ],
    highlight: "Certificates from CertifyPath may take longer to verify at this time.",
    showSupportLink: true,
  },
  {
    id: "payment-details-confirm-v1",
    dismissKey: "wn_announcement_payment_details_confirm_v1",
    sessionKey: "wn_announcement_session_payment_details_confirm_v1",
    title: "Confirm your payment details",
    paragraphs: [
      "We've updated the payment details system. Some users experienced an issue where bank information appeared blank after saving. This has now been fixed.",
      "To avoid payout delays, please confirm your account number and bank name are correct in your profile settings. If your details are already saved, no action is needed.",
    ],
    showSettingsLink: true,
  },
  {
    id: "payout-module-not-task-v1",
    dismissKey: "wn_announcement_payout_module_not_task_v1",
    sessionKey: "wn_announcement_session_payout_module_not_task_v1",
    title: "Payout clarification",
    paragraphs: [
      "Payout is credited per completed module, not per individual task. Once a module is fully completed and reviewed, the payout is processed.",
      "Where a submission deadline is missed, unfinished tasks in that module are closed. Those tasks may show Window closed and may be assigned to another transcriber. Closed tasks cannot be submitted.",
      "Payout is not released for a module that was not fully completed before the deadline.",
    ],
    audience: "module1_tasks_1_to_4_only",
    icon: "megaphone",
  },
];
