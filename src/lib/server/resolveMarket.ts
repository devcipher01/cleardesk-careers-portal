import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/start-server-core";
import { z } from "zod";
import {
  type MarketId,
  marketFromCountry,
  marketFromHost,
  originForMarket,
  parseMarketCookie,
  shouldSkipMarketRedirect,
} from "@/lib/market";

function requestHost(): string {
  const raw =
    getRequestHeader("x-forwarded-host") ||
    getRequestHeader("host") ||
    "";
  return raw.split(",")[0].trim().toLowerCase().split(":")[0];
}

export const resolveMarketGate = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    pathname: z.string(),
    search: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const host = requestHost();
    const hostMarket = marketFromHost(host);
    const cookieMarket = parseMarketCookie(getRequestHeader("cookie"));
    const country = (getRequestHeader("x-vercel-ip-country") || "").toUpperCase();

    let market: MarketId = hostMarket ?? cookieMarket ?? "ng";
    if (hostMarket) {
      market = cookieMarket ?? (country ? marketFromCountry(country) : hostMarket);
    }

    let redirectTo: string | null = null;
    if (
      hostMarket &&
      !shouldSkipMarketRedirect(data.pathname) &&
      market !== hostMarket
    ) {
      const search = !data.search || data.search === "?"
        ? ""
        : data.search.startsWith("?")
          ? data.search
          : `?${data.search}`;
      redirectTo = `${originForMarket(market)}${data.pathname}${search}`;
    }

    return { market: hostMarket ?? market, redirectTo };
  });
