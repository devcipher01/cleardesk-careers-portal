import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/careers", label: "Open Roles" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/workspace/signin", label: "Sign in" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full bg-cream/80 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
      <div className="container-page flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2 text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ink-foreground font-serif text-lg italic">
            c
          </span>
          <span className="text-base font-medium tracking-tight">Worknesta</span>
        </Link>

        {/* Desktop pill nav */}
        <nav className="hidden items-center gap-1 rounded-full border border-ink/10 bg-card/70 px-2 py-1.5 shadow-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-ink/5 lg:px-4"
              activeProps={{ className: "!bg-ink !text-ink-foreground" }}
              inactiveProps={{ className: "text-ink/70 hover:text-ink" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            to="/careers/apply"
            className="inline-flex items-center rounded-full bg-lime px-4 py-2 text-sm font-medium text-lime-foreground shadow-sm transition-transform hover:-translate-y-0.5 lg:px-5"
          >
            Apply now
          </Link>
        </div>

        <button
          className="md:hidden text-ink"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="container-page mb-3 rounded-2xl border border-ink/10 bg-card p-2 shadow-lg">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm hover:bg-ink/5"
                activeProps={{ className: "!bg-ink !text-ink-foreground" }}
                inactiveProps={{ className: "text-ink/80" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/careers/apply"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-lime px-3 py-2.5 text-center text-sm font-medium text-lime-foreground"
            >
              Apply now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
