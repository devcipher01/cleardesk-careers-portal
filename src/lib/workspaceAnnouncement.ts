import { ALISON_MT_CERT_URL, COURSERA_MT_CERT_URL } from "@/lib/certLinks";

/**
 * Workspace notices, shown one at a time (first undismissed).
 * Each item needs unique dismiss/session keys — do not reuse wn_* storage.
 * Add a second object here when the next notice copy is ready.
 */
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
};

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
];
