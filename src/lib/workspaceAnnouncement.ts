/**
 * Workspace announcement dismiss keys.
 * New unique keys — do not reuse or overwrite existing wn_* storage.
 *
 * Bump `WORKSPACE_ANNOUNCEMENT_ID` (and the two key suffixes) when the
 * message changes so people who dismissed the previous notice see the new one.
 */
export const WORKSPACE_ANNOUNCEMENT_ID = "medtranscert-delays-v1";
export const ANNOUNCEMENT_DISMISS_KEY = "wn_announcement_medtranscert_delays_v1";
export const ANNOUNCEMENT_SESSION_KEY = "wn_announcement_session_medtranscert_delays_v1";
