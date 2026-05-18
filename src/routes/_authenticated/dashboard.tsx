import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, Clock, Eye, Heart, MessageCircle, IndianRupee,
  Wallet, Send, FileText, RefreshCw, Sparkles, AlertCircle, PartyPopper,
} from "lucide-react";
import { getSubmission, getUser, saveSubmission, type TBSubmission, type SubmissionStatus } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Testbook Creator Lab" },
      { name: "description", content: "Track your submission status, view milestones, and UPI payouts in real time." },
      { property: "og:title", content: "Dashboard — Testbook Creator Lab" },
      { property: "og:url", content: "/dashboard" },
    ],
  }),
  component: DashboardPage,
});

const milestones = [
  { v: 10000,   label: "10K",  pay: 500   },
  { v: 50000,   label: "50K",  pay: 2500  },
  { v: 100000,  label: "1L",   pay: 6000  },
  { v: 500000,  label: "5L",   pay: 15000 },
  { v: 1000000, label: "10L",  pay: 25000 },
];

const timeline: { key: SubmissionStatus; label: string; desc: string }[] = [
  { key: "submitted",         label: "Submitted",        desc: "Video received" },
  { key: "under_review",      label: "Under review",     desc: "Team is verifying" },
  { key: "approved",          label: "Approved",         desc: "Cleared for tracking" },
  { key: "live",              label: "Tracking live",    desc: "Views being counted" },
  { key: "milestone_reached", label: "Milestone hit",    desc: "Payout queued" },
  { key: "paid",              label: "Paid via UPI",     desc: "Money sent" },
];

const order: SubmissionStatus[] = ["submitted","under_review","approved","live","milestone_reached","paid"];

function DashboardPage() {
  const [submission, setSubmission] = useState<TBSubmission | null>(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const u = getUser();
    if (u) setPhone(u.phone);
    setSubmission(getSubmission());
    const sync = () => setSubmission(getSubmission());
    window.addEventListener("tb:submission", sync);
    return () => window.removeEventListener("tb:submission", sync);
  }, []);

  if (!submission) {
    return <EmptyState phone={phone} />;
  }

  const stage = order.indexOf(submission.status);
  const isRejected = submission.status === "rejected";
  const nextMilestone = milestones.find((m) => m.v > submission.views);
  const lastMilestone = [...milestones].reverse().find((m) => m.v <= submission.views);
  const progressPct = nextMilestone
    ? Math.min(100, ((submission.views - (lastMilestone?.v ?? 0)) / (nextMilestone.v - (lastMilestone?.v ?? 0))) * 100)
    : 100;

  // Dev-only status cycler
  const cycle = () => {
    const next: SubmissionStatus = order[(order.indexOf(submission.status) + 1) % order.length];
    const bumpedViews = next === "live" ? Math.max(submission.views, 4200)
      : next === "milestone_reached" ? Math.max(submission.views, 10500)
      : next === "paid" ? Math.max(submission.views, 12000)
      : submission.views;
    const lastM = [...milestones].reverse().find((m) => m.v <= bumpedViews);
    saveSubmission({
      ...submission,
      status: next,
      views: bumpedViews,
      likes: Math.round(bumpedViews * 0.06),
      comments: Math.round(bumpedViews * 0.008),
      payoutInr: next === "paid" ? (lastM?.pay ?? 0) : submission.payoutInr,
      history: [...submission.history, { status: next, at: Date.now() }],
    });
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 md:py-14 space-y-6">
      <div className="fade-up">
        <span className="badge"><Sparkles className="size-3.5" /> Welcome back · +91 {phone}</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Your submission</h1>
        <p className="mt-2 text-muted-foreground">Live status, view milestones and payout — all here.</p>
      </div>

      {/* Status banner */}
      <div className={`card p-5 flex flex-wrap items-center gap-4 ${isRejected ? "!border-red-200 bg-red-50/40" : ""}`}>
        <div className={`size-12 rounded-xl flex items-center justify-center ${
          isRejected ? "bg-red-100 text-red-700" :
          submission.status === "paid" ? "bg-emerald-100 text-emerald-700" :
          "tb-gradient text-white"
        }`}>
          {isRejected ? <AlertCircle className="size-6" /> :
           submission.status === "paid" ? <PartyPopper className="size-6" /> :
           <Clock className="size-6" />}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs text-muted-foreground">Current status</div>
          <div className="text-lg font-semibold text-tb-navy capitalize">{submission.status.replace(/_/g, " ")}</div>
        </div>
        <a href={submission.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost">View post ↗</a>
      </div>

      {/* Timeline */}
      {!isRejected && (
        <div className="card p-6">
          <div className="text-sm font-semibold text-tb-navy mb-4">Submission timeline</div>
          <ol className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {timeline.map((t, i) => {
              const reached = i <= stage;
              const current = i === stage;
              return (
                <li key={t.key} className={`relative rounded-xl p-3 border transition ${
                  reached ? "border-tb-blue/40 bg-blue-50/40" : "border-border bg-white"
                } ${current ? "ring-2 ring-tb-blue/30" : ""}`}>
                  <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    reached ? "tb-gradient text-white" : "bg-secondary text-muted-foreground"
                  }`}>
                    {reached ? <CheckCircle2 className="size-4" /> : i + 1}
                  </div>
                  <div className={`mt-2 text-sm font-semibold ${reached ? "text-tb-navy" : "text-muted-foreground"}`}>{t.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Views progress */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Views</div>
              <div className="text-3xl font-bold text-tb-navy">{submission.views.toLocaleString("en-IN")}</div>
            </div>
            {nextMilestone ? (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Next milestone</div>
                <div className="text-sm font-semibold text-tb-blue">{nextMilestone.label} → ₹{nextMilestone.pay.toLocaleString("en-IN")}</div>
              </div>
            ) : (
              <div className="badge badge-green">Max tier reached</div>
            )}
          </div>
          <div className="mt-4 h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full tb-gradient relative shimmer" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{(lastMilestone?.label ?? "0")} views</span>
            <span>{nextMilestone ? `${nextMilestone.label} views` : "10L+"}</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat Icon={Eye} label="Views" value={submission.views.toLocaleString("en-IN")} />
            <Stat Icon={Heart} label="Likes" value={submission.likes.toLocaleString("en-IN")} />
            <Stat Icon={MessageCircle} label="Comments" value={submission.comments.toLocaleString("en-IN")} />
          </div>
        </div>

        {/* Payout */}
        <div className="card p-6 tb-gradient text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="badge bg-white/15 text-white border-white/20"><Wallet className="size-3.5" /> Payout</div>
            <div className="mt-3 text-xs text-white/70">{submission.status === "paid" ? "Sent to" : "Will be sent to"}</div>
            <div className="font-semibold">{submission.upi || "Not added"}</div>
            <div className="mt-5 text-4xl font-bold tb-text-gradient flex items-center gap-1">
              <IndianRupee className="size-7" />{submission.payoutInr.toLocaleString("en-IN")}
            </div>
            <div className="mt-1 text-xs text-white/70">
              {submission.status === "paid" ? "Transferred via UPI" :
               submission.status === "milestone_reached" ? "Queued for transfer (within 48h)" :
               "Cross a milestone to unlock"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <div className="text-sm font-semibold text-tb-navy mb-4">Quick actions</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/submit" className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-tb-blue transition">
            <div className="size-9 rounded-lg bg-blue-50 text-tb-blue flex items-center justify-center"><Send className="size-4" /></div>
            <div>
              <div className="text-sm font-semibold text-tb-navy">Submit another</div>
              <div className="text-xs text-muted-foreground">More videos = more payouts</div>
            </div>
          </Link>
          <Link to="/sop" className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-tb-blue transition">
            <div className="size-9 rounded-lg bg-blue-50 text-tb-blue flex items-center justify-center"><FileText className="size-4" /></div>
            <div>
              <div className="text-sm font-semibold text-tb-navy">Re-read SOP</div>
              <div className="text-xs text-muted-foreground">Boost approval rate</div>
            </div>
          </Link>
          <a href="mailto:creators@testbook.com" className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-tb-blue transition">
            <div className="size-9 rounded-lg bg-blue-50 text-tb-blue flex items-center justify-center"><ArrowRight className="size-4" /></div>
            <div>
              <div className="text-sm font-semibold text-tb-navy">Contact support</div>
              <div className="text-xs text-muted-foreground">creators@testbook.com</div>
            </div>
          </a>
        </div>
      </div>

      {/* Dev-only cycler */}
      {import.meta.env.DEV && (
        <div className="card p-4 flex items-center justify-between bg-amber-50/50 !border-amber-200">
          <div>
            <div className="text-xs font-semibold text-amber-800">DEV ONLY · Status cycler</div>
            <div className="text-xs text-amber-700">Cycles status + bumps views to test the flow.</div>
          </div>
          <button onClick={cycle} className="btn-ghost text-amber-800 border-amber-300">
            <RefreshCw className="size-4" /> Next status
          </button>
        </div>
      )}
    </section>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3.5" /> {label}</div>
      <div className="text-lg font-bold text-tb-navy">{value}</div>
    </div>
  );
}

function EmptyState({ phone }: { phone: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center fade-up">
      <div className="size-14 rounded-2xl tb-gradient mx-auto flex items-center justify-center text-white">
        <Send className="size-6" />
      </div>
      <h1 className="mt-4 text-3xl font-bold text-tb-navy">Welcome, +91 {phone}</h1>
      <p className="mt-2 text-muted-foreground">You haven't submitted a video yet. Drop your first reel — payouts unlock at 10K views.</p>
      <Link to="/submit" className="btn-orange mt-6 inline-flex">Submit your first video <ArrowRight className="size-4" /></Link>
    </section>
  );
}
