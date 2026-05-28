import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Smartphone, ShieldCheck, Video, Upload, ClipboardCheck,
  Megaphone, IndianRupee, LayoutDashboard, ArrowRight, CheckCircle2
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Creator's Lab by Testbook" },
      { name: "description", content: "Learn how to earn ₹50 per approved video on Creator's Lab. 8 simple steps from sign up to UPI payout." },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    Icon: Smartphone,
    title: "Sign up with your mobile number",
    desc: "Enter your 10-digit mobile number to create your Creator's Lab account.",
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  {
    Icon: ShieldCheck,
    title: "Verify your login with OTP",
    desc: "Enter the 6-digit OTP sent to your number to securely log in.",
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
  },
  {
    Icon: Video,
    title: "Record your video",
    desc: "Record a 30–60 second vertical video clearly pitching Testbook Pass. Good lighting, clear audio, your own words.",
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
  },
  {
    Icon: Upload,
    title: "Submit your video",
    desc: "Fill in your creator details, UPI ID, and upload your video through the Submit Video page.",
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
  },
  {
    Icon: ClipboardCheck,
    title: "Testbook reviews your video",
    desc: "Our team checks your video for quality, authenticity, and guidelines compliance. Review takes up to 24 hours.",
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
  },
  {
    Icon: Megaphone,
    title: "Approved videos get published",
    desc: "Approved videos are published by Testbook on its official social media channels.",
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
  {
    Icon: IndianRupee,
    title: "Receive ₹50 per approved video",
    desc: "Once your video is published, ₹50 is sent directly to your linked UPI account.",
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
  },
  {
    Icon: LayoutDashboard,
    title: "Track status and rewards",
    desc: "Monitor approval status, view earned rewards, and check payment history from your dashboard.",
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
  },
];

const highlights = [
  { label: "Review time", value: "Within 24 hours" },
  { label: "Reward per video", value: "₹50" },
  { label: "Payment method", value: "UPI" },
  { label: "Video duration", value: "30–60 seconds" },
];

function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1437] to-[#1e3a8a] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-20 text-center fade-up">
          <img
            src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
            alt="Testbook"
            className="h-7 w-auto mx-auto mb-5 opacity-90"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/90 mb-4">
            How It Works
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            From sign up to UPI payout
          </h1>
          <p className="mt-4 text-sm sm:text-base text-white/75 max-w-xl mx-auto leading-relaxed">
            8 simple steps to start earning ₹50 per approved video on Creator's Lab by Testbook.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {highlights.map((h) => (
              <div key={h.label} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-4 text-center">
                <div className="text-base sm:text-lg font-black text-white">{h.value}</div>
                <div className="mt-0.5 text-[10px] font-bold text-white/60 uppercase tracking-wider">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-20">
        <div className="relative">
          {/* Vertical connector line — desktop */}
          <div className="hidden md:block absolute left-[27px] top-6 bottom-6 w-px bg-gradient-to-b from-blue-200 via-blue-100 to-transparent" />

          <div className="space-y-4 md:space-y-6">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative flex gap-4 md:gap-6 group"
              >
                {/* Step number + icon */}
                <div className="relative shrink-0">
                  <div className={`size-14 rounded-2xl ${step.color} border ${step.border} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 relative z-10 bg-white`}>
                    <step.Icon className="size-5" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-[#08163f] text-white text-[10px] font-black flex items-center justify-center z-20 shadow">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="card flex-1 p-5 hover:shadow-md transition-all duration-200 group-hover:border-blue-100/80">
                  <h3 className="font-bold text-[#08163f] text-sm sm:text-base leading-snug">{step.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  {i === 6 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-[11px] font-bold text-green-700">
                      <CheckCircle2 className="size-3" /> Sent to your UPI account
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16 md:pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-[#0b1437] to-[#1e3a8a] p-8 md:p-12 text-center text-white shadow-2xl shadow-blue-900/20">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">
            Ready to start earning?
          </h2>
          <p className="mt-3 text-sm text-white/70 max-w-md mx-auto">
            Record a 30–60 second vertical pitch for Testbook Pass and submit it today.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7a1a] px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-[#e95c00] transition-colors duration-200 w-full sm:w-auto"
            >
              Submit Video
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-to"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors duration-200 w-full sm:w-auto"
            >
              View Creator Guidelines
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
