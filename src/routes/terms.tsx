import { createFileRoute } from "@tanstack/react-router";
import { Section, SectionHeader } from "@/components/site/Section";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Worknesta" },
      { name: "description", content: "Terms governing use of the Worknesta website and application process." },
      { property: "og:title", content: "Terms of Service — Worknesta" },
      { property: "og:description", content: "The rules of the road for visitors and applicants." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Section>
      <div className="container-page">
        <SectionHeader eyebrow="Legal" title="Terms of Service" />
        <article className="mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">Last updated: January 2025</p>
          <h3 className="mt-6 text-lg font-semibold text-navy">1. Acceptance of Terms</h3>
          <p className="mt-2 text-muted-foreground">
            By accessing or using worknesta.com, you agree to be bound by these Terms of
            Service.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">2. No Application Fees</h3>
          <p className="mt-2 text-muted-foreground">
            Worknesta never charges applicants any fees. If you are contacted by anyone
            requesting payment to be considered for a role, it is not us. Report it to
            talent@worknesta.com.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">3. Application Accuracy</h3>
          <p className="mt-2 text-muted-foreground">
            You agree to provide truthful information in any application or interview. False
            statements may result in disqualification or termination of any subsequent contractor
            relationship.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">4. Independent Contractors</h3>
          <p className="mt-2 text-muted-foreground">
            All Worknesta team members are engaged as independent contractors. Compensation,
            payment terms, and tax responsibilities are addressed in your individual contractor
            agreement.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">5. Intellectual Property</h3>
          <p className="mt-2 text-muted-foreground">
            All website content, including logos and designs, are the property of Worknesta
            and may not be reproduced without permission.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">6. Limitation of Liability</h3>
          <p className="mt-2 text-muted-foreground">
            The site is provided "as is". We make no warranties regarding uptime or fitness for a
            particular purpose.
          </p>
          <h3 className="mt-6 text-lg font-semibold text-navy">7. Changes</h3>
          <p className="mt-2 text-muted-foreground">
            We may update these terms periodically. Continued use of the site constitutes
            acceptance of any updates.
          </p>
        </article>
      </div>
    </Section>
  );
}
