import { Link } from "@tanstack/react-router";
import { Mail, Instagram, Youtube, Globe, ArrowRight, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#07103a] text-white">
      {/* Top CTA strip */}
      <div className="border-b border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Ready to start earning?</div>
            <div className="text-sm text-white/60 mt-0.5">Send your first video to Testbook. Approval in 24 hours.</div>
          </div>
          <Link to="/submit" className="btn-orange shrink-0">
            Send your video <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Main columns */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <img
              src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
              alt="Testbook"
              className="h-7 w-auto"
            />
            <div className="h-4 w-px bg-white/20" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Creators Lab</span>
          </div>
          <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-[220px]">
            India's largest exam-prep platform. Earn UPI payouts by creating videos Testbook can publish.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href="#"
              aria-label="Instagram"
              className="size-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center hover:bg-white/16 hover:border-white/25 transition-all"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="size-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center hover:bg-white/16 hover:border-white/25 transition-all"
            >
              <Youtube className="size-4" />
            </a>
          </div>
        </div>

        {/* Campaign links */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Campaign</div>
          <ul className="space-y-2.5">
            {[
              { to: "/", label: "How it works" },
              { to: "/how-to", label: "How To" },
              { to: "/submit", label: "Send a video" },
              { to: "/dashboard", label: "My dashboard" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-white/65 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Legal</div>
          <ul className="space-y-2.5">
                <li>
                <Link to="/terms" className="text-sm text-white/65 hover:text-white transition-colors">
                  Terms of campaign
                </Link>
              </li>
              {["Privacy policy", "Content guidelines", "Refund & payout policy"].map((label) => (
              <li key={label}>
                <a href="#" className="text-sm text-white/65 hover:text-white transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Support</div>
          <div className="space-y-3">
            <a
              href="mailto:creators@testbook.com"
              className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors"
            >
              <span className="size-7 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                <Mail className="size-3.5" />
              </span>
              creators@testbook.com
            </a>
            <a
              href="https://creatorlabs.testbook.com"
              className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors"
            >
              <span className="size-7 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                <Globe className="size-3.5" />
              </span>
              creatorlabs.testbook.com
            </a>
            <div className="flex items-center gap-2.5 text-sm text-white/65">
              <span className="size-7 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                <Phone className="size-3.5" />
              </span>
              Mon–Sat, 9 AM – 6 PM
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/40">
          <div>© {new Date().getFullYear()} Testbook Edu Solutions Pvt. Ltd. All rights reserved.</div>
          <div>Made with ❤️ for India's student creators</div>
        </div>
      </div>
    </footer>
  );
}
