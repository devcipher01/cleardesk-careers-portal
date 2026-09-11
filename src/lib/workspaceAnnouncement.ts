import type { MarketId } from "@/lib/market";
import { isTasksWindowClosed } from "@/lib/taskAvailability";

/**
 * Workspace notices, shown one at a time (first undismissed).
 * Each item needs unique dismiss/session keys — do not reuse wn_* storage.
 * Set `market` to `ng` or `ph` so a notice never appears on the other site.
 */
export type WorkspaceAnnouncementAudience = "all" | "module1_tasks_1_to_4_only" | "no_open_module";

export type WorkspaceAnnouncement = {
  id: string;
  dismissKey: string;
  sessionKey: string;
  title: string;
  paragraphs: string[];
  links?: { label: string; href: string }[];
  highlight?: string;
  facts?: { label: string; value: string }[];
  showSupportLink?: boolean;
  showSettingsLink?: boolean;
  /** Default: everyone. `no_open_module` = no live module currently assigned to work. */
  audience?: WorkspaceAnnouncementAudience;
  /** Default `all`. Nigeria and Philippines accounts never share notices. */
  market?: MarketId | "all";
  icon?: "alert" | "megaphone";
};

const MODULE1_IDS = ["m1t01", "m1t02", "m1t03", "m1t04", "m1t05", "m1t06"] as const;
const MODULE1_GENERAL = ["m1t01", "m1t02", "m1t03", "m1t04"] as const;
const MODULE1_MEDICAL = ["m1t05", "m1t06"] as const;

function isFinishedStatus(status: string | undefined) {
  return status === "submitted" || status === "reviewed";
}

function isModule1FullySubmitted(tasks: { task_id: string; status: string }[]) {
  const byId = new Map(tasks.map((t) => [t.task_id, t.status]));
  return MODULE1_IDS.every((id) => isFinishedStatus(byId.get(id)));
}

/** True if this person still has Module 1 open to work. Placeholders do not count. */
export function hasOpenAssignableModule(
  tasks: { task_id: string; status: string }[],
  market: MarketId,
): boolean {
  if (isTasksWindowClosed(market)) return false;
  return !isModule1FullySubmitted(tasks);
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
  market: MarketId,
): boolean {
  if (!notice.audience || notice.audience === "all") return true;
  if (notice.audience === "module1_tasks_1_to_4_only") return isModule1Tasks1To4Only(tasks);
  if (notice.audience === "no_open_module") return !hasOpenAssignableModule(tasks, market);
  return true;
}

export function announcementMatchesMarket(
  notice: WorkspaceAnnouncement,
  market: MarketId,
): boolean {
  if (!notice.market || notice.market === "all") return true;
  return notice.market === market;
}

export const WORKSPACE_ANNOUNCEMENTS: WorkspaceAnnouncement[] = [];
