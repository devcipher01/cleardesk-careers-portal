import { Play } from "lucide-react";
import { useState } from "react";

interface VideoEmbedProps {
  label: string;
  videoId?: string;
  caption?: string;
}

export function VideoEmbed({ label, videoId = "VIDEO_ID", caption }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="mx-auto w-full max-w-3xl">
      {/* VIDEO: {label} — replace VIDEO_ID below */}
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-ink/10 bg-ink shadow-xl">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={label}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink via-[oklch(0.28_0.02_60)] to-ink text-ink-foreground transition"
            aria-label={`Play video: ${label}`}
          >
            <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.86_0.16_130/0.18),transparent_55%)]" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-lime text-lime-foreground shadow-xl ring-8 ring-white/5 transition-transform group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-current" />
            </span>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-wider">
              {label}
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center font-script text-xl text-ink/70">{caption}</figcaption>
      )}
    </figure>
  );
}
