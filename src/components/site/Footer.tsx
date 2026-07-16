import { Link } from "@tanstack/react-router";
import { Linkedin, Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/10">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ink-foreground font-serif text-lg italic">
              c
            </span>
            <span className="text-base font-medium">Worknesta</span>
          </div>
          <p className="mt-4 max-w-sm font-serif text-2xl italic leading-snug text-ink">
            Precision. Reliability. <span className="text-ink/60">Remote.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-ink/60">
            Serving enterprise clients across the US and Europe with precision remote data and
            transcription services.
          </p>
          <div className="mt-5 flex gap-2">
            {[Linkedin, Facebook, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-card text-ink/70 hover:bg-ink hover:text-ink-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink/80">
            <li><Link to="/about" className="hover:text-ink">About</Link></li>
            <li><Link to="/careers" className="hover:text-ink">Open Projects</Link></li>
            <li><Link to="/how-it-works" className="hover:text-ink">How It Works</Link></li>
            <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink/80">
            <li><Link to="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-ink">Terms of Service</Link></li>
            <li><a href="mailto:talent@worknesta.com" className="hover:text-ink">talent@worknesta.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink/50 md:flex-row">
          <p>© {new Date().getFullYear()} Worknesta · Wilmington, Delaware, USA · Founded 2019</p>
          <p className="font-script text-base text-ink/60">made with care, remotely ✦</p>
        </div>
      </div>
    </footer>
  );
}
