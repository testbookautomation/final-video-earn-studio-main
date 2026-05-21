import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2, X, ArrowRight, Video, Lightbulb, ListChecks,
  AlertTriangle, Smartphone, PlayCircle, Clock, Volume2, Type, Monitor, FileVideo
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
  { Icon: Smartphone, k: "Aspect Ratio", v: "9:16 vertical", bg: "bg-blue-50 text-tb-blue" },
  { Icon: Clock, k: "Duration", v: "30–60 seconds", bg: "bg-amber-50 text-amber-600" },
  { Icon: Monitor, k: "Resolution", v: "1080×1920 min", bg: "bg-violet-50 text-violet-600" },
  { Icon: Volume2, k: "Audio", v: "Clear voiceover, no bg music over voice", bg: "bg-emerald-50 text-emerald-600" },
  { Icon: Type, k: "On-screen text", v: "Recommended (Hindi/regional ok)", bg: "bg-rose-50 text-rose-600" },
  { Icon: FileVideo, k: "Format", v: "MP4 / MOV", bg: "bg-indigo-50 text-indigo-600" },
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
    src: "https://cdn.testbook.com/1779260919569-YTDown_Shorts_UP-Police-Constable-Mock-testbook-mockte_Media_9C2JsNBeEt4_002_720p.mp4/1779260920.mp4",
  },
  {
    title: "UP Police New Full Mock Test",
    note: "Use this as a reference for pacing, framing, and keeping the message tight.",
    src: "https://cdn.testbook.com/1779260919569-YTDown_Shorts_UPPOLICE-New-Full-MockTest-07-Testbook-u_Media_uMnwR4o7kXU_002_720p.mp4/1779260920.mp4",
  },
  {
    title: "SSC CGL Pre Mock",
    note: "A good example of making the topic exam-specific while staying easy to watch.",
    src: "https://cdn.testbook.com/1779260919569-YTDown_Shorts_testbook-CGL-pre-mock-1-with-sectional-t_Media_wkfiuQQuhQQ_002_720p.mp4/1779260920.mp4",
  },
  {
    title: "UPP Constable Sipahi Shukravar",
    note: "Strong structure with a clear call to action — great format to follow.",
    src: "https://cdn.testbook.com/1779260919569-YTDown_Shorts_UPP-CONSTABLE-MOCK-TEST-SIPAHI-SHUKRAVAR_Media_PFNBeMc6OjU_001_720p.mp4/1779260920.mp4",
  },
];

function SOPPage() {
  return (
    <>
      <section className="tb-gradient text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 md:py-20 fade-up">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
              alt="Testbook"
              className="h-6 sm:h-7 w-auto opacity-90"
            />
          </div>
          <span className="badge bg-white/10 text-white border-white/20"><Lightbulb className="size-3.5" /> How To</span>
          <h1 className="mt-3 text-2xl sm:text-3xl md:text-5xl font-bold tb-text-gradient">The 60-second formula that gets approved</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/80 leading-relaxed">Read this once, record the video, and upload the final file to Testbook. We approve ~85% of submissions on the first try when creators follow this.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8 md:py-16 space-y-8 md:space-y-12">
        {/* Steps */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-tb-navy flex items-center gap-2"><Video className="size-5 text-tb-blue" /> Your 4-beat script</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
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
          <h2 className="text-xl sm:text-2xl font-bold text-tb-navy flex items-center gap-2">
            <Smartphone className="size-5 text-tb-blue" /> Technical specifications
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Ensure your recording settings match these requirements before exporting your final cut.
          </p>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {specs.map((s) => (
              <div key={s.k} className="card p-5 hover-lift flex flex-col justify-between bg-white border-border/60 shadow-sm">
                <div>
                  <div className={`size-9 rounded-xl ${s.bg} flex items-center justify-center shadow-sm`}>
                    <s.Icon className="size-5" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-3.5">{s.k}</div>
                  <div className="text-xs sm:text-sm font-bold text-tb-navy mt-1 leading-snug">{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Do / Don't */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6 bg-gradient-to-br from-white to-emerald-50/20 border-emerald-100/60 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-bold text-tb-navy flex items-center gap-2">
              <span className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ListChecks className="size-4.5" />
              </span>
              Do
            </h3>
            <ul className="mt-5 space-y-3">
              {dos.map((d) => (
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
              {donts.map((d) => (
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

        {/* Rejections */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-tb-navy flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600 animate-pulse" /> Top reasons we reject
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Avoid these common pitfalls to make sure your submission is approved instantly.
          </p>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {rejections.map((r) => (
              <div key={r.title} className="card p-5 hover-lift border-l-4 border-amber-400 bg-white shadow-sm">
                <div className="font-bold text-tb-navy text-sm sm:text-base flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-400" />
                  {r.title}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Handoff */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-tb-navy flex items-center gap-2">
            <ListChecks className="size-5 text-tb-blue" /> Handoff checklist
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            You do not need to publish it yourself or write the final copy. Upload a finished file and let us handle the rest.
          </p>
          <div className="mt-5 card p-5 bg-white shadow-sm">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { t: "Final cut", d: "No watermarks, no drafts, no editing timelines visible." },
                { t: "Clear audio", d: "Voice should be understandable without music overpowering it." },
                { t: "Publish-ready", d: "Testbook will prepare the final copy, publish the video, and track views." },
              ].map((item) => (
                <div key={item.t} className="rounded-2xl border border-border/80 p-4.5 bg-slate-50/50 hover:bg-white hover:border-tb-blue/20 hover:shadow-sm transition-all duration-300">
                  <div className="font-bold text-tb-navy text-xs sm:text-sm">{item.t}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo videos */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-tb-navy flex items-center gap-2">
            <PlayCircle className="size-5 text-tb-blue animate-pulse" /> Reference masterclass
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Watch these benchmark examples before recording. Learn the hooks, pacing, and clear calls to action.
          </p>
          
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {demoVideos.map((video, idx) => (
              <div 
                key={video.src} 
                className="card p-4 hover-lift bg-white border-border/70 shadow-sm flex flex-col justify-between items-center group relative overflow-hidden"
              >
                {/* Simulated Premium Vertical Smartphone Chassis */}
                <div 
                  className="relative w-[155px] h-[275px] rounded-[2rem] border-[5px] border-slate-900 bg-slate-950 shadow-xl overflow-hidden ring-4 ring-slate-800/10 flex items-center justify-center group-hover:scale-102 group-hover:shadow-2xl transition-all duration-500"
                >
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-b-xl z-20 flex justify-center items-center">
                    <div className="size-1 rounded-full bg-slate-700/80 mr-1.5" />
                    <div className="w-6 h-0.75 rounded-full bg-slate-800" />
                  </div>
                  
                  {/* Video player */}
                  <video
                    className="h-full w-full object-cover opacity-95 relative z-10"
                    controls
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  >
                    <source src={video.src} type="video/mp4" />
                  </video>
                  
                  {/* Premium glass gloss reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-20" />
                  
                  {/* Format tag badge */}
                  <div className="absolute top-5 left-2.5 z-20">
                    <span className="text-[8px] font-black uppercase tracking-wider bg-tb-blue/90 text-white px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
                      Benchmark {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Video text & note container */}
                <div className="p-2 text-left w-full mt-4 flex-1 flex flex-col justify-between">
                  <div className="font-extrabold text-tb-navy text-sm tracking-tight group-hover:text-tb-blue transition-colors">
                    {video.title}
                  </div>
                  <div 
                    className="mt-2.5 p-3 rounded-2xl bg-secondary/35 border border-secondary/50 text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-semibold flex-1 flex items-center"
                  >
                    {video.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card border-transparent p-8 tb-gradient text-white text-center">
          <h2 className="text-2xl font-bold tb-text-gradient">Brief read. Camera ready?</h2>
          <p className="mt-2 text-sm text-white/80">Upload your video to Testbook — approval comes back within 24 hours.</p>
          <Link to="/submit" className="btn-orange mt-5 inline-flex">Send your video <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </>
  );
}
