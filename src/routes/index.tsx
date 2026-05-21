import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, IndianRupee, Users, Trophy, CheckCircle2,
  LogIn, Video, Upload, ShieldCheck, Wallet, ChevronDown, ListChecks,
  Zap, Clock, X, Sparkles, Smile, HelpCircle, PlayCircle
} from "lucide-react";
import { getUser, type TBUser } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { openModal } from "@/lib/modal-events";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creators Lab - Create videos Testbook can publish" },
      { name: "description", content: "Create a short video for Testbook Pass, upload it to Testbook, and earn ₹200 to ₹1,000 via UPI when Testbook-published videos cross view milestones in 48 hours." },
      { property: "og:title", content: "Creators Lab - Create videos Testbook can publish" },
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
  { Icon: Upload,      title: "Send it to us",     desc: "Upload the finished video file directly in the Send Video section." },
  { Icon: ShieldCheck, title: "We publish it",     desc: "Our team reviews, approves, and publishes selected videos." },
  { Icon: Wallet,      title: "UPI payout",        desc: "Views on the Testbook-published video unlock payouts." },
];

const faqs = [
  { q: "Who can apply to Creators Lab?", a: "Any student or aspirant in India with a public Instagram or YouTube profile. Min 500 followers recommended but not mandatory — content quality matters more." },
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
      <section className="relative tb-gradient text-white overflow-hidden pb-12 md:pb-20 pt-8 md:pt-14">
        {/* Subtle grid and decorative background glows */}
        <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-40 size-96 rounded-full bg-orange-500/15 blur-[120px] pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 fade-up space-y-6 text-center lg:text-left">
            {/* Live badge pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 font-bold backdrop-blur-md">
              <Sparkles className="size-3.5 text-yellow-300 animate-pulse" />
              Creators Lab is now open!
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight">
              Create the video.<br />
              We publish.<br />
              <span className="tb-text-gradient bg-gradient-to-r from-white to-blue-200">You get paid via UPI.</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Record a 30–60s vertical video pitching Testbook Pass. We publish it and send rewards directly to your linked UPI.
            </p>
            
            {/* Single gorgeous glass stats pill */}
            <div className="flex justify-center lg:justify-start">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] sm:text-xs text-white/90 font-semibold backdrop-blur-md max-w-full">
                <span className="flex items-center gap-1.5"><Users className="size-3.5 text-blue-300" /> 12K+ Creators</span>
                <span className="size-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5"><IndianRupee className="size-3.5 text-orange-300" /> ₹4.2Cr Paid</span>
                <span className="size-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5"><Trophy className="size-3.5 text-yellow-300" /> 85% Approved</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
              <Link to="/submit" className="btn-orange text-sm sm:text-base px-8 py-3.5 justify-center shadow-lg shadow-orange-500/20 scale-bounce">
                Send your video <ArrowRight className="size-4" />
              </Link>
              <Link to="/how-to" className="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 hover:text-white text-sm sm:text-base px-8 py-3.5 justify-center scale-bounce">
                Guidelines &amp; Mocks
              </Link>
            </div>
          </div>

          {/* Compact visual brief on Desktop, hidden on Mobile to keep page lightweight */}
          {/* Smartphone device shell mockup on Desktop */}
          <div className="hidden lg:block lg:col-span-5 fade-up">
            <div className="relative mx-auto max-w-[280px]">
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-[2.5rem] -z-10" />
              
              {/* Smartphone Frame */}
              <div className="relative border-[5px] border-slate-900 rounded-[2.5rem] bg-slate-950 overflow-hidden shadow-2xl aspect-[9/18]">
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-900 rounded-full z-30" />
                
                {/* Video container */}
                <div className="relative h-full w-full bg-slate-950">
                  <video
                    className="h-full w-full object-cover opacity-75"
                    autoPlay
                    loop
                    muted
                    playsInline
                    src="https://cdn.testbook.com/1779227085899-UP%20Police%20Constable%20Mock%20%23testbook%20%23mocktest%20%23uppolice%20%23uppoliceconstable%20%23exam%20%23rojgarwithankit.mp4/1779227087.mp4"
                  />
                  
                  {/* Glass overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20 z-10 animate-fade-in" />
                  
                  {/* Top Creator badge */}
                  <div className="absolute top-7 left-4 right-4 z-20 flex items-center justify-between">
                    <span className="badge bg-black/40 text-white border-white/10 text-[9px] font-bold backdrop-blur-md px-2 py-0.5">
                      <Sparkles className="size-3 text-yellow-400" /> Creator Pitch
                    </span>
                    <span className="text-[9px] font-bold text-white bg-tb-blue px-2 py-0.5 rounded-md">9:16 HD</span>
                  </div>
                  
                  {/* Play circle overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 cursor-pointer group">
                    <Link to="/how-to" className="size-11 rounded-full bg-white/20 border border-white/35 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/20">
                      <PlayCircle className="size-6 text-white fill-white/10" />
                    </Link>
                    <span className="text-[8px] text-white/95 font-bold uppercase tracking-wider">Demo Video</span>
                  </div>
                  
                  {/* Bottom details card */}
                  <div className="absolute bottom-5 left-4 right-4 z-20 text-white space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] font-black uppercase shadow-sm">AV</div>
                      <div>
                        <div className="text-[10px] font-bold">Anjali Verma</div>
                        <div className="text-[8px] text-white/50">Testbook Student</div>
                      </div>
                    </div>
                    
                    <h4 className="text-[10px] font-medium leading-snug text-white/90">"I stopped buying standard books. I unlocked 80,000+ mock tests using Testbook Pass!"</h4>
                    
                    {/* Stats */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/80 font-bold">
                      <span className="flex items-center gap-1"><Users className="size-3 text-blue-400" /> 18.2k Views</span>
                      <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded">Payout Sent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── CAMPAIGN FLOW WITH SNAP HORIZONTAL SCROLL FOR MOBILE ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-14">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge text-xs font-bold"><CheckCircle2 className="size-3.5" /> Campaign Flow</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-tb-navy tracking-tight">5 steps from idea to UPI</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Swipe to see how easy it is to start earning.</p>
        </div>
        
        {/* Horizontal scroll container with inertia snap on mobile */}
        <div className="mt-8 flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-5 hover-lift relative bg-white border-border/50 shrink-0 w-64 lg:w-auto snap-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-2xl bg-blue-50 text-tb-blue flex items-center justify-center shadow-sm">
                    <s.Icon className="size-5" />
                  </div>
                  <span className="size-6 rounded-full border border-border text-[10px] font-black text-muted-foreground flex items-center justify-center bg-secondary/30">{i + 1}</span>
                </div>
                <div className="mt-4 text-[9px] font-black text-tb-blue tracking-widest uppercase">Step {i + 1}</div>
                <div className="text-sm font-bold text-tb-navy mt-1">{s.title}</div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GUIDELINES DESK INLINE ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 md:py-14">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100/50 text-xs text-tb-blue font-bold">
            <ListChecks className="size-4" /> Guidelines Desk
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-tb-navy tracking-tight">Do's &amp; Don'ts Checklist</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Ensure quick approval! Keep these rules in mind before creating your video.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6 bg-gradient-to-br from-white to-emerald-50/20 border-emerald-100/60 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-bold text-tb-navy flex items-center gap-2">
              <span className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ListChecks className="size-4.5" />
              </span>
              Do
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                "Use natural lighting (face a window)",
                "Speak in your audience's first language",
                "Show real Testbook screens",
                "Add on-screen text for sound-off viewers",
                "Export a clean final file that Testbook can publish"
              ].map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="card p-6 bg-gradient-to-br from-white to-rose-50/20 border-rose-100/60 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-bold text-tb-navy flex items-center gap-2">
              <span className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <X className="size-4.5" />
              </span>
              Don't
            </h3>
            <ul className="mt-5 space-y-3">
              {[
                "Don't use copyrighted music",
                "Don't fake testimonials or screenshots",
                "Don't show competitor apps in any frame",
                "No political, religious or sensitive content",
                "Don't promise selection or rank guarantees"
              ].map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                  <span className="size-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mt-0.5 shrink-0">
                    <X className="size-3" />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link 
            to="/how-to" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-tb-blue hover:text-tb-navy transition-colors scale-bounce"
          >
            View Full SOP &amp; Reference Videos <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ── FAQ INLINE HELP CENTER ── */}
      <section className="bg-slate-900/5 border-y border-border/40 py-10 md:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center size-11 rounded-2xl bg-white border border-border shadow-sm text-tb-blue mx-auto">
              <HelpCircle className="size-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-tb-navy tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Quick answers about UPI accounts, video revisions, rejection reasons, and more.
            </p>
          </div>

          {/* Inline FAQ Accordion Content */}
          <div className="space-y-3 max-w-2xl mx-auto">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div 
                  key={f.q} 
                  className={`card overflow-hidden bg-white border-border/60 transition-all duration-200 ${
                    open ? "ring-2 ring-tb-blue/15 shadow-sm scale-[1.01]" : "hover:border-tb-blue/20"
                  }`}
                >
                  <button 
                    onClick={() => setOpenFaq(open ? null : i)} 
                    className="w-full flex items-center justify-between gap-3 p-4 text-left active:bg-secondary/10"
                  >
                    <span className="font-bold text-tb-navy text-xs sm:text-sm leading-tight">{f.q}</span>
                    <ChevronDown 
                      className={`size-4 text-muted-foreground transition-transform duration-300 shrink-0 ${
                        open ? "rotate-180 text-tb-blue" : ""
                      }`} 
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed animate-fade-up">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Support Payout reminder */}
          <div className="mt-8 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
              All payouts are routed via Testbook verified merchant channels.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12 pt-8">
        <div className="card border-transparent p-6 sm:p-12 tb-gradient text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(circle_at_30%_50%,#3b82f6_0,transparent_45%),radial-gradient(circle_at_70%_50%,#ff7a1a_0,transparent_50%)]" />
          <div className="relative max-w-xl mx-auto space-y-5">
            <div className="flex items-center justify-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-wider">
              <Clock className="size-3.5" />
              Upload in under 5 minutes
            </div>
            
            <h2 className="text-xl sm:text-3xl font-black leading-tight tracking-tight tb-text-gradient">Your phone is your studio.</h2>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              Record a 30–60 second video today, submit it, and let our team handle publishing and payouts based on views.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Link to="/submit" className="btn-orange text-sm px-8 py-3.5 w-full sm:w-auto justify-center scale-bounce shadow-lg shadow-orange-500/20">
                Send your video <ArrowRight className="size-4" />
              </Link>
              {user ? (
                <Link to="/dashboard" className="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-sm px-8 py-3.5 w-full sm:w-auto justify-center scale-bounce">
                  View stats
                </Link>
              ) : (
                <Link to="/login" className="btn-ghost bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-sm px-8 py-3.5 w-full sm:w-auto justify-center scale-bounce">
                  Login first
                </Link>
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
    <div className="rounded-xl border border-border/80 p-2.5 bg-secondary/15">
      <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider mb-0.5">{k}</div>
      <div className="text-[11px] font-extrabold text-tb-navy">{v}</div>
    </div>
  );
}
