import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, Play, IndianRupee, Users, Trophy, Sparkles, CheckCircle2,
  LogIn, Video, Upload, ShieldCheck, Wallet, Star, ChevronDown, X, Hash,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Testbook Creator Lab — Earn UPI for promoting Testbook Pass" },
      { name: "description", content: "Submit a short video promoting Testbook Pass and earn ₹500 to ₹25,000 via UPI based on view milestones. Built for India's student creators." },
      { property: "og:title", content: "Testbook Creator Lab — Earn UPI for promoting Testbook Pass" },
      { property: "og:description", content: "Submit a short video promoting Testbook Pass and earn UPI payouts based on view milestones." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const steps = [
  { Icon: LogIn, title: "Login with phone", desc: "OTP login. Set up your UPI in 30 seconds." },
  { Icon: Video, title: "Record your reel", desc: "30–60s vertical video pitching Testbook Pass." },
  { Icon: Upload, title: "Upload & submit", desc: "Drop the public link of your reel + caption." },
  { Icon: ShieldCheck, title: "Approval", desc: "Our team verifies content & guideline fit in 24h." },
  { Icon: Wallet, title: "UPI Payout", desc: "Hit milestones → instant UPI transfer." },
];

const tiers = [
  { views: "10K views", amount: "₹500",   color: "from-blue-500 to-indigo-500" },
  { views: "50K views", amount: "₹2,500", color: "from-indigo-500 to-violet-500" },
  { views: "1L views",  amount: "₹6,000", color: "from-violet-500 to-fuchsia-500" },
  { views: "5L views",  amount: "₹15,000", color: "from-fuchsia-500 to-orange-500" },
  { views: "10L views", amount: "₹25,000", color: "from-orange-500 to-rose-500" },
];

const dos = [
  "Speak in your audience's language (Hindi/regional ok)",
  "Show the Testbook app on screen",
  "Mention an exam you actually prep for",
  "Use the campaign hashtag in caption",
];
const donts = [
  "Don't fake reviews or buy views",
  "No abusive, political or sensitive content",
  "Don't show competing apps",
  "No misleading guarantees on results",
];

const testimonials = [
  { name: "Priya S.", handle: "@priyasolves", exam: "SSC CGL", earnings: "₹18,400", views: "6.2L", thumb: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600&q=70" },
  { name: "Arjun K.",  handle: "@arjun.studies", exam: "NEET",   earnings: "₹12,500", views: "3.8L", thumb: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&q=70" },
  { name: "Neha R.",   handle: "@neha.banks",   exam: "Banking", earnings: "₹6,000",  views: "1.4L", thumb: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=70" },
];

const faqs = [
  { q: "Who can apply to Creator Lab?", a: "Any student or aspirant in India with a public Instagram, YouTube, or Facebook profile. Min 500 followers recommended but not mandatory — content quality matters more." },
  { q: "When do I get paid?", a: "Within 48 hours of crossing each view milestone. Payouts are sent directly to the UPI ID linked to your phone number." },
  { q: "Can I post the same video on multiple platforms?", a: "Yes. Submit one platform per entry — your highest-performing post will be considered for payout." },
  { q: "What if my video is rejected?", a: "You'll get a reason in your dashboard. You can revise and resubmit. We approve ~85% of submissions on the first try." },
];

function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [video, setVideo] = useState<typeof testimonials[number] | null>(null);

  return (
    <>
      {/* HERO */}
      <section className="relative tb-gradient text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,#60a5fa_0,transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 fade-up">
            <span className="badge bg-white/10 text-white border-white/20">
              <Sparkles className="size-3.5" /> Creator campaign · 2026
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tb-text-gradient">
              Make a reel. <br />Promote Testbook Pass. <br />Get paid in UPI.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/80 max-w-xl">
              Join 12,000+ student creators earning ₹500 to ₹25,000 per video — based on real view milestones, paid directly to your UPI.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/submit" className="btn-orange">
                Submit your video <ArrowRight className="size-4" />
              </Link>
              <Link to="/sop" className="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/15 hover:text-white">
                Read creator SOP
              </Link>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-4 max-w-md">
              {[
                { Icon: Users, k: "12K+", v: "Creators onboarded" },
                { Icon: IndianRupee, k: "₹4.2Cr", v: "Paid out in 2025" },
                { Icon: Trophy, k: "85%", v: "Approval rate" },
              ].map(({ Icon, k, v }) => (
                <div key={k} className="glass p-3">
                  <Icon className="size-4 text-tb-blue-light" />
                  <div className="mt-1.5 text-xl font-bold">{k}</div>
                  <div className="text-[11px] text-white/70">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Creator Brief card */}
          <div className="lg:col-span-5 fade-up">
            <div className="card p-6 bg-white text-foreground">
              <div className="flex items-center justify-between">
                <span className="badge badge-orange"><Hash className="size-3" /> Creator Brief</span>
                <span className="text-xs text-muted-foreground">Updated this week</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-tb-navy">Promote Testbook Pass — All Exams</h3>
              <p className="text-sm text-muted-foreground mt-1">A 30–60s honest reel showing why Testbook Pass works for your exam.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Brief k="Format" v="Vertical 9:16" />
                <Brief k="Duration" v="30–60 seconds" />
                <Brief k="Platforms" v="IG · YT · FB" />
                <Brief k="Hashtag" v="#TestbookPass" />
              </div>
              <div className="mt-4 p-3 rounded-xl bg-secondary border border-border">
                <div className="text-xs font-semibold text-tb-navy mb-1">Hook idea</div>
                <p className="text-sm text-muted-foreground">"Stop wasting ₹2000/month on coaching — here's what I switched to."</p>
              </div>
              <Link to="/sop" className="mt-4 btn-primary w-full">Get full brief</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5-step process */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge"><CheckCircle2 className="size-3.5" /> How it works</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">5 steps from idea to UPI</h2>
          <p className="mt-3 text-muted-foreground">No middlemen. No long forms. You record, we pay.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-5 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="size-11 rounded-xl tb-gradient flex items-center justify-center text-white">
                <s.Icon className="size-5" />
              </div>
              <div className="mt-3 text-xs font-semibold text-tb-blue">STEP {i + 1}</div>
              <div className="text-base font-semibold text-tb-navy">{s.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content guide */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20 grid md:grid-cols-2 gap-8">
          <div>
            <span className="badge badge-green">Content guide</span>
            <h2 className="mt-3 text-3xl font-bold text-tb-navy">What works on camera</h2>
            <p className="mt-3 text-muted-foreground">Honest creators outperform polished scripts. Here's the playbook.</p>
            <div className="mt-6 space-y-2">
              {dos.map((d) => (
                <div key={d} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="badge badge-red">Avoid</span>
            <h2 className="mt-3 text-3xl font-bold text-tb-navy">Auto-rejection list</h2>
            <p className="mt-3 text-muted-foreground">Save yourself a resubmit — read these before you record.</p>
            <div className="mt-6 space-y-2">
              {donts.map((d) => (
                <div key={d} className="flex items-start gap-2 text-sm">
                  <X className="size-4 text-red-600 mt-0.5 shrink-0" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Payout tiers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge badge-orange"><IndianRupee className="size-3.5" /> Payout tiers</span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Cross a milestone, get paid</h2>
          <p className="mt-3 text-muted-foreground">Payouts are cumulative — every milestone you cross adds to the next.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((t) => (
            <div key={t.views} className="card p-5 relative overflow-hidden">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.color}`} />
              <div className="text-xs font-semibold text-muted-foreground">When you hit</div>
              <div className="text-lg font-bold text-tb-navy">{t.views}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-tb-orange">{t.amount}</span>
                <span className="text-xs text-muted-foreground">via UPI</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="badge"><Star className="size-3.5" /> Creator stories</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Real students. Real payouts.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <button key={t.handle} onClick={() => setVideo(t)} className="card overflow-hidden text-left group">
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <img src={t.thumb} alt={t.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3 badge badge-orange">{t.exam}</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="size-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="size-6 fill-tb-navy text-tb-navy ml-1" />
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-base font-semibold">{t.name}</div>
                    <div className="text-xs text-white/80">{t.handle}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground">Earned</div>
                    <div className="text-lg font-bold text-tb-orange">{t.earnings}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground">Views</div>
                    <div className="text-lg font-bold text-tb-navy">{t.views}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center">
          <span className="badge">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold text-tb-navy">Questions, answered</h2>
        </div>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="card overflow-hidden">
                <button onClick={() => setOpenFaq(open ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                  <span className="font-semibold text-tb-navy">{f.q}</span>
                  <ChevronDown className={`size-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <div className="px-5 pb-5 text-sm text-muted-foreground fade-up">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="card p-8 md:p-12 tb-gradient text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_50%,#60a5fa_0,transparent_40%),radial-gradient(circle_at_70%_50%,#f97316_0,transparent_45%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tb-text-gradient">Your phone is your studio.</h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">Submit your first video in under 5 minutes. Payouts hit your UPI within 48 hours of milestone.</p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link to="/submit" className="btn-orange">Submit your video <ArrowRight className="size-4" /></Link>
              <Link to="/login" className="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">Login first</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video modal */}
      {video && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4 fade-up" onClick={() => setVideo(null)}>
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setVideo(null)} className="absolute -top-3 -right-3 size-9 rounded-full bg-white text-tb-navy flex items-center justify-center shadow-lg">
              <X className="size-4" />
            </button>
            <div className="card overflow-hidden bg-black">
              <div className="relative aspect-[9/16]">
                <img src={video.thumb} alt={video.name} className="size-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="size-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto pulse-soft">
                      <Play className="size-7 fill-white" />
                    </div>
                    <div className="mt-3 text-sm">Video preview · demo</div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="font-semibold text-tb-navy">{video.name} <span className="text-muted-foreground font-normal">{video.handle}</span></div>
                <div className="text-sm text-muted-foreground">Earned {video.earnings} · {video.views} views · {video.exam}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Brief({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-[11px] text-muted-foreground">{k}</div>
      <div className="text-sm font-semibold text-tb-navy">{v}</div>
    </div>
  );
}
