import { PIPELINE_SESSION_KEY } from "@/lib/careersPipeline";

export function resolveApplicationId(searchId?: string): string | undefined {
  return (
    searchId ||
    (typeof window !== "undefined" ? sessionStorage.getItem(PIPELINE_SESSION_KEY) : null) ||
    undefined
  );
}

export function persistApplicationId(id: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PIPELINE_SESSION_KEY, id);
  }
}
