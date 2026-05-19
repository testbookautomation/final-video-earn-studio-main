import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2, X, ArrowRight, Video, Lightbulb, ListChecks,
  AlertTriangle, Smartphone, PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/how-to")({
  head: () => ({
    meta: [
      { title: "How To — Creators Lab" },
      { name: "description", content: "Step-by-step creator guide: video specs, do's and don'ts, rejection reasons, and handoff notes for videos Testbook can publish." },
      { property: "og:title", content: "How To — Creators Lab" },
      { property: "og:url", content: "/how-to" },
    ],
    links: [{ rel: "canonical", href: "/how-to" }],
  }),
  component: SOPPage,
});

const sopSteps = [
  { title: "Pick your hook (0–3s)", desc: "Open with a relatable problem: \"Stopped paying ₹2000/mo for coaching — here's what I switched to.\"" },
  { title: "Show the app (3–20s)", desc: "Screen-record the Testbook app: mock test, video lecture or a daily quiz." },
  { title: "Tell your story (20–45s)", desc: "Why it worked for YOUR exam. Mention 1 specific feature you actually use." },
  { title: "Clear CTA (45–60s)", desc: "End with a simple Testbook Pass mention. Testbook will handle the final publishing copy." },
];

const specs = [
  { k: "Aspect ratio", v: "9:16 vertical" },
  { k: "Duration", v: "30–60 seconds" },
  { k: "Resolution", v: "1080×1920 min" },
  { k: "Audio", v: "Clear voiceover, no background music over voice" },
  { k: "On-screen text", v: "Recommended (Hindi/regional ok)" },
  { k: "Format", v: "MP4 / MOV" },
];

const dos = [
  "Use natural lighting (face a window)",
  "Speak in your audience's first language",
  "Show real Testbook screens",
  "Add on-screen text for sound-off viewers",
  "Export a clean final file that Testbook can publish",
];
const donts = [
  "Don't use copyrighted music",
  "Don't fake testimonials or screenshots",
  "Don't show competitor apps in any frame",
  "No political, religious or sensitive content",
  "Don't promise selection or rank guarantees",
];

const rejections = [
  { title: "Copyrighted audio", desc: "Trending audio that isn't free-use cannot be published from Testbook channels." },
  { title: "Misleading claims", desc: "\"100% selection guaranteed\" or fake rank screenshots = instant rejection." },
  { title: "Competitor visibility", desc: "Any other ed-tech app/logo visible in frame disqualifies the entry." },
  { title: "Low effort", desc: "Static screen recordings with no face/voice rarely cross the bar." },
];

const demoVideos = [
  {
    title: "UP Police Constable Mock",
    note: "Notice the quick hook, simple language, and clear Testbook Pass mention.",
    src: "https://cdn.testbook.com/1779227085899-UP%20Police%20Constable%20Mock%20%23testbook%20%23mocktest%20%23uppolice%20%23uppoliceconstable%20%23exam%20%23rojgarwithankit.mp4/1779227087.mp4",
  },
  {
    title: "UP Police New Full Mock Test",
    note: "Use this as a reference for pacing, framing, and keeping the message tight.",
    src: "https://cdn.testbook.com/1779227085900-UPPOLICE%F0%9F%9A%A8New%20Full%20MockTest-07%20Testbook%F0%9F%93%9D%23uppolice%20%23uppoliceexam%20%23testbookmock%20%23testbook%20%23upsi%20%23upp.mp4/1779227087.mp4",
  },
  {
    title: "SSC CGL Pre Mock",
    note: "A good example of making the topic exam-specific while staying easy to watch.",
    src: "https://cdn.testbook.com/1779227085900-testbook%20CGL%20pre%20mock-1%20with%20sectional%20timing%23ssccgl%23ssccgl2026%23cgl2026%23chsl2026%23motivation%23shorts.mp4/1779227087.mp4",
  },
  {
    title: "UPP Constable Sipahi Shukravar",
    note: "Strong structure with a clear call to action — great format to follow.",
    src: "https://cdn.testbook.com/1779227085900-UPP%20CONSTABLE%20MOCK%20TEST%20SIPAHI%20SHUKRAVAR%2015%20MAY%E2%9C%85%20%23uppolice%20%23upp%20%23testbook%20%23uppmocktest%20%23motivation.mp4/1779227087.mp4",
  },
];

function SOPPage() {
  return (
    <>
      <section className="tb-gradient text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 md:py-20 fade-up">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
              alt="Testbook"
              className="h-7 w-auto opacity-90"
            />
          </div>
          <span className="badge bg-white/10 text-white border-white/20"><Lightbulb className="size-3.5" /> How To</span>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tb-text-gradient">The 60-second formula that gets approved</h1>
          <p className="mt-4 max-w-2xl text-white/80">Read this once, record the video, and upload the final file to Testbook. We approve ~85% of submissions on the first try when creators follow this.</p>
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
          <div className="mt-4 card p-5 flex items-start gap-3 border-amber-200 bg-amber-50/70">
            <span className="text-xl leading-none">⭐️</span>
            <p className="text-sm md:text-base font-semibold text-tb-navy leading-relaxed">
              Or You can always create your own script! A viral script/edit will always work!
            </p>
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

        {/* Handoff */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><ListChecks className="size-5 text-tb-blue" /> Handoff checklist</h2>
          <p className="mt-2 text-sm text-muted-foreground">You do not need to publish it yourself or write the final publishing copy. Upload a final video file that Testbook can publish.</p>
          <div className="mt-5 card p-5">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { t: "Final cut", d: "No watermarks, no drafts, no editing timelines visible." },
                { t: "Clear audio", d: "Voice should be understandable without music overpowering it." },
                { t: "Publish-ready", d: "Testbook will prepare the final copy, publish the video, and track views." },
              ].map((item) => (
                <div key={item.t} className="rounded-xl border border-border p-4 bg-secondary/40">
                  <div className="font-semibold text-tb-navy text-sm">{item.t}</div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo videos */}
        <div>
          <h2 className="text-2xl font-bold text-tb-navy flex items-center gap-2"><PlayCircle className="size-5 text-tb-blue" /> Demo videos: how to make yours</h2>
          <p className="mt-2 text-sm text-muted-foreground">Watch these examples before recording. Follow the structure, then upload your own final file to Testbook.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {demoVideos.map((video) => (
              <div key={video.src} className="card overflow-hidden">
                <div className="bg-tb-navy aspect-[9/16]">
                  <video
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                </div>
                <div className="p-4">
                  <div className="font-bold text-tb-navy text-sm">{video.title}</div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{video.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 tb-gradient text-white text-center">
          <h2 className="text-2xl font-bold tb-text-gradient">Brief read. Camera ready?</h2>
          <p className="mt-2 text-sm text-white/80">Upload your video to Testbook — approval comes back within 24 hours.</p>
          <Link to="/submit" className="btn-orange mt-5 inline-flex">Send your video <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
