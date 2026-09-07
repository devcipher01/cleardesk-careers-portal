export type MarketId = "ng" | "ph";

export const MARKET_COOKIE = "wn_market";

export const NG_HOSTS = new Set(["worknesta.com", "www.worknesta.com"]);
export const PH_HOSTS = new Set(["ph.worknesta.com"]);

export const NG_ORIGIN = "https://worknesta.com";
export const PH_ORIGIN = "https://ph.worknesta.com";

export const MARKET_SKIP_REDIRECT_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/workspace",
  "/onboarding",
  "/dev",
];

export type MarketCopy = {
  regionLabel: string;
  acceptingLine: string;
  heroLead: string;
  homeOg: string;
  networkBenefit: string;
  whyDescription: string;
  careersMeta: string;
  careersOg: string;
  careersBadge: string;
  careersIntro: string;
  careersRemote: string;
  careersFooter: string;
  aboutMeta: string;
  aboutOg: string;
  aboutHero: string;
  aboutTeam: string;
  aboutReach: string;
  aboutTimezone: string;
  aboutLegal: string;
  flexibilityValue: string;
  howItWorksIntro: string;
  countriesFaq: string;
  countries: { flag: string; name: string }[];
  otherSiteLabel: string;
};

export function marketFromContext(context: unknown): MarketId {
  if (context && typeof context === "object" && "market" in context) {
    const m = (context as { market?: unknown }).market;
    if (m === "ph" || m === "ng") return m;
  }
  return "ng";
}

export const MARKET_COPY: Record<MarketId, MarketCopy> = {
  ng: {
    regionLabel: "Africa",
    acceptingLine: "Now accepting contractors · Africa",
    heroLead:
      "We connect detail-oriented independent contractors with transcription projects from enterprise clients across Africa.",
    homeOg: "Build a freelance transcription career. 800+ contractors across Africa earn weekly on Worknesta.",
    networkBenefit: "Join contractors across Africa.",
    whyDescription:
      "No gatekeepers, no fees, no fluff. A modern freelance platform built for independent contractors across Africa.",
    careersMeta: "Browse open transcription projects for independent contractors across Africa. Weekly earnings, fully remote.",
    careersOg: "Transcription projects for independent contractors. Fully remote across Africa. Weekly earnings.",
    careersBadge: "Africa",
    careersIntro:
      "Projects are open to independent contractors in Africa. Worknesta is headquartered in Wilmington, Delaware, USA.",
    careersRemote: "Remote · Africa",
    careersFooter: "✦ no application fees · 100% remote · Africa contractors",
    aboutMeta: "Worknesta delivers precision data entry and transcription services for enterprise clients across Africa.",
    aboutOg:
      "Founded in 2019, Worknesta is a remote-first data services company hiring detail-oriented professionals across Africa.",
    aboutHero: "Precision. Reliability. Remote. Building a focused Africa team since 2019.",
    aboutTeam: "processing services. Our team is based across Africa.",
    aboutReach:
      "Worknesta team members are based across Africa, supporting enterprise clients who require high accuracy, timezone-aligned remote professionals.",
    aboutTimezone:
      "We prioritize candidates with strong written English, reliable high-speed internet, and availability within African time zones such as WAT, CAT, EAT, or GMT.",
    aboutLegal: "are fully remote and distributed across Africa.",
    flexibilityValue: "Work the hours that fit your life, from anywhere in Africa.",
    howItWorksIntro: "A clear, fast, fair process — built for independent contractors across Africa.",
    countriesFaq:
      "We currently work with contractors from Africa. Ideal candidates are based in African countries with availability in WAT, CAT, EAT, or GMT timezones.",
    countries: [
      { flag: "🇳🇬", name: "Nigeria" },
      { flag: "🇬🇭", name: "Ghana" },
      { flag: "🇰🇪", name: "Kenya" },
      { flag: "🇿🇦", name: "South Africa" },
      { flag: "🇪🇬", name: "Egypt" },
      { flag: "🇪🇹", name: "Ethiopia" },
      { flag: "🇸🇳", name: "Senegal" },
      { flag: "🇺🇬", name: "Uganda" },
      { flag: "🇲🇦", name: "Morocco" },
      { flag: "🇷🇼", name: "Rwanda" },
    ],
    otherSiteLabel: "Philippines site",
  },
  ph: {
    regionLabel: "Philippines",
    acceptingLine: "Now accepting contractors · Philippines",
    heroLead:
      "We connect detail-oriented independent contractors in the Philippines with transcription projects from enterprise clients.",
    homeOg: "Build a freelance transcription career. Contractors in the Philippines earn weekly on Worknesta.",
    networkBenefit: "Join contractors across the Philippines.",
    whyDescription:
      "No gatekeepers, no fees, no fluff. A modern freelance platform built for independent contractors in the Philippines.",
    careersMeta:
      "Browse open transcription projects for independent contractors in the Philippines. Weekly earnings, fully remote.",
    careersOg: "Transcription projects for independent contractors. Fully remote in the Philippines. Weekly earnings.",
    careersBadge: "Philippines",
    careersIntro:
      "Projects are open to independent contractors in the Philippines. Worknesta is headquartered in Wilmington, Delaware, USA.",
    careersRemote: "Remote · Philippines",
    careersFooter: "✦ no application fees · 100% remote · Philippines contractors",
    aboutMeta:
      "Worknesta delivers precision data entry and transcription services with a contractor network in the Philippines.",
    aboutOg:
      "Founded in 2019, Worknesta is a remote-first data services company hiring detail-oriented professionals in the Philippines.",
    aboutHero: "Precision. Reliability. Remote. Building a focused Philippines team since 2019.",
    aboutTeam: "processing services. Our Philippines contractor network works fully remotely.",
    aboutReach:
      "Worknesta contractors in the Philippines support enterprise clients who require high accuracy and reliable remote professionals.",
    aboutTimezone:
      "We prioritize candidates with strong written English, reliable high-speed internet, and availability in Philippine time (PHT).",
    aboutLegal: "are fully remote, with this site serving contractors in the Philippines.",
    flexibilityValue: "Work the hours that fit your life, from anywhere in the Philippines.",
    howItWorksIntro: "A clear, fast, fair process — built for independent contractors in the Philippines.",
    countriesFaq:
      "This site is for contractors in the Philippines. Ideal candidates are based in the Philippines with availability in PHT.",
    countries: [
      { flag: "🇵🇭", name: "Metro Manila" },
      { flag: "🇵🇭", name: "Cebu" },
      { flag: "🇵🇭", name: "Davao" },
      { flag: "🇵🇭", name: "Iloilo" },
      { flag: "🇵🇭", name: "Baguio" },
    ],
    otherSiteLabel: "Nigeria site",
  },
};

export function marketFromHost(host: string): MarketId | null {
  const h = host.split(":")[0].toLowerCase();
  if (PH_HOSTS.has(h)) return "ph";
  if (NG_HOSTS.has(h)) return "ng";
  return null;
}

export function originForMarket(market: MarketId): string {
  return market === "ph" ? PH_ORIGIN : NG_ORIGIN;
}

export function parseMarketCookie(cookieHeader: string | undefined): MarketId | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)wn_market=(ng|ph)(?:;|$)/i);
  if (!match) return null;
  return match[1].toLowerCase() as MarketId;
}

export function marketFromCountry(country: string | undefined): MarketId {
  return country?.toUpperCase() === "NG" ? "ng" : "ph";
}

export function shouldSkipMarketRedirect(pathname: string): boolean {
  return MARKET_SKIP_REDIRECT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function marketFromCountryName(countryName: string): MarketId {
  return countryName.trim().toLowerCase() === "philippines" ? "ph" : "ng";
}
