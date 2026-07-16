import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function HiringBadge() {
  return (
    <Link
      to="/careers"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-ink-foreground shadow-xl transition-transform hover:-translate-y-0.5"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
      </span>
      <Sparkles className="h-4 w-4 text-lime" />
      Now Accepting Contractors
    </Link>
  );
}
