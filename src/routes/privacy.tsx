import { createFileRoute } from "@tanstack/react-router";
import { Section, SectionHeader } from "@/components/site/Section";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Worknesta" },
      { name: "description", content: "How Worknesta collects, uses, and protects your information." },
      { property: "og:title", content: "Privacy Policy — Worknesta" },
      { property: "og:description", content: "Our privacy practices for applicants, contractors, and visitors." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Section>
      <div className="container-page">
        <SectionHeader eyebrow="Legal" title="Privacy Policy" />
        <article className="prose mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">Last updated: January 2025</p>
          <h3 className="mt-6 text-lg font-semibold text-navy">1. Information We Collect</h3>
          <p className="mt-2 text-muted-foreground">
            Worknesta ("we", "us") collects information you provide when you apply for a
            role, contact us, or use our website. This may include your name, email, phone number,
            country, work authorization status, resume, and any answers you submit during our
            interview process.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">2. How We Use Information</h3>
          <p className="mt-2 text-muted-foreground">
            We use applicant data solely to evaluate candidates, communicate about hiring decisions,
            facilitate onboarding, and process payments to contractors. We do not sell or rent
            personal data to third parties.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">3. Data Retention</h3>
          <p className="mt-2 text-muted-foreground">
            Application data is retained for up to 24 months. You may request deletion at any time
            by emailing talent@worknesta.com.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">4. Cookies</h3>
          <p className="mt-2 text-muted-foreground">
            We use essential cookies and basic analytics to improve our site. You can manage cookie
            preferences via the banner shown on first visit.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">5. Your Rights</h3>
          <p className="mt-2 text-muted-foreground">
            Depending on your jurisdiction, you may have rights to access, correct, or delete your
            personal data. Contact talent@worknesta.com to exercise any such rights.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">6. Contact</h3>
          <p className="mt-2 text-muted-foreground">
            Questions about this policy? Email talent@worknesta.com.
          </p>
        </article>
      </div>
    </Section>
  );
}
