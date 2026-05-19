import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, IndianRupee, Users, Trophy, CheckCircle2,
  LogIn, Video, Upload, ShieldCheck, Wallet, ChevronDown, ListChecks,
  Zap, Clock, X,
} from "lucide-react";
import { getUser, type TBUser } from "@/lib/auth";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Testbook Creator Lab - Create videos Testbook can publish" },
      { name: "description", content: "Create a short video for Testbook Pass, upload it to Testbook, and earn ₹200 to ₹1,000 via UPI when Testbook-published videos cross view milestones in 48 hours." },
      { property: "og:title", content: "Testbook Creator Lab - Create videos Testbook can publish" },
      { property: "og:description", content: "Upload your creator video to Testbook. We publish approved videos and pay UPI payouts based on view milestones." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const steps = [
  { Icon: LogIn,       title: "Login with phone",  desc: "OTP login in 30 seconds. Your linked UPI is checked automatically." },
  { Icon: Video,       title: "Create your video", desc: "Record a 30–60 second vertical video pitching Testbook Pass." },
  { Icon: Upload,      title: "Send it to us",     desc: "Upload the finished video file directly to Testbook." },
  { Icon: ShieldCheck, title: "We publish it",     desc: "Our team reviews, approves, and publishes selected videos." },
  { Icon: Wallet,      title: "UPI payout",        desc: "Views on the Testbook-published video unlock payouts." },
];

const tiers = [
  { views: "5,000 views in 48h",  amount: "₹200",  color: "from-blue-500 to-indigo-500",    label: "Starter" },
  { views: "10,000 views in 48h", amount: "₹350",  color: "from-indigo-500 to-violet-500",  label: "Rising" },
  { views: "20,000 views in 48h", amount: "₹500",  color: "from-violet-500 to-fuchsia-500", label: "Popular" },
  { views: "50,000+ views in 48h",amount: "₹1,000",color: "from-fuchsia-500 to-orange-500", label: "Viral" },
];

const dos = [
  "Speak in your audience's language — Hindi or regional languages are great",
  "Show the Testbook app on screen while talking",
  "Mention the specific exam you're preparing for",
  "Upload a clean, final video that Testbook can publish",
];
const donts = [
  "Don't fake reviews or buy views — instant disqualification",
  "No abusive, political or sensitive content allowed",
  "Don't show competing apps or services in the video",
  "No misleading guarantees about exam results",
];

const faqs = [
  { q: "Who can apply to Creator Lab?", a: "Any student or aspirant in India with a public Instagram or YouTube profile. Min 500 followers recommended but not mandatory — content quality matters more." },
  { q: "When do I get paid?", a: "Within 48 hours of the Testbook-published video crossing each view milestone. Payouts are sent directly to the UPI ID linked to your phone number." },
  { q: "Can I submit more than one video?", a: "Yes. Upload each finished video as a separate entry. Testbook will review and decide which videos to publish." },
  { q: "What if my video is rejected?", a: "You'll get a reason in your dashboard. You can revise and resubmit. We approve ~85% of submissions on the first try." },
  { q: "Is there a follower count requirement?", a: "No minimum follower count is required. We care more about content quality and authentic reach than follower numbers." },
];

function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [user, setUser] = useState<TBUser | null>(null);

  useEffect(() => { track("page_view", { page: "/" }); }, []);

  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener("tb:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tb:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative tb-gradient text-white overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,#60a5fa_0,transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 fade-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tb-text-gradient">
              Create the video.<br />Send it to Testbook.<br />We publish and pay.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/85 max-w-xl leading-relaxed">
              Join <strong className="text-white">12,000+ student creators</strong> making publish-ready videos for Testbook Pass. Upload the file to us, we publish approved videos, and payouts go directly to your UPI account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/submit" className="btn-orange text-base px-6 py-3.5">
                Send your video <ArrowRight className="size-4" />
              </Link>
              <Link to="/how-to" className="btn-ghost bg-white/10 border-white/25 text-white hover:bg-white/18 hover:text-white text-base px-6 py-3.5">
                How To
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-9 grid grid-cols-3 gap-3 max-w-md">
              {[
                { Icon: Users,        k: "12K+",  v: "Creators onboarded" },
                { Icon: IndianRupee,  k: "₹4.2Cr",v: "Paid out in 2025" },
                { Icon: Trophy,       k: "85%",   v: "Approval rate" },
              ].map(({ Icon, k, v }) => (
                <div key={k} className="glass p-4 flex flex-col gap-2 hover:bg-white/12 transition-colors">
                  <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon className="size-4 text-tb-blue-light" />
                  </div>
                  <div className="text-2xl font-black">{k}</div>
                  <div className="text-xs text-white/70 leading-snug">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Creator Brief card */}
          <div className="lg:col-span-5 fade-up">
            <div className="card p-6 bg-white text-foreground">
              <div className="flex items-center justify-between">
                <span className="badge badge-orange text-xs"><ListChecks className="size-3.5" /> Creator Brief</span>
                <span className="text-xs text-muted-foreground font-medium">Updated this week</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-tb-navy">Create for Testbook Pass - All Exams</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">A 30–60 second publish-ready video showing why Testbook Pass works for your exam.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Brief k="Format" v="Vertical 9:16" />
                <Brief k="Duration" v="30–60 seconds" />
                <Brief k="Audience" v="Instagram · YouTube" />
                <Brief k="Publishing" v="Handled by Testbook" />
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-xs font-bold text-tb-navy mb-1.5 uppercase tracking-wide">Hook idea</div>
                <p className="text-sm text-foreground/75 leading-relaxed italic">"Stop wasting ₹2000/month on coaching — here's what I switched to."</p>
              </div>
              <Link to="/how-to" className="mt-5 btn-primary w-full text-sm">How To</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge text-xs"><CheckCircle2 className="size-3.5" /> How it works</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-tb-navy">5 steps from idea to UPI</h2>
          <p className="mt-3 text-base text-muted-foreground">You create the video. You give it to us. Testbook publishes approved videos.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-5 fade-up hover:-translate-y-1 hover:shadow-lg transition-all duration-200" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-xl tb-gradient flex items-center justify-center text-white shadow-sm">
                  <s.Icon className="size-5" />
                </div>
                <span className="size-7 rounded-full border-2 border-border text-xs font-black text-muted-foreground flex items-center justify-center">{i + 1}</span>
              </div>
              <div className="mt-4 text-xs font-bold text-tb-blue tracking-widest uppercase">Step {i + 1}</div>
              <div className="text-sm font-bold text-tb-navy mt-1">{s.title}</div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTENT GUIDE ── */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20 grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <span className="badge badge-green text-xs">What works</span>
            <h2 className="mt-4 text-2xl font-bold text-tb-navy">Content that gets approved</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Honest creators outperform polished scripts every time.</p>
            <div className="mt-5 space-y-3">
              {dos.map((d) => (
                <div key={d} className="flex items-start gap-3 text-sm p-3 rounded-xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100">
                  <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-foreground/85 leading-relaxed">{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <span className="badge badge-red text-xs">Auto-rejected</span>
            <h2 className="mt-4 text-2xl font-bold text-tb-navy">Things that get you rejected</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Save yourself a resubmit — read these before you hit record.</p>
            <div className="mt-5 space-y-3">
              {donts.map((d) => (
                <div key={d} className="flex items-start gap-3 text-sm p-3 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                  <X className="size-5 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/85 leading-relaxed">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYOUT TIERS ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge badge-orange text-xs"><IndianRupee className="size-3.5" /> Payout tiers</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-tb-navy">Cross a milestone, get paid</h2>
          <p className="mt-3 text-base text-muted-foreground">Payouts are cumulative — every milestone you cross adds to the next payout.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, i) => {
            const popular = i === 2;
            return (
              <div key={t.views} className={`card relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${popular ? "ring-2 ring-tb-blue/40 shadow-md" : ""}`}>
                {/* top bar on sm+, left bar on mobile */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-auto sm:inset-x-0 sm:bottom-auto sm:h-1.5 bg-gradient-to-b sm:bg-gradient-to-r ${t.color}`} />

                {/* mobile: horizontal row */}
                <div className="flex items-center justify-between gap-3 pl-5 pr-4 py-4 sm:hidden">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.label}</span>
                      {popular && <span className="text-[10px] font-bold bg-tb-orange/10 text-tb-orange px-1.5 py-0.5 rounded-full">Popular</span>}
                    </div>
                    <div className="text-sm font-semibold text-tb-navy mt-0.5">{t.views}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-tb-orange">{t.amount}</div>
                    <div className="text-[11px] text-muted-foreground font-medium">via UPI</div>
                  </div>
                </div>

                {/* sm+: vertical card */}
                <div className="hidden sm:block p-5 mt-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.label}</div>
                    {popular && <span className="text-[10px] font-bold bg-tb-orange/10 text-tb-orange px-1.5 py-0.5 rounded-full leading-none">Popular</span>}
                  </div>
                  <div className="text-sm font-bold text-tb-navy mt-1">{t.views}</div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-3xl font-black text-tb-orange">{t.amount}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">paid via UPI within 48h</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 card p-5 bg-blue-50 border-blue-100 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-tb-blue/10 text-tb-blue flex items-center justify-center shrink-0">
            <Zap className="size-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-tb-navy">Payouts are cumulative</div>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Example: if your video hits 50,000+ views in 48h, you earn ₹200 + ₹350 + ₹500 + ₹1,000 = <strong className="text-tb-navy">₹2,050 total</strong>. Every milestone builds on the previous one.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center">
          <span className="badge text-xs">FAQ</span>
          <h2 className="mt-4 text-3xl font-bold text-tb-navy">Questions, answered</h2>
          <p className="mt-3 text-base text-muted-foreground">Everything you need to know before you hit record.</p>
        </div>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className={`card overflow-hidden transition-all ${open ? "ring-2 ring-tb-blue/20" : ""}`}>
                <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                  <span className="font-semibold text-tb-navy text-base">{f.q}</span>
                  <ChevronDown className={`size-5 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed fade-up">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="card p-8 md:p-14 tb-gradient text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_50%,#60a5fa_0,transparent_40%),radial-gradient(circle_at_70%_50%,#f97316_0,transparent_45%)]" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="size-5 text-white/70" />
              <span className="text-white/70 text-sm font-medium">Send in under 5 minutes</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tb-text-gradient">Your phone is your studio.</h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto text-base leading-relaxed">
              Record a 30–60 second video today, upload it to Testbook, and let our team publish approved videos for milestone payouts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/submit" className="btn-orange text-base px-8 py-3.5">Send your video <ArrowRight className="size-4" /></Link>
              {user ? (
                <Link to="/dashboard" className="btn-ghost bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white text-base px-8 py-3.5">View dashboard</Link>
              ) : (
                <Link to="/login" className="btn-ghost bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white text-base px-8 py-3.5">Login first</Link>
              )}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

function Brief({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border p-3 bg-secondary/30">
      <div className="text-xs text-muted-foreground font-medium mb-0.5">{k}</div>
      <div className="text-sm font-bold text-tb-navy">{v}</div>
    </div>
  );
}
