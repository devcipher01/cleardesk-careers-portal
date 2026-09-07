import { useRouterState } from "@tanstack/react-router";
import { MARKET_COOKIE, originForMarket, type MarketId } from "@/lib/market";

export function useMarket(): MarketId {
  const market = useRouterState({
    select: (s) => {
      for (const match of s.matches) {
        const value = (match.context as { market?: unknown } | undefined)?.market;
        if (value === "ph" || value === "ng") return value;
      }
      return "ng" as const;
    },
  });
  return market;
}

export function persistMarketPreference(market: MarketId) {
  const maxAge = 60 * 60 * 24 * 180;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const domain = host.endsWith("worknesta.com") ? "; Domain=.worknesta.com" : "";
  document.cookie = `${MARKET_COOKIE}=${market}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`;
}

export function otherMarketHref(current: MarketId, pathname: string): string {
  const next: MarketId = current === "ph" ? "ng" : "ph";
  return `${originForMarket(next)}${pathname || "/"}`;
}
