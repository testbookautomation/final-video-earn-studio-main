import { Link } from "@tanstack/react-router";
import { CheckCircle2, X, ArrowRight, Video, Lightbulb, ListChecks, AlertTriangle, Smartphone, PlayCircle } from "lucide-react";
import { ModalShell } from "./ModalShell";

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
  { k: "Audio", v: "Clear voiceover, no music over voice" },
  { k: "On-screen text", v: "Recommended (Hindi/regional ok)" },
  { k: "Format", v: "MP4 / MOV" },
];

const dos = [
  "Use natural lighting (face a window)",
  "Speak in your audience's first language",
  "Show real Testbook screens",
  "Add on-screen text for sound-off viewers",
  "Export a clean final file Testbook can publish",
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
  { title: "UP Police Constable Mock", note: "Quick hook, simple language, clear Testbook Pass mention.", src: "https://cdn.testbook.com/1779227085899-UP%20Police%20Constable%20Mock%20%23testbook%20%23mocktest%20%23uppolice%20%23uppoliceconstable%20%23exam%20%23rojgarwithankit.mp4/1779227087.mp4" },
  { title: "UP Police Full Mock Test", note: "Good pacing, framing and tight message.", src: "https://cdn.testbook.com/1779227085900-UPPOLICE%F0%9F%9A%A8New%20Full%20MockTest-07%20Testbook%F0%9F%93%9D%23uppolice%20%23uppoliceexam%20%23testbookmock%20%23testbook%20%23upsi%20%23upp.mp4/1779227087.mp4" },
  { title: "SSC CGL Pre Mock", note: "Exam-specific, easy to watch.", src: "https://cdn.testbook.com/1779227085900-testbook%20CGL%20pre%20mock-1%20with%20sectional%20timing%23ssccgl%23ssccgl2026%23cgl2026%23chsl2026%23motivation%23shorts.mp4/1779227087.mp4" },
  { title: "UPP Constable Sipahi", note: "Strong structure with clear call to action.", src: "https://cdn.testbook.com/1779227085900-UPP%20CONSTABLE%20MOCK%20TEST%20SIPAHI%20SHUKRAVAR%2015%20MAY%E2%9C%85%20%23uppolice%20%23upp%20%23testbook%20%23uppmocktest%20%23motivation.mp4/1779227087.mp4" },
];

interface HowToModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowToModal({ open, onClose }: HowToModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} title="How To Make Your Video">
      <div className="px-5 py-6 space-y-8">

        {/* Hero strip */}
        <div className="rounded-xl tb-gradient text-white p-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full mb-3">
            <Lightbulb className="size-3.5" /> Formula
          </span>
          <p className="text-sm text-white/85 leading-relaxed">
            The 60-second formula that gets approved. Read this once, record, upload. We approve ~85% on the first try.
          </p>
        </div>

        {/* 4-beat script */}
        <div>
          <h3 className="text-sm font-bold text-tb-navy flex items-center gap-2 mb-3">
            <Video className="size-4 text-tb-blue" /> Your 4-beat script
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sopSteps.map((s, i) => (
              <div key={s.title} className="card p-4">
                <div className="size-7 rounded-full bg-blue-50 text-tb-blue flex items-center justify-center font-bold text-xs">{i + 1}</div>
                <div className="mt-2 text-sm font-semibold text-tb-navy">{s.title}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 card p-4 flex items-start gap-3 border-amber-200 bg-amber-50/70">
            <span className="text-lg leading-none shrink-0">⭐️</span>
            <p className="text-xs font-semibold text-tb-navy leading-relaxed">
              Or create your own script! A viral script/edit will always work!
            </p>
          </div>
        </div>

        {/* Tech specs */}
        <div>
          <h3 className="text-sm font-bold text-tb-navy flex items-center gap-2 mb-3">
            <Smartphone className="size-4 text-tb-blue" /> Tech specs
          </h3>
          <div className="card divide-y divide-border">
            {specs.map((s) => (
              <div key={s.k} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground text-xs">{s.k}</span>
                <span className="font-semibold text-tb-navy text-xs">{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Do / Don't */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-tb-navy flex items-center gap-2 mb-3">
              <ListChecks className="size-4 text-emerald-600" /> Do
            </h3>
            <ul className="space-y-2">
              {dos.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-tb-navy flex items-center gap-2 mb-3">
              <X className="size-4 text-red-600" /> Don't
            </h3>
            <ul className="space-y-2">
              {donts.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs">
                  <X className="size-3.5 text-red-600 mt-0.5 shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rejections */}
        <div>
          <h3 className="text-sm font-bold text-tb-navy flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-amber-600" /> Top rejection reasons
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {rejections.map((r) => (
              <div key={r.title} className="card p-4 border-l-4 border-amber-400">
                <div className="text-xs font-semibold text-tb-navy">{r.title}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo videos */}
        <div>
          <h3 className="text-sm font-bold text-tb-navy flex items-center gap-2 mb-3">
            <PlayCircle className="size-4 text-tb-blue" /> Demo videos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {demoVideos.map((v) => (
              <div key={v.src} className="card overflow-hidden">
                <div className="bg-tb-navy aspect-[9/16]">
                  <video
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  >
                    <source src={v.src} type="video/mp4" />
                  </video>
                </div>
                <div className="p-2.5">
                  <div className="font-bold text-tb-navy text-xs">{v.title}</div>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{v.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-5 tb-gradient text-white text-center rounded-xl">
          <p className="text-sm font-semibold mb-3">Brief read. Camera ready?</p>
          <Link to="/submit" onClick={onClose} className="btn-orange text-sm inline-flex">
            Send your video <ArrowRight className="size-3.5" />
          </Link>
        </div>

      </div>
    </ModalShell>
  );
}
