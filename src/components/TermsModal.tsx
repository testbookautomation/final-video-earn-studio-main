import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ModalShell } from "./ModalShell";

const sections = [
  { id: "overview", title: "1. Overview", body: ["These Terms & Conditions govern your participation in the Testbook Creators Lab campaign, operated by Testbook.com. By submitting a video through the Creators Lab portal, you agree to be bound by these terms in their entirety.", "Creators Lab allows registered Testbook users to create short video content about their exam preparation experience with Testbook Pass and earn payouts based on campaign guidelines."] },
  { id: "eligibility", title: "2. Eligibility", intro: "To participate you must:", bullets: ["Be a registered user on Testbook.com with an active account.", "Have a valid phone number linked to your Testbook account.", "Not be a Testbook employee, contractor, or their immediate family member."] },
  { id: "participation", title: "3. Campaign Participation", bullets: ["Each participant may submit one (1) video per campaign cycle. Duplicates will be rejected.", "Log in to Creators Lab, create your video per guidelines, and upload via the Send Video option.", "All videos must be uploaded through the portal. Videos shared via email or social links will not be considered.", "Testbook may modify, pause, or discontinue any campaign at any time without prior notice."] },
  { id: "review", title: "4. Review & Approval", bullets: ["All submissions are subject to review. Testbook has sole discretion to approve, reject, edit, or publish any submission.", "Review typically takes 24–48 hours, though this timeline is not guaranteed.", "Rejected submissions will receive a reason where possible. Testbook may request minor modifications before approval."] },
  { id: "ip", title: "5. Ownership & IP", bullets: ["By submitting, you irrevocably transfer all rights, title, and interest in the video to Testbook.com including all intellectual property rights.", "Testbook may use, edit, distribute, and display the video across all media and platforms including social media, ads, and email.", "You waive any right to inspect or approve the final form of content as used by Testbook."] },
  { id: "payouts", title: "6. Payouts", bullets: ["Payout eligibility is determined solely by Testbook based on campaign criteria.", "Eligible payouts will be processed within 5–7 working days of eligibility confirmation.", "Payouts go to the UPI ID linked to your Testbook account. Ensure your UPI details are accurate. Testbook is not responsible for failed payments due to incorrect UPI info.", "Payout amounts are indicative and do not constitute a guarantee."] },
  { id: "prohibited", title: "7. Prohibited Conduct", intro: "These actions result in immediate disqualification:", bullets: ["Submitting content that is not your original work or infringes third-party rights.", "Submitting false, misleading, or fabricated information.", "Artificially manipulating view counts or engagement metrics.", "Using bots or automated tools on the portal.", "Attempting to revoke Testbook's rights to an approved video."] },
  { id: "privacy", title: "8. Privacy & Data", bullets: ["By participating, you consent to Testbook collecting and processing your name, phone, email, UPI details, and video content for campaign purposes.", "Your data is handled per Testbook's Privacy Policy at testbook.com/privacy."] },
  { id: "governing", title: "9. Governing Law", bullets: ["These terms are governed by the laws of India.", "Disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra, India."] },
];

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} title="Terms & Conditions">
      <div className="px-5 py-5 space-y-5">

        <p className="text-xs text-muted-foreground">
          Testbook Student Creator Campaign · Last updated: <strong className="text-tb-navy">May 2026</strong>
        </p>

        {sections.map((s) => (
          <section key={s.id} className="space-y-2">
            <h3 className="text-sm font-bold text-tb-navy">{s.title}</h3>
            {s.intro && <p className="text-xs text-muted-foreground">{s.intro}</p>}
            {"body" in s && s.body?.map((p, i) => (
              <p key={i} className="text-xs text-foreground/80 leading-relaxed">{p}</p>
            ))}
            {"bullets" in s && s.bullets && (
              <ul className="space-y-1.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                    <span className="size-1.5 rounded-full bg-tb-blue mt-1.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="pt-2 pb-4">
          <Link
            to="/submit"
            onClick={onClose}
            className="btn-primary w-full justify-center text-sm"
          >
            I Agree — Send my video <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </ModalShell>
  );
}
