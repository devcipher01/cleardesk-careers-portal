import { BRAND_LOCATION, BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";

type EmailTemplateInput = {
  subjectHeadline: string;
  intro?: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
};

const brand = {
  name: BRAND_NAME,
  supportEmail: BRAND_SUPPORT_EMAIL,
  location: BRAND_LOCATION,
  navy: "#0b1f3a",
  text: "#2f3440",
  muted: "#667085",
  bg: "#ffffff",
  border: "#e5e7eb",
};

export function renderEmailHtml(input: EmailTemplateInput) {
  const { subjectHeadline, intro, paragraphs, ctaLabel, ctaUrl } = input;
  const safeParas = paragraphs.filter(Boolean);

  const cta =
    ctaLabel && ctaUrl
      ? `<div style="margin-top:20px;">
           <a href="${escapeHtmlAttr(
             ctaUrl,
           )}" style="display:inline-block;background:${brand.navy};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;font-size:14px;">
             ${escapeHtml(ctaLabel)}
           </a>
         </div>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subjectHeadline)}</title>
  </head>
  <body style="margin:0;background:${brand.bg};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${brand.text};">
    <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <div style="font-weight:800;font-size:18px;letter-spacing:.2px;color:${brand.navy};">
        ${brand.name}
      </div>
      <div style="margin-top:18px;border:1px solid ${brand.border};border-radius:16px;padding:22px;">
        <div style="font-size:20px;font-weight:800;color:${brand.navy};line-height:1.25;">
          ${escapeHtml(subjectHeadline)}
        </div>
        ${intro ? `<p style="margin:14px 0 0;color:${brand.text};font-size:15px;line-height:1.55;">${escapeHtml(intro)}</p>` : ""}
        ${safeParas
          .map(
            (p) =>
              `<p style="margin:12px 0 0;color:${brand.text};font-size:15px;line-height:1.55;">${escapeHtml(
                p,
              )}</p>`,
          )
          .join("")}
        ${cta}
      </div>

      <div style="margin-top:18px;color:${brand.muted};font-size:12px;line-height:1.5;">
        <div>${brand.name} · <a href="mailto:${brand.supportEmail}" style="color:${brand.muted};text-decoration:underline;">${brand.supportEmail}</a></div>
        <div>${brand.location}</div>
        <div style="margin-top:10px;">
          ${brand.name} will never charge you any fees. If anyone asks you to pay on our behalf, it is a scam — please report it to us immediately.
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function renderEmailText(input: EmailTemplateInput) {
  const lines: string[] = [];
  lines.push(BRAND_NAME);
  lines.push("");
  lines.push(input.subjectHeadline);
  lines.push("");
  if (input.intro) lines.push(input.intro, "");
  for (const p of input.paragraphs) lines.push(p, "");
  if (input.ctaLabel && input.ctaUrl) {
    lines.push(`${input.ctaLabel}: ${input.ctaUrl}`, "");
  }
  lines.push(`${BRAND_NAME} · ${BRAND_SUPPORT_EMAIL}`);
  lines.push(BRAND_LOCATION);
  lines.push(
    `${BRAND_NAME} will never charge you any fees. If anyone asks you to pay on our behalf, it is a scam — please report it to us immediately.`,
  );
  return lines.join("\n").trim() + "\n";
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(s: string) {
  return escapeHtml(s).replaceAll("`", "&#96;");
}
