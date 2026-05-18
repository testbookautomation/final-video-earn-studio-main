import { Link } from "@tanstack/react-router";
import { Mail, Sparkles, Instagram, Youtube, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 tb-gradient text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold">Testbook</div>
              <div className="text-xs text-white/70 -mt-0.5">Creator Lab</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/75 max-w-xs">
            India's largest exam-prep platform. Earn UPI payouts by promoting Testbook Pass to your audience.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Campaign</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><Link to="/" className="hover:text-white">How it works</Link></li>
            <li><Link to="/sop" className="hover:text-white">Creator SOP</Link></li>
            <li><Link to="/submit" className="hover:text-white">Submit a video</Link></li>
            <li><Link to="/dashboard" className="hover:text-white">My dashboard</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-white/75">
            <li><a href="#" className="hover:text-white">Terms of campaign</a></li>
            <li><a href="#" className="hover:text-white">Privacy policy</a></li>
            <li><a href="#" className="hover:text-white">Content guidelines</a></li>
            <li><a href="#" className="hover:text-white">Refund &amp; payout policy</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Support</div>
          <a href="mailto:creators@testbook.com" className="flex items-center gap-2 text-sm text-white/85 hover:text-white">
            <Mail className="size-4" /> creators@testbook.com
          </a>
          <a href="https://creatorlabs.testbook.com" className="mt-2 flex items-center gap-2 text-sm text-white/85 hover:text-white">
            <Globe className="size-4" /> creatorlabs.testbook.com
          </a>
          <div className="mt-4 flex items-center gap-2">
            <a href="#" className="size-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20"><Instagram className="size-4" /></a>
            <a href="#" className="size-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20"><Youtube className="size-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <div>© {new Date().getFullYear()} Testbook Edu Solutions Pvt. Ltd. All rights reserved.</div>
          <div>Made with ❤️ for India's student creators</div>
        </div>
      </div>
    </footer>
  );
}
