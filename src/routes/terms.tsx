import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText, ChevronRight, Mail, Globe } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Testbook Creator Lab" },
      { name: "description", content: "Read the full Terms & Conditions governing your participation in the Testbook Creators Lab campaign." },
      { property: "og:title", content: "Terms & Conditions — Testbook Creator Lab" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    body: [
      "These Terms & Conditions govern your participation in the Testbook Creators Lab campaign, operated by Testbook.com. By submitting a video through the Creators Lab portal, you agree to be bound by these terms in their entirety.",
      "Testbook Creators Lab is a student creator campaign that allows registered Testbook users to create short video content about their exam preparation experience with Testbook Pass and earn payouts based on campaign guidelines.",
    ],
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    intro: "To participate in the campaign, you must meet all of the following criteria:",
    bullets: [
      "You must be a registered user on Testbook.com with an active account.",
      "You must have a valid phone number linked to your Testbook account.",
      "Testbook employees, contractors, and their immediate family members are not eligible to participate.",
    ],
  },
  {
    id: "participation",
    title: "3. Campaign Participation",
    bullets: [
      "Each participant is allowed to submit one (1) video per campaign cycle. Duplicate or multiple submissions within the same campaign will be rejected.",
      "To participate, log in to the Creators Lab portal using your Testbook account, record your video as per the guidelines provided, and upload it by tapping the Submit Video option on the portal homepage.",
      "All videos must be uploaded directly through the Creators Lab portal. Videos shared via email, social media links, or any other channel will not be considered as valid submissions.",
      "Testbook reserves the right to modify, pause, or discontinue any campaign at any time without prior notice.",
    ],
  },
  {
    id: "review",
    title: "4. Review & Approval",
    bullets: [
      "All submitted videos are subject to review by the Testbook campaign team. Testbook reserves sole discretion to approve or reject any submission.",
      "The review process typically takes 24 to 48 hours from the time of submission, though this timeline is not guaranteed.",
      "If a video is rejected, the creator will be notified with the reason for rejection where possible. Testbook is not obligated to provide detailed feedback on every rejection.",
      "Testbook may request minor modifications to a submitted video before granting approval. The creator may choose to make the requested changes and resubmit, or withdraw the submission.",
    ],
  },
  {
    id: "ip",
    title: "5. Ownership & Intellectual Property",
    bullets: [
      "By submitting a video through the Creators Lab portal, you irrevocably transfer and assign all rights, title, and interest in the video to Testbook.com, including but not limited to all intellectual property rights, copyright, distribution rights, and the right to create derivative works.",
      "Testbook shall have the unrestricted right to use, reproduce, edit, crop, subtitle, adapt, publish, distribute, and display the video across all media and platforms, including but not limited to the Testbook website, mobile application, social media channels, paid advertising campaigns, email marketing, and third-party promotional partnerships.",
      "Testbook may use your name, likeness, voice, and any personal information visible or audible in the video for promotional and marketing purposes in connection with the campaign.",
      "You waive any right to inspect or approve the final form of the content as used by Testbook, and you waive any claims related to moral rights to the extent permitted by applicable law.",
      "You represent and warrant that the submitted video is your original creation, that you have full authority to transfer ownership, and that the video does not infringe upon the intellectual property rights, privacy rights, or any other rights of any third party.",
    ],
  },
  {
    id: "payouts",
    title: "6. Payouts",
    bullets: [
      "Payout eligibility is determined solely by Testbook based on the campaign criteria in effect at the time of submission.",
      "Eligible payouts will be processed within 5 to 7 working days from the date the video is confirmed as eligible.",
      "All payouts will be made directly to the UPI ID linked to your Testbook account. It is your responsibility to ensure that your UPI details are accurate and up to date in the Testbook app before your video becomes eligible for payout.",
      "Testbook is not responsible for failed, delayed, or misdirected payments resulting from incorrect or outdated UPI information provided by the creator.",
      "Payout amounts are determined by Testbook at its sole discretion based on the applicable campaign tier and guidelines. Payout amounts mentioned on the Creators Lab portal or campaign materials are indicative and do not constitute a guarantee.",
    ],
  },
  {
    id: "prohibited",
    title: "7. Prohibited Conduct",
    intro: "The following actions are strictly prohibited and may result in immediate disqualification, forfeiture of payout, and permanent ban from future campaigns:",
    bullets: [
      "Submitting a video that is not your original work or that infringes on any third-party rights.",
      "Submitting false, misleading, or fabricated information in your video or account details.",
      "Attempting to manipulate view counts, engagement metrics, or any campaign performance data through artificial or fraudulent means.",
      "Using automated tools, bots, or scripts to interact with the Creators Lab portal.",
      "Engaging in any behaviour that is abusive, threatening, or harmful to other participants, Testbook staff, or the campaign community.",
      "Deleting or making the submitted video inaccessible after submission and before the review and payout process is complete.",
    ],
  },
  {
    id: "privacy",
    title: "8. Privacy & Data",
    bullets: [
      "By participating in the campaign, you consent to Testbook collecting, storing, and processing your personal information including your name, phone number, email address, UPI details, and video content for the purposes of campaign administration, review, payout processing, and promotional use.",
      "Your data will be handled in accordance with the Testbook Privacy Policy available at testbook.com/privacy.",
    ],
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers",
    bullets: [
      "Testbook makes no guarantee regarding the number of views, reach, or performance of any submitted video.",
      "Testbook is not responsible for any technical issues, portal downtime, upload failures, or any other circumstances beyond its reasonable control that may affect your ability to participate in or benefit from the campaign.",
      "Testbook reserves the right to remove any published video at any time and for any reason without prior notice to the creator.",
    ],
  },
  {
    id: "modifications",
    title: "10. Modifications to These Terms",
    body: [
      "Testbook reserves the right to update, modify, or replace these Terms & Conditions at any time. Any changes will be posted on the Creators Lab portal. Your continued participation in the campaign after any such changes constitutes your acceptance of the revised terms. It is your responsibility to review these terms periodically.",
    ],
  },
  {
    id: "termination",
    title: "11. Termination & Disqualification",
    bullets: [
      "Testbook may terminate your participation in the campaign at any time and for any reason, including but not limited to violation of these terms or suspected fraudulent activity.",
      "Upon termination, you forfeit any pending or unpaid payouts unless Testbook determines otherwise at its sole discretion.",
      "Testbook's rights under Section 5 (Ownership & Intellectual Property) shall survive termination.",
    ],
  },
  {
    id: "governing",
    title: "12. Governing Law & Dispute Resolution",
    bullets: [
      "These Terms & Conditions shall be governed by and construed in accordance with the laws of India.",
      "Any disputes arising out of or in connection with these terms or the campaign shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra, India.",
      "Before initiating any formal legal proceedings, both parties agree to attempt to resolve disputes through good-faith negotiation for a period of not less than 30 days.",
    ],
  },
];

function TermsPage() {
  return (
    <>
      {/* Header */}
      <section className="tb-gradient text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 md:py-20 fade-up">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="https://cdn.testbook.com/1755173671769-testbook-logo.png/1755173673.png"
              alt="Testbook"
              className="h-7 w-auto brightness-0 invert opacity-90"
            />
          </div>
          <span className="badge bg-white/10 text-white border-white/20">
            <ScrollText className="size-3.5" /> Legal
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tb-text-gradient">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-white/70 max-w-2xl">
            Testbook Student Creator Campaign · Last updated: <strong className="text-white/90">May 2026</strong>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/submit" className="btn-orange">
              I Agree — Submit video <ChevronRight className="size-4" />
            </Link>
            <Link to="/" className="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/15 hover:text-white">
              Back to home
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-16 lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">

        {/* Sticky TOC — desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 card p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Contents</div>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-tb-navy hover:bg-secondary px-2 py-1.5 rounded-lg transition-colors"
                >
                  <ChevronRight className="size-3 shrink-0" />
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Sections */}
        <main className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-bold text-tb-navy border-b border-border pb-2 mb-4">{s.title}</h2>
              {s.intro && (
                <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{s.intro}</p>
              )}
              {s.body?.map((para, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-3">{para}</p>
              ))}
              {s.bullets && (
                <ul className="space-y-2.5">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-1.5 size-1.5 rounded-full bg-tb-blue shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Footer contact */}
          <div className="card p-6 tb-gradient text-white">
            <div className="text-base font-semibold mb-3">Testbook Creators Lab</div>
            <div className="space-y-2 text-sm text-white/80">
              <a href="mailto:creator-support@testbook.com" className="flex items-center gap-2 hover:text-white">
                <Mail className="size-4" /> creator-support@testbook.com
              </a>
              <a href="https://ugc.testbook.com" className="flex items-center gap-2 hover:text-white">
                <Globe className="size-4" /> ugc.testbook.com
              </a>
            </div>
            <p className="mt-4 text-xs text-white/60">© 2026 Testbook.com. All rights reserved.</p>
          </div>

          {/* Bottom CTA */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/submit" className="btn-primary">
              I agree to these terms — Continue <ChevronRight className="size-4" />
            </Link>
            <Link to="/" className="btn-ghost">Back to home</Link>
          </div>
        </main>
      </div>
    </>
  );
}
