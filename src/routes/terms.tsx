import { createFileRoute } from "@tanstack/react-router";
import { Section, SectionHeader } from "@/components/site/Section";
import { BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Worknesta" },
      {
        name: "description",
        content: "Terms and Conditions for using the Worknesta platform and contractor workspace.",
      },
      { property: "og:title", content: "Terms and Conditions — Worknesta" },
      {
        property: "og:description",
        content: "Rules for using Worknesta, completing transcription tasks, and receiving payouts.",
      },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Introduction",
    body: [
      `These Terms and Conditions (“Terms”) govern your access to and use of the ${BRAND_NAME} website, contractor workspace, sign-in process, help center, settings, and related services (together, the “Platform”). ${BRAND_NAME} provides remote transcription and related work to independent contractors. These Terms explain how the Platform works, what we expect from you, and how tasks, reviews, and payouts are handled.`,
      `By creating or using a workspace account, requesting a sign-in link, checking “I agree to the Terms and Conditions,” submitting a task, or otherwise using the Platform, you confirm that you have read these Terms and agree to be bound by them. If you are using the Platform on behalf of someone else, you also confirm that you have authority to bind that person.`,
      `${BRAND_NAME} never charges applicants or contractors a fee to apply, sign in, receive a workspace link, or be considered for work. We will not ask you to pay to “unlock” tasks, speed up review, or keep an account open. If anyone claiming to represent us asks you for money, gift cards, crypto, or similar payment, it is not us. Report it immediately to ${BRAND_SUPPORT_EMAIL} and do not send funds.`,
      "These Terms apply in addition to any offer letter, non-disclosure agreement, or contractor agreement you may have signed. If there is a direct conflict between a signed contractor agreement and these Terms on a payment or engagement point, the signed agreement controls for that point. For how you use the Platform day to day, these Terms apply.",
      "The Platform is offered as a professional tool. It is not a consumer social network. You should only use it if you are an authorized applicant or contractor. If you do not agree to these Terms, you must not request a sign-in link or use the workspace.",
      `Questions about these Terms can be sent to ${BRAND_SUPPORT_EMAIL} before you agree. Agreeing at sign-in means you accept the version published on this page at that time.`,
    ],
  },
  {
    title: "Use of the Platform",
    body: [
      "The Platform is provided so authorized users can manage their relationship with Worknesta. That includes applying where relevant, signing in with a magic link, viewing assigned modules and tasks, submitting transcriptions, checking earnings, uploading documents, updating payment details, and contacting support.",
      "You may use the Platform only for lawful purposes and only in line with these Terms and any workspace instructions we publish. You must not use the Platform in any way that could damage, disable, overburden, or impair our systems, or that could interfere with anyone else’s use of the Platform.",
      "You must not attempt to gain unauthorized access to any account, server, audio file, transcript, or database connected with the Platform. You must not probe, scan, or test the vulnerability of the Platform, bypass rate limits or sign-in controls, or use automated tools to harvest content, emails, or task materials.",
      "Task audio, transcripts, client names, medical or business content, and internal notes are confidential. You may not copy, download for unrelated use, share, publish, sell, or train other systems on that material. Completing a task does not give you any ownership of the audio, the client’s content, or the finished transcript beyond the limited right to submit your work for review.",
      "We may update features, move pages, pause modules, close a submission window, or change how verification and support work. We will try to keep the workspace usable, but we do not guarantee uninterrupted access, error-free software, or that every feature will remain available in the same form.",
      "We may suspend, throttle, or limit access when we reasonably believe these Terms have been breached, when we need to protect the Platform, our clients, or other users, or when we are required to do so by law. Temporary maintenance or security incidents may also make the Platform unavailable for a period.",
      "Sign-in links are personal. Do not forward a sign-in link to another person or use someone else’s email to enter the workspace. If you believe your email or link has been misused, contact support at once so we can protect the account.",
    ],
  },
  {
    title: "User Responsibilities",
    body: [
      "You are responsible for the security of the email address used to sign in and for all activity that occurs in your workspace. Keep sign-in links private. Do not share your account with family, colleagues, or paid assistants. Work submitted from your account is treated as your work.",
      "You agree to provide truthful information in your application, profile, documents, and payment details. False names, false certificates, or payment details that do not belong to you may lead to withheld payouts, suspension, or removal from the Platform.",
      "You must complete assigned transcription work yourself. You may use ordinary playback tools (pause, rewind, speed control) that we provide. You may not outsource tasks to another person, use unapproved automated transcription to generate a submission you pass off as your own, or paste content you did not transcribe from the assigned audio.",
      "You must follow workspace instructions, including speaker labels, verbatim style, and how to flag unclear speech. Where audio is not clear, use [inaudible] or the flags described in the workspace guide. Do not invent words, drug names, figures, or speakers to fill gaps.",
      "You must not share task audio, transcripts, client information, medical content, or other confidential materials outside the Platform. That includes screenshots, file transfers, public posts, and unofficial group chats. If you need help, use the Help Center so we can assist without spreading client material.",
      "You are responsible for the equipment and internet connection you use. Slow connections, device failure, or local power issues do not automatically extend a submission window, though you may contact support as early as possible if you cannot finish in time.",
      "All Worknesta team members engaged through this Platform are independent contractors, not employees, unless a signed agreement expressly says otherwise. You are responsible for your own taxes, local registrations, and how you report income. Compensation, invoices, and tax treatment are addressed in your contractor agreement where one exists.",
      "Keep payment details in Settings current and accurate. We are not responsible for payouts sent to details you entered incorrectly, or for delays caused by your payment provider after we have released funds according to our schedule.",
    ],
  },
  {
    title: "Transcription Tasks and Modules",
    body: [
      "Work is organized into modules. Each module contains transcription tasks. A task typically includes audio, a title, a short description, an expected duration, and a listed earnings amount. Some tasks may require a certificate or other document before they can be started.",
      "Modules may unlock in sequence. Later modules may remain unavailable until earlier work is submitted or until we open them. We may also mark a module or remaining unfinished tasks as closed when a submission window ends. A closed window does not erase work you already submitted.",
      "Each module has a time frame for completion, which may be shown as a deadline or described in the workspace. You should complete and submit tasks within that window. If you need more time, contact support as early as you can and before the window ends. Extra time is not guaranteed.",
      "Submitting a task means you confirm that the transcript is your own work, that you followed the instructions, and that it is ready for review. Once you submit, you should not assume you can keep editing. If a window is later closed, new submissions for unfinished tasks in that module are not accepted.",
      "Some tasks involve general business or event audio. Others may involve medical, legal, or other specialized content. Where a medical or similar certificate is required, you must complete the verification or upload steps we provide before starting those tasks. Uploading a file does not always replace URL or code verification where that step is required.",
      "Task audio and related files are licensed to you only for completing the assigned task. When the task is submitted, closed, or withdrawn, that limited permission ends. You should not keep personal copies of client audio for any other purpose.",
      "Listed earnings are for a complete, review-approved submission of that task, subject to the accuracy standard and these Terms. Starting a task, listening to audio, or saving a draft does not by itself create a right to payment.",
      "For first-time modules, earnings are credited on module completion and not per individual task. Completing or submitting one task in a first-time module does not by itself create a right to payout for that task. Payout for that module is considered after the module is complete, subject to review, the accuracy standard, and these Terms.",
      "We may correct task titles, audio files, or instructions if we find an error. If a task cannot be completed because of a platform fault (for example, missing audio that is our responsibility), contact support. We will consider a fair remedy, which may include extra time or withdrawing the task. That is not an admission of liability beyond these Terms.",
    ],
  },
  {
    title: "Accuracy Requirements",
    body: [
      "Modules scoring below 97% may not qualify for payout. This is the quality standard we use for transcription work on the Platform. A score at or above 97% is the usual basis for treating a module as eligible for payout, subject to review, these Terms, and any signed contractor agreement.",
      "Accuracy is assessed against the assigned audio and the instructions for that task. Reviewers look at whether speech is captured faithfully, whether speakers are identified as required, whether numbers, names, and technical terms are handled with care, and whether unclear sections are flagged instead of guessed.",
      "We expect careful, verbatim transcription unless a task description says otherwise. Do not clean up grammar in a way that changes meaning if the instruction is to transcribe what was said. Do not omit repeated words, false starts, or speaker changes if the guide says to keep them.",
      "Unclear audio should be marked with [inaudible] or the specific flags in the workspace guide. Guessing at drug names, dosages, legal citations, or figures you cannot hear may lower your score and can be treated as a quality failure even if the rest of the transcript is strong.",
      "Work that falls below the 97% accuracy standard may be ineligible for payment for that task, in whole or in part, as determined through review. Repeated scores below the standard may lead to coaching, fewer assignments, or account action under the suspension section below.",
      "An accuracy score shown in the workspace after review is provided to help you understand the outcome. Where a stored review score exists, that score is used for the payout decision for that task. If no stored score is available, we may still apply the 97% rule using our review records.",
      "You are responsible for checking playback, spelling of repeated terms, and formatting before you submit. A rushed submission is still measured against the same 97% standard.",
    ],
  },
  {
    title: "Review Process",
    body: [
      "Every submitted task is reviewed for accuracy and completeness before it is treated as payable. Review may be done by our team, by trained reviewers, or by a combination of human review and internal quality checks.",
      "Most tasks are reviewed within 48 hours of submission. That is our normal target, not a guaranteed service level in every case. Volume, holidays, task length, and specialized content (including medical audio) can mean some reviews take longer.",
      "When review is complete, the task status in your workspace may change (for example, from submitted to reviewed). Where we record an accuracy score, it may appear on the task. Earnings associated with approved work are then handled according to our payout calendar, usually on or around the 1st and 15th of the month, after review and subject to correct payment details.",
      "A task that is still “submitted” or “under review” has not yet been accepted for payout. Do not treat listed task amounts as money already owed until review is complete and the work qualifies under the accuracy rule.",
      "We may reopen a review if we discover a process error, a scoring mistake, or a compliance issue, even after a status has been shown in the workspace. If that happens, we will update the record. Any change to payout will follow the corrected review.",
      "Reviewers may note issues such as missing speakers, invented content, or failure to flag inaudible sections. Those notes support the score; they are not a public discussion forum. If you disagree with the outcome, use the re-review policy below rather than resubmitting the same task outside the workspace.",
      "Payment is sent using the method you saved in Settings. Delays at your bank or payout provider after we have processed an eligible payment are outside our control. Keep your method up to date so reviewed earnings can be released without extra back-and-forth.",
    ],
  },
  {
    title: "Re-review Policy",
    body: [
      "If you believe a review result is incorrect, you may request a re-review. The purpose of re-review is to check whether the original score or outcome was applied fairly against the audio and the task instructions. It is not a second chance to rewrite the transcript.",
      "You may request a re-review once per task, and only within 7 days of the original review outcome being made available to you in the workspace (or otherwise communicated). Requests sent after that 7-day window may be declined as out of time.",
      "Send the request through the Help Center. Identify the task clearly (module and task name or number) and explain, briefly, why you think the score or decision is wrong. Vague complaints without a task reference may be returned for more detail and can miss the 7-day window.",
      "We will consider one re-review in that window. We are not obliged to run further reviews of the same task, to debate the result at length, or to accept new transcript text as part of the re-review. The re-reviewer may confirm the original score, raise it, or lower it if additional errors are found.",
      "The re-review decision is final for that task unless we choose, at our discretion, to look at it again because of a clear system error. A re-review that confirms the original outcome does not restart the 7-day period.",
      "Re-review does not pause unrelated tasks. You should continue to follow submission windows for other work. A pending re-review is not a reason to miss a deadline on a different task.",
      "Abusive, repeated, or bad-faith re-review requests may be ignored and may be considered under Account Suspension. Using re-review to delay accountability for work that clearly falls below 97% is not permitted.",
    ],
  },
  {
    title: "Account Suspension",
    body: [
      "We may suspend, restrict, or close your account if you breach these Terms. Examples include submitting work that is not your own, repeatedly missing the 97% accuracy standard, sharing audio or transcripts, using someone else’s certificate or payment details, attempting to bypass sign-in or task locks, or behaving in a way that harms clients, other contractors, or Worknesta.",
      "We may also suspend access while we investigate suspected fraud, credential sharing, unauthorized automation, or misuse of task materials. During an investigation you may be unable to start or submit tasks. Already-submitted work may still be reviewed. Payouts may be held until the investigation is finished.",
      "Where we reasonably can, we will explain the reason for a suspension and, if appropriate, what you can do next. We may not share full details if doing so would compromise a client, another user, or an ongoing investigation.",
      "Serious or repeated issues may result in permanent removal from the Platform. Permanent removal means you lose access to the workspace. It does not automatically cancel an obligation to keep client materials confidential. Work that already qualified for payout may still be paid according to the review outcome, unless the breach relates to that work (for example, plagiarized transcripts).",
      "We may refuse a new application or a new sign-in from an email or identity we associate with a closed account. Creating a second account to avoid a suspension is itself a breach of these Terms.",
      `If you believe a suspension was applied in error, contact ${BRAND_SUPPORT_EMAIL} or use the Help Center from any access you still have. We will consider a good-faith request. There is no obligation to restore an account that we reasonably believe was used in breach of these Terms.`,
      "Nothing in this section limits our right to take other steps allowed by law, including reporting illegal activity or protecting intellectual property and client confidentiality.",
    ],
  },
  {
    title: "Changes to Terms",
    body: [
      "We may update these Terms from time to time. Reasons include new features, changes to how modules and reviews work, legal requirements, or clearer wording. The “Last updated” date at the top of this page shows when the current version took effect.",
      "When we make a material change, we may also notify you in the workspace (for example, with a notice) or by email to the address you use to sign in. We are not required to obtain a new checkbox click for every wording change, but we may ask you to agree again at sign-in when we believe the change is significant.",
      "The current version of these Terms is always the version published at this URL. You should review this page periodically. Continued use of the Platform after an update means you accept the revised Terms.",
      `If you do not agree with an update, you should stop using the Platform and contact ${BRAND_SUPPORT_EMAIL}. You may not continue to submit tasks or use the workspace under protest of Terms you have rejected. Stopping use does not cancel confidentiality duties or affect reviews of work already submitted.`,
      "If a court or other authority finds any part of these Terms unenforceable, the rest remains in effect. Our failure to enforce a provision once is not a waiver of our right to enforce it later.",
      `These Terms are the complete agreement between you and ${BRAND_NAME} regarding use of the Platform, except where a signed contractor, offer, or non-disclosure agreement also applies as described in the Introduction. They replace earlier website terms covering the same subject, including any prior “Terms of Service” page on this site.`,
      `For questions about these Terms, email ${BRAND_SUPPORT_EMAIL}. We will do our best to explain how a section applies to your situation, but an email reply is not a formal amendment unless we publish an updated version of this page.`,
    ],
  },
];

function TermsPage() {
  return (
    <Section>
      <div className="container-page px-4">
        <SectionHeader
          eyebrow="Legal"
          title="Terms and Conditions"
          description={`Please read these Terms carefully before using ${BRAND_NAME}.`}
        />

        <article className="mx-auto mt-10 max-w-3xl">
          <p className="text-sm text-ink/50">Last updated: May 12, 2026</p>

          <div className="mt-8 space-y-8 md:space-y-10">
            {SECTIONS.map((section, i) => (
              <section key={section.title} className="border-t border-ink/10 pt-6 md:pt-8">
                <h2 className="text-base font-semibold tracking-tight text-ink md:text-lg">
                  <span className="mr-2 text-ink/35">{i + 1}.</span>
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/70 md:text-[15px] md:leading-7">
                  {section.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 text-sm text-ink/50">
            Questions about these Terms? Email{" "}
            <a href={`mailto:${BRAND_SUPPORT_EMAIL}`} className="font-medium text-ink underline underline-offset-2">
              {BRAND_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </article>
      </div>
    </Section>
  );
}
