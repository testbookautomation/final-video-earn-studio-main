import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, IndianRupee, Play, Trophy, Upload, Users } from "lucide-react";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creators Lab - Testbook" },
      { name: "description", content: "Create short videos for Testbook Creators Lab and track payouts." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  useEffect(() => { track("page_view", { page: "/" }); }, []);

  return (
    <section className="min-h-screen bg-[#f4f7fb] px-4 pb-28 pt-4">
      <div className="mx-auto max-w-md">
        <div className="mt-4">
          <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-orange-700">
            Live campaign
          </p>
          <h1 className="mt-4 text-[2rem] font-black leading-[1.05] tracking-tight text-[#08163f]">
            Create the video. We publish. You get paid via UPI.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Record a 30-60s vertical pitch for Testbook Pass, send it to us, and track approval from your phone.
          </p>
        </div>

        <div className="relative mt-6 h-[255px] overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_20px_50px_rgba(8,22,63,0.18)]">
          <video
            className="h-full w-full object-cover opacity-75"
            autoPlay
            loop
            muted
            playsInline
            src="https://cdn.testbook.com/1779227085899-UP%20Police%20Constable%20Mock%20%23testbook%20%23mocktest%20%23uppolice%20%23uppoliceconstable%20%23exam%20%23rojgarwithankit.mp4/1779227087.mp4"
          />
          <div className="absolute left-1/2 top-3 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-950" />
          <div className="absolute left-4 right-4 top-11 flex items-center justify-between">
            <span className="rounded-full bg-slate-950/60 px-3 py-1.5 text-[11px] font-extrabold text-white">Creator Pitch</span>
            <span className="rounded-full bg-slate-950/60 px-3 py-1.5 text-[11px] font-extrabold text-white">9:16 HD</span>
          </div>
          <button className="absolute inset-0 m-auto grid size-16 place-items-center rounded-full border border-white/35 bg-white/20 text-white backdrop-blur-md" type="button" aria-label="Play demo video">
            <Play className="ml-1 size-7 fill-current stroke-0" />
          </button>
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-slate-950/75 p-3 text-white backdrop-blur-md">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ff7a1a] text-xs font-black">AV</span>
            <div className="min-w-0 flex-1">
              <strong className="block text-sm">Anjali Verma</strong>
              <small className="block text-xs text-white/65">18.2k views</small>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-100">Payout sent</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { Icon: Users, value: "12K+", label: "Creators", color: "text-blue-600" },
            { Icon: IndianRupee, value: "Rs 4.2Cr", label: "Paid", color: "text-orange-500" },
            { Icon: Trophy, value: "85%", label: "Approved", color: "text-yellow-500" },
          ].map(({ Icon, value, label, color }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-[0_10px_26px_rgba(8,22,63,0.05)]">
              <Icon className={`mx-auto mb-1 size-4 ${color}`} />
              <strong className="block text-base leading-none text-[#08163f]">{value}</strong>
              <span className="mt-1 block text-[11px] font-bold text-slate-500">{label}</span>
            </article>
          ))}
        </div>

        <Link
          to="/submit"
          className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#ff7a1a] to-[#e95c00] text-base font-black text-white shadow-[0_14px_26px_rgba(255,122,26,0.25)]"
        >
          <Upload className="size-5" />
          Send your video
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </section>
  );
}
