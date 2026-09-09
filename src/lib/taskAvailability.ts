/** When true, all transcription tasks are closed in the workspace. */
export const TASKS_TIME_EXCEEDED = true;

/** Nigeria Module 1 window stays closed. Philippines Module 1 is open. */
export function isTasksWindowClosed(market?: string | null): boolean {
  if (market === "ph") return false;
  return TASKS_TIME_EXCEEDED;
}
