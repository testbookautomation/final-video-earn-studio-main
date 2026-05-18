import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2, X, Copy, Check, ArrowRight, Video, Lightbulb, ListChecks,
  AlertTriangle, Hash, Smartphone, Star, IndianRupee, Eye,
} from "lucide-react";

export const Route = createFileRoute("/sop")({
  head: () => ({
    meta: [
      { title: "Creator SOP — Testbook Creator Lab" },
      { name: "description", content: "Step-by-step creator guide: video specs, do's and don'ts, rejection reasons, hashtags and approved caption copy." },
      { property: "og:title", content: "Creator SOP — Testbook Creator Lab" },
      { property: "og:url", content: "/sop" },
    ],
    links: [{ rel: "canonical", href: "/sop" }],
  }),
  component: SOPPage,
});

const sopSteps = [
  { title: "Pick your hook (0–3s)", desc: "Open with a relatable problem: \"Stopped paying ₹2000/mo for coaching — here's what I switched to.\"" },
  { title: "Show the app (3–20s)", desc: "Screen-record the Testbook app: mock test, video lecture or a daily quiz." },
  { title: "Share your why (20–45s)", desc: "Why it worked for YOUR exam. Mention 1 specific feature you actually use." },
  { title: "Clear CTA (45–60s)", desc: "Tell viewers exactly what to do: \"Search Testbook on Play Store, get Pass at 60% off this week.\"" },
];

const specs = [
  { k: "Aspect ratio", v: "9:16 vertical" },
  { k: "Duration", v: "30–60 seconds" },
  { k: "Resolution", v: "1080×1920 min" },
  { k: "Audio", v: "Clear voiceover, no background music over voice" },
  { k: "Captions", v: "On-screen text recommended (Hindi/regional ok)" },
  { k: "Format", v: "MP4 / MOV" },
];

const dos = [
  "Use natural lighting (face a window)",
  "Speak in your audience's first language",
  "Show real Testbook screens",
  "Add captions for sound-off viewers",
  "Tag @testbookdotcom and use the hashtag",
];
const donts = [
  "Don't use copyrighted music",
  "Don't fake testimonials or screenshots",
  "Don't show competitor apps in any frame",
  "No political, religious or sensitive content",
  "Don't promise selection or rank guarantees",
];

const rejections = [
  { title: "Copyrighted audio", desc: "Trending audio that isn't free-use will get muted on IG/YT and disqualified." },
  { title: "Misleading claims", desc: "\"100% selection guaranteed\" or fake rank screenshots = instant rejection." },
  { title: "Competitor visibility", desc: "Any other ed-tech app/logo visible in frame disqualifies the entry." },
  { title: "Low effort", desc: "Static screen recordings with no face/voice rarely cross the bar." },
];

const caption = `New to Testbook Pass and honestly — wish I'd switched sooner. Mock tests, PYQs and live classes for every exam, all in one app. Use code CREATOR60 for 60% off this week.

#TestbookPass #StudyWithMe #ExamPrep #SSC #Banking #NEET #Testbook`;

const hashtags = ["#TestbookPass", "#TestbookCreators", "#StudyWithMe", "#ExamPrep", "#SSCExam", "#BankingExam"];

const testimonials = [
  {
    name: "Priya S.",
    handle: "@priyasolves",
    exam: "SSC CGL",
    earnings: "₹18,400",
    views: "6.2L",
    gradient: "from-orange-400 to-rose-500",
    initial: "P",
    quote: "Submitted my first reel on a Monday — approved by Wednesday. UPI hit on Friday. Easiest ₹6,000 I've made.",
  },
  {
    name: "Arjun K.",
    handle: "@arjun.studies",
    exam: "NEET",
    earnings: "₹12,500",
    views: "3.8L",
    gradient: "from-violet-500 to-indigo-500",
    initial: "A",
    quote: "Never thought a 45-second video could earn me this much while studying. Just talked honestly about the app.",
  },
  {
    name: "Neha R.",
    handle: "@neha.banks",
    exam: "Banking",
    earnings: "₹6,000",
    views: "1.4L",
    gradient: "from-emerald-400 to-teal-500",
    initial: "N",
    quote: "I followed the SOP exactly — hook, show the app, share my why, CTA. First try approval. Couldn't believe it.",
  },
];

function SOPPage() {
  const [copiedCap, setCopiedCap] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const copy = async (text: string, kind: "cap" | "tag") => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === "cap") { setCopiedCap(true); setTimeout(() => setCopiedCap(false), 1500); }
      else { setCopiedTag(text); setTimeout(() => setCopiedTag(null), 1500); }
    } catch {}
  };

  return (
    <>
      <section className="tb-gradient text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 md:py-20 fade-up">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="https://cdn.testbook.com/1755173671769-testbook-logo.png/1755173673.png"
              alt="Testbook"
              className="h-7 w-auto brightness-0 invert opacity-90"
            />
          </div>
          <span className="badge bg-white/10 text-white border-white/20"><Lightbulb className="size-3.5" /> Creator SOP</span>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tb-text-gradient">The 60-second formula that gets approved</h1>
          <p className="mt-4 max-w-2xl text-white/80">Read this once. Save your draft. We approve ~85% of submissions on the first try when creators follow this.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-16 space-y-12">
        {/* Steps */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><Video className="size-5 text-tb-blue" /> Your 4-beat script</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {sopSteps.map((s, i) => (
              <div key={s.title} className="card p-5">
                <div className="size-9 rounded-full bg-blue-50 text-tb-blue flex items-center justify-center font-bold text-sm">{i + 1}</div>
                <div className="mt-3 font-semibold text-tb-navy">{s.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><Smartphone className="size-5 text-tb-blue" /> Tech specs</h2>
          <div className="mt-5 card p-2 divide-y divide-border">
            {specs.map((s) => (
              <div key={s.k} className="flex items-center justify-between p-3 text-sm">
                <span className="text-muted-foreground">{s.k}</span>
                <span className="font-semibold text-tb-navy">{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Do / Don't */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-tb-navy flex items-center gap-2"><ListChecks className="size-5 text-emerald-600" /> Do</h3>
            <ul className="mt-4 space-y-2.5">
              {dos.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-tb-navy flex items-center gap-2"><X className="size-5 text-red-600" /> Don't</h3>
            <ul className="mt-4 space-y-2.5">
              {donts.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm">
                  <X className="size-4 text-red-600 mt-0.5 shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rejections */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><AlertTriangle className="size-5 text-amber-600" /> Top reasons we reject</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {rejections.map((r) => (
              <div key={r.title} className="card p-5 border-l-4 border-amber-400">
                <div className="font-semibold text-tb-navy">{r.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Caption + hashtags */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><Hash className="size-5 text-tb-blue" /> Approved caption + hashtags</h2>
          <p className="mt-2 text-sm text-muted-foreground">Paste-ready copy. Personalise the first line for your exam.</p>
          <div className="mt-5 card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">CAPTION</span>
              <button onClick={() => copy(caption, "cap")} className="text-xs flex items-center gap-1 text-tb-blue font-semibold">
                {copiedCap ? <><Check className="size-3.5" /> Copied</> : <><Copy className="size-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans text-tb-navy bg-secondary rounded-xl p-4">{caption}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              {hashtags.map((h) => (
                <button key={h} onClick={() => copy(h, "tag")} className="badge hover:bg-blue-100">
                  {copiedTag === h ? <Check className="size-3" /> : <Copy className="size-3" />} {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Creator testimonials */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><Star className="size-5 text-amber-500" /> Creators who followed this SOP</h2>
          <p className="mt-2 text-sm text-muted-foreground">Real results from creators who read this page before hitting record.</p>
          <div className="mt-5 grid sm:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.handle} className="card overflow-hidden">
                {/* Thumbnail */}
                <div className={`relative bg-gradient-to-br ${t.gradient} aspect-[4/3] flex items-center justify-center`}>
                  <div className="size-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-black select-none">
                    {t.initial}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-orange text-xs">{t.exam}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                    <Eye className="size-3 text-white/80" />
                    <span className="text-xs font-semibold text-white">{t.views} views</span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-tb-navy text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.handle}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 text-tb-orange font-black text-base justify-end">
                        <IndianRupee className="size-3.5" />{t.earnings.replace("₹", "")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">earned</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed italic border-t border-border pt-3">"{t.quote}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 tb-gradient text-white text-center">
          <h2 className="text-2xl font-bold tb-text-gradient">Brief read. Camera ready?</h2>
          <p className="mt-2 text-sm text-white/80">Submit your video — approval comes back within 24 hours.</p>
          <Link to="/submit" className="btn-orange mt-5 inline-flex">Submit your video <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
