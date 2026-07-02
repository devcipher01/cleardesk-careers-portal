import React from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { HiringBadge } from "@/components/site/HiringBadge";
import { CookieBanner } from "@/components/site/CookieBanner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-8xl italic text-ink">404</h1>
        <h2 className="mt-4 text-xl font-medium text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-ink/60">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-lime-foreground transition hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Worknesta — Remote Data Entry & Transcription Jobs" },
      {
        name: "description",
        content:
          "Worknesta hires detail-oriented remote professionals worldwide for data entry, transcription, and document processing roles. Work from anywhere.",
      },
      { name: "author", content: "Worknesta" },
      { property: "og:title", content: "Worknesta — Remote Jobs" },
      {
        property: "og:description",
        content:
          "Precision. Reliability. Remote. Build a remote career in data entry, transcription, and document processing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Caveat:wght@500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWorkspaceApp =
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/onboarding/workspace-setup") ||
    pathname.startsWith("/onboarding");

  if (isWorkspaceApp) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <HiringBadge />
      <CookieBanner />
    </div>
  );
}
