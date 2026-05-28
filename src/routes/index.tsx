import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Upload, CheckCircle2,
  Clock, LayoutDashboard, Star, IndianRupee,
  Volume2, VolumeX
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creator's Lab by Testbook" },
      { name: "description", content: "Record a 30–60 second vertical video pitching Testbook Pass and earn ₹50 per approved video." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const campaignDetails = [
  { label: "Reward", value: "₹50 per approved video" },
  { label: "Video format", value: "Vertical video (9:16)" },
  { label: "Duration", value: "30–60 seconds" },
  { label: "Product", value: "Testbook Pass" },
  { label: "Payment method", value: "Linked UPI" },
  { label: "Approval required", value: "Yes" },
];

const benefits = [
  { Icon: Upload, title: "Simple video submission", desc: "Easy drag-and-drop upload from your phone or desktop." },
  { Icon: IndianRupee, title: "Easy UPI reward payments", desc: "Rewards sent directly to your linked UPI account." },
  { Icon: CheckCircle2, title: "Transparent approval status", desc: "Track every stage of your submission in real time." },
  { Icon: Clock, title: "Fast review process", desc: "Most videos reviewed within 24 hours." },
  { Icon: LayoutDashboard, title: "Creator-friendly dashboard", desc: "All your submissions, rewards, and payments in one place." },
];

function PhoneFrame() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  return (
    /* outer padding lets shadow + ring breathe */
    <div className="px-4 pt-2 pb-0">
      <div className="relative mx-auto" style={{ width: 220 }}>
        {/* Side buttons */}
        <div className="absolute -left-[5px] top-20 w-[5px] h-8 rounded-l-full bg-slate-700" />
        <div className="absolute -left-[5px] top-32 w-[5px] h-6 rounded-l-full bg-slate-700" />
        <div className="absolute -right-[5px] top-24 w-[5px] h-10 rounded-r-full bg-slate-700" />

        {/* Phone body */}
        <div
          className="relative rounded-[2.2rem] bg-slate-900 shadow-2xl"
          style={{ boxShadow: "0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)" }}
        >
          {/* Inner screen bezel */}
          <div className="m-[5px] rounded-[1.8rem] overflow-hidden bg-black">

            {/* Dynamic island */}
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-20 w-[70px] h-[22px] bg-black rounded-full flex items-center justify-center gap-1.5">
              <div className="size-[7px] rounded-full bg-slate-800 border border-slate-700" />
              <div className="w-[18px] h-[7px] rounded-full bg-slate-800 border border-slate-700" />
            </div>

            {/* Video */}
            <div style={{ aspectRatio: "9/16" }} className="relative">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                loop
                muted
                autoPlay
                preload="metadata"
                src="https://cdn.testbook.com/1779260919569-YTDown_Shorts_testbook-CGL-pre-mock-1-with-sectional-t_Media_wkfiuQQuhQQ_002_720p.mp4/1779260920.mp4"
              />
              {/* Mute / Unmute button */}
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-8 right-2.5 z-20 size-7 rounded-full bg-black/50 border border-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted
                  ? <VolumeX className="size-3.5 text-white" />
                  : <Volume2 className="size-3.5 text-white" />
                }
              </button>
            </div>

            {/* Bottom creator strip */}
            <div className="absolute bottom-3 left-2.5 right-2.5 z-10 flex items-center gap-2 rounded-2xl bg-black/75 p-2 backdrop-blur-md">
              <span className="size-7 shrink-0 rounded-lg bg-gradient-to-br from-[#ff7a1a] to-[#e95c00] flex items-center justify-center text-[9px] font-black text-white">AV</span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-white leading-none">Anjali Verma</div>
                <div className="text-[8px] text-white/55 mt-0.5">18.2k views</div>
              </div>
              <span className="rounded-full bg-emerald-500/25 border border-emerald-400/30 px-2 py-0.5 text-[8px] font-black text-emerald-300">Paid</span>
            </div>

            {/* Screen gloss */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08]" />
          </div>
        </div>

        {/* Floating ₹50 badge */}
        <div className="absolute -right-8 top-12 z-30 rounded-2xl bg-white px-3 py-2 text-center shadow-xl border border-slate-100">
          <div className="text-base font-black text-[#08163f] leading-none">₹50</div>
          <div className="text-[9px] text-slate-400 font-bold mt-0.5">per video</div>
        </div>

        {/* Floating "Approved" badge */}
        <div className="absolute -left-10 bottom-20 z-30 rounded-2xl bg-white px-2.5 py-2 shadow-xl border border-slate-100 flex items-center gap-1.5">
          <span className="size-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-3 text-white" />
          </span>
          <div>
            <div className="text-[9px] font-black text-[#08163f] leading-none">Approved</div>
            <div className="text-[8px] text-slate-400 font-semibold">2 min ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  useEffect(() => { track("page_view", { page: "/" }); }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#07102e] via-[#0d1a4a] to-[#1a3080] text-white">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 pt-8 pb-0 md:py-20">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-14">

            {/* Phone — top on mobile, right on desktop */}
            <div className="order-1 md:order-2 shrink-0">
              <PhoneFrame />
            </div>

            {/* Text — below phone on mobile, left on desktop */}
            <div className="order-2 md:order-1 flex-1 text-center md:text-left pb-4 md:pb-0">
              <h1 className="text-[2rem] sm:text-4xl md:text-[2.75rem] font-black tracking-tight leading-[1.08]">
                Creator's Lab<br />
                <span className="text-[#ff7a1a]">by Testbook</span>
              </h1>
              <p className="mt-4 text-sm sm:text-[15px] text-white/65 max-w-sm mx-auto md:mx-0 leading-relaxed">
                Record a 30–60 second vertical video pitching Testbook Pass and earn{" "}
                <span className="text-white font-bold">₹50 per approved video</span>.
              </p>

              <Link
                to="/submit"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a1a] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-800/30 hover:bg-[#e95c00] transition-colors w-full sm:w-auto"
              >
                <Upload className="size-4" />
                Start Earning
                <ArrowRight className="size-4" />
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* ── Campaign Card ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <div className="card bg-white overflow-hidden shadow-md">
          <div className="bg-gradient-to-br from-[#0b1437] to-[#1e3a8a] px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center rounded-full border border-orange-300/30 bg-orange-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300 mb-2">
                  Active Campaign
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">Testbook Pass Video Promotion</h2>
              </div>
              <img
                src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
                alt="Testbook"
                className="h-6 w-auto opacity-80 shrink-0 mt-1"
              />
            </div>
            <p className="mt-2.5 text-sm text-white/70 leading-relaxed max-w-2xl">
              Record and submit a 30–60 second vertical video pitching Testbook Pass. Once your video is approved, Testbook will publish it and you will receive ₹50 per approved video directly in your linked UPI account.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {campaignDetails.map((d) => (
                <div key={d.label} className="rounded-2xl border border-border/60 bg-slate-50/60 p-3.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{d.label}</div>
                  <div className="text-xs sm:text-sm font-bold text-[#08163f] leading-snug">{d.value}</div>
                </div>
              ))}
            </div>
            <Link
              to="/submit"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-2xl bg-gradient-to-br from-[#ff7a1a] to-[#e95c00] px-6 py-3.5 text-sm font-black text-white shadow-md shadow-orange-500/20 hover:opacity-90 transition-opacity"
            >
              <Upload className="size-4" />
              Submit Video
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#08163f]">Why creators choose Creator's Lab</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">Everything you need to create, submit, and get paid — in one place.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className={`card bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="size-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <b.Icon className="size-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-[#08163f] text-sm leading-snug">{b.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center card bg-gradient-to-br from-[#0b1437] to-[#1e3a8a] p-8 text-white shadow-xl shadow-blue-900/20">
          <Star className="size-7 text-[#ff7a1a] mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-black leading-tight">Start earning today</h2>
          <p className="mt-2 text-sm text-white/65 max-w-xs mx-auto">Upload your video, get approved, and receive ₹50 straight to your UPI account.</p>
          <Link
            to="/submit"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a1a] px-6 py-3 text-sm font-black text-white hover:bg-[#e95c00] transition-colors shadow-lg shadow-orange-700/30"
          >
            Submit Video <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
