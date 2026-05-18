import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, Play, IndianRupee, Users, Trophy, Sparkles, CheckCircle2,
  LogIn, Video, Upload, ShieldCheck, Wallet, Star, ChevronDown, X, Hash,
  Zap, Clock,
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
  { Icon: LogIn,       title: "Login with phone",  desc: "OTP login in 30 seconds. Set up your UPI ID right away." },
  { Icon: Video,       title: "Record your reel",  desc: "30–60 second vertical video pitching Testbook Pass." },
  { Icon: Upload,      title: "Upload & submit",   desc: "Upload your reel file directly from your device." },
  { Icon: ShieldCheck, title: "Team approves",     desc: "Our team verifies content quality within 24 hours." },
  { Icon: Wallet,      title: "UPI payout",        desc: "Cross a view milestone → instant UPI transfer to you." },
];

const tiers = [
  { views: "10,000 views", amount: "₹500",    color: "from-blue-500 to-indigo-500",    label: "Starter" },
  { views: "50,000 views", amount: "₹2,500",  color: "from-indigo-500 to-violet-500",  label: "Rising" },
  { views: "1 Lakh views", amount: "₹6,000",  color: "from-violet-500 to-fuchsia-500", label: "Popular" },
  { views: "5 Lakh views", amount: "₹15,000", color: "from-fuchsia-500 to-orange-500", label: "Viral" },
  { views: "10 Lakh views",amount: "₹25,000", color: "from-orange-500 to-rose-500",    label: "Top Creator" },
];

const dos = [
  "Speak in your audience's language — Hindi or regional languages are great",
  "Show the Testbook app on screen while talking",
  "Mention the specific exam you're preparing for",
  "Use the campaign hashtag #TestbookPass in your caption",
];
const donts = [
  "Don't fake reviews or buy views — instant disqualification",
  "No abusive, political or sensitive content allowed",
  "Don't show competing apps or services in the video",
  "No misleading guarantees about exam results",
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
  { q: "Is there a follower count requirement?", a: "No minimum follower count is required. We care more about content quality and authentic reach than follower numbers." },
];

function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [video, setVideo] = useState<typeof testimonials[number] | null>(null);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative tb-gradient text-white overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,#60a5fa_0,transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 fade-up">
            <span className="badge bg-white/10 text-white border-white/20 text-xs">
              <Sparkles className="size-3.5" /> Creator Campaign · 2026
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] tb-text-gradient">
              Make a reel.<br />Promote Testbook Pass.<br />Get paid in UPI.
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/85 max-w-xl leading-relaxed">
              Join <strong className="text-white">12,000+ student creators</strong> earning ₹500 to ₹25,000 per video — based on real view milestones, paid directly to your UPI account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/submit" className="btn-orange text-base px-6 py-3.5">
                Submit your video <ArrowRight className="size-4" />
              </Link>
              <Link to="/sop" className="btn-ghost bg-white/10 border-white/25 text-white hover:bg-white/18 hover:text-white text-base px-6 py-3.5">
                Read Creator SOP
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
                <span className="badge badge-orange text-xs"><Hash className="size-3.5" /> Creator Brief</span>
                <span className="text-xs text-muted-foreground font-medium">Updated this week</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-tb-navy">Promote Testbook Pass — All Exams</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">A 30–60 second honest reel showing why Testbook Pass works for your exam.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Brief k="Format" v="Vertical 9:16" />
                <Brief k="Duration" v="30–60 seconds" />
                <Brief k="Platforms" v="Instagram · YouTube · Facebook" />
                <Brief k="Hashtag" v="#TestbookPass" />
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                <div className="text-xs font-bold text-tb-navy mb-1.5 uppercase tracking-wide">Hook idea</div>
                <p className="text-sm text-foreground/75 leading-relaxed italic">"Stop wasting ₹2000/month on coaching — here's what I switched to."</p>
              </div>
              <Link to="/sop" className="mt-5 btn-primary w-full text-sm">Read full brief & guidelines</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge text-xs"><CheckCircle2 className="size-3.5" /> How it works</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-tb-navy">5 steps from idea to UPI</h2>
          <p className="mt-3 text-base text-muted-foreground">No middlemen. No long forms. You record, we pay.</p>
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
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((t, i) => {
            const popular = i === 2;
            return (
              <div key={t.views} className={`card p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${popular ? "ring-2 ring-tb-blue/40 shadow-md" : ""}`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.color}`} />
                {popular && (
                  <div className="absolute top-4 right-3">
                    <span className="badge badge-orange text-xs py-0.5 px-2">Most Popular</span>
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.label}</div>
                  <div className="text-base font-bold text-tb-navy mt-1">{t.views}</div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-3xl font-black text-tb-orange">{t.amount}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium">paid via UPI within 48h</div>
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
              Example: if your video hits 1 Lakh views, you earn ₹500 + ₹2,500 + ₹6,000 = <strong className="text-tb-navy">₹9,000 total</strong>. Every milestone builds on the previous one.
            </p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="badge text-xs"><Star className="size-3.5" /> Creator stories</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-tb-navy">Real students. Real payouts.</h2>
            <p className="mt-3 text-base text-muted-foreground">These creators started just like you — with a phone and a story.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <button key={t.handle} onClick={() => setVideo(t)} className="card overflow-hidden text-left group">
                <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                  <img src={t.thumb} alt={t.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-orange text-xs">{t.exam}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="size-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="size-6 fill-tb-navy text-tb-navy ml-1" />
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-base font-bold">{t.name}</div>
                    <div className="text-sm text-white/75 mt-0.5">{t.handle}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Total earned</div>
                    <div className="text-xl font-bold text-tb-orange mt-0.5">{t.earnings}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground font-medium">Total views</div>
                    <div className="text-xl font-bold text-tb-navy mt-0.5">{t.views}</div>
                  </div>
                </div>
              </button>
            ))}
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
              <span className="text-white/70 text-sm font-medium">Submit in under 5 minutes</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tb-text-gradient">Your phone is your studio.</h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto text-base leading-relaxed">
              Record a 30–60 second reel today. Payouts hit your UPI within 48 hours of crossing a milestone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/submit" className="btn-orange text-base px-8 py-3.5">Submit your video <ArrowRight className="size-4" /></Link>
              <Link to="/login" className="btn-ghost bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white text-base px-8 py-3.5">Login first</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO MODAL ── */}
      {video && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur flex items-center justify-center p-4 fade-up" onClick={() => setVideo(null)}>
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setVideo(null)} className="absolute -top-3 -right-3 size-9 rounded-full bg-white text-tb-navy flex items-center justify-center shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors">
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
                    <div className="mt-3 text-sm text-white/80">Video preview · demo</div>
                  </div>
                </div>
              </div>
              <div className="p-5 bg-white">
                <div className="font-bold text-tb-navy text-base">{video.name} <span className="text-muted-foreground font-normal text-sm">{video.handle}</span></div>
                <div className="text-sm text-muted-foreground mt-1">Earned {video.earnings} · {video.views} views · {video.exam}</div>
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
    <div className="rounded-xl border border-border p-3 bg-secondary/30">
      <div className="text-xs text-muted-foreground font-medium mb-0.5">{k}</div>
      <div className="text-sm font-bold text-tb-navy">{v}</div>
    </div>
  );
}
