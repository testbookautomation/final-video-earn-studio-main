import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, Clock, Eye, Heart, MessageCircle, IndianRupee,
  Wallet, Send, FileText, Sparkles, AlertCircle, PartyPopper,
  ShieldCheck, XCircle, ExternalLink, RefreshCw,
} from "lucide-react";
import { getSubmission, getSubmissions, getUser, saveSubmission, setUser, type TBSubmission, type SubmissionStatus } from "@/lib/auth";
import { track } from "@/lib/analytics";

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

function earnedPayoutInr(views: number): number {
  return milestones
    .filter((milestone) => views >= milestone.v)
    .reduce((total, milestone) => total + milestone.pay, 0);
}

const timeline: { key: SubmissionStatus; label: string; desc: string }[] = [
  { key: "submitted",         label: "Submitted",        desc: "Video received" },
  { key: "under_review",      label: "Under review",     desc: "Team is verifying" },
  { key: "approved",          label: "Approved",         desc: "Cleared to publish" },
  { key: "live",              label: "Published",        desc: "Views being tracked" },
  { key: "milestone_reached", label: "Milestone hit",    desc: "Payout queued" },
  { key: "paid",              label: "Paid via UPI",     desc: "Money sent" },
];

const order: SubmissionStatus[] = ["submitted","under_review","approved","live","milestone_reached","paid"];

type SyncResult = {
  ok: boolean;
  found: boolean;
  status?: SubmissionStatus;
  rejectionReason?: string;
  views?: number;
  likes?: number;
  comments?: number;
  payoutInr?: number;
  payoutStatus?: string;
  payoutEligibility?: string;
  upi?: string;
};

function isEligible(value?: string): boolean {
  return (value ?? "").trim().toLowerCase() === "eligible";
}

function normalizedPayoutStatus(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isPaidPayoutStatus(value?: string): boolean {
  return ["paid", "completed", "success"].includes(normalizedPayoutStatus(value));
}

function effectiveStatus(submission: Pick<TBSubmission, "status" | "payoutStatus">): SubmissionStatus {
  if (submission.status === "rejected") return "rejected";
  if (submission.status === "paid" || isPaidPayoutStatus(submission.payoutStatus)) return "paid";
  return submission.status;
}

function displayPayoutInr(submission: Pick<TBSubmission, "status" | "views" | "payoutInr">): number {
  if (submission.status === "rejected") return 0;
  return Math.max(submission.payoutInr || 0, earnedPayoutInr(submission.views));
}

function statusEventName(status?: SubmissionStatus): string | null {
  switch (status) {
    case "under_review":      return "UGC_creators_video_review_started";
    case "approved":          return "UGC_creators_video_approved";
    case "rejected":          return "UGC_creators_video_rejected";
    case "live":              return "UGC_creators_video_live";
    case "milestone_reached": return "UGC_creators_video_milestone_reached";
    case "paid":              return "UGC_creators_payment_completed";
    default:                  return null;
  }
}

function paymentStatusEventName(status?: string): string | null {
  switch (normalizedPayoutStatus(status)) {
    case "initiated":
    case "processing":
    case "queued":
    case "pending": return "UGC_creators_payment_initiated";
    case "paid":
    case "completed":
    case "success": return "UGC_creators_payment_completed";
    case "failed":
    case "rejected": return "UGC_creators_payment_failed";
    default: return null;
  }
}

function statusClasses(status: SubmissionStatus): string {
  switch (status) {
    case "approved":
    case "live":
    case "milestone_reached":
    case "paid":
      return "badge-green";
    case "rejected":
      return "badge-red";
    case "under_review":
      return "badge-amber";
    default:
      return "";
  }
}

function paymentLabel(submission: TBSubmission): string {
  if (submission.payoutStatus) return submission.payoutStatus.replace(/_/g, " ");
  const status = effectiveStatus(submission);
  if (status === "paid") return "Paid";
  if (isEligible(submission.payoutEligibility) || status === "milestone_reached") return "Eligible";
  return "Not eligible yet";
}

function displayUserName(name: string, phone: string): string {
  return name.trim() || (phone ? `+91 ${phone}` : "Creator");
}

function DashboardPage() {
  const [submission, setSubmission] = useState<TBSubmission | null>(null);
  const [submissions, setSubmissions] = useState<TBSubmission[]>([]);
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setPhone(u.phone);
      setUserId(u.userId ?? u.phone);
      setUserName(u.name ?? "");
    }
    setSubmission(getSubmission());
    setSubmissions(getSubmissions());
    const sync = () => {
      setSubmission(getSubmission());
      setSubmissions(getSubmissions());
    };
    window.addEventListener("tb:submission", sync);
    return () => window.removeEventListener("tb:submission", sync);
  }, []);

  useEffect(() => {
    if (!phone || userName) return;

    let cancelled = false;
    fetch(`/api/fetch-upi?phone=${encodeURIComponent(phone)}&userId=${encodeURIComponent(userId || phone)}`)
      .then((r) => r.json())
      .then((data: { name?: string | null; studentId?: string | null }) => {
        const name = data.name?.trim();
        if (!name || cancelled) return;

        setUserName(name);
        const user = getUser();
        if (user) {
          setUser({
            ...user,
            name,
            userId: user.userId || data.studentId || userId || phone,
          });
        }
      })
      .catch(() => {
        /* Name is nice-to-have; dashboard can still load with phone fallback. */
      });

    return () => {
      cancelled = true;
    };
  }, [phone, userId, userName]);

  // Poll Apps Script for real status — on mount, every 30s, and on tab focus
  useEffect(() => {
    if (!phone || !userId) return;

    const TERMINAL: SubmissionStatus[] = ["paid", "rejected"];
    const POLL_MS = 30_000;

    const doSync = (isFirstLoad = false) => {
      const cur = getSubmission();
      if (cur && TERMINAL.includes(cur.status)) return;
      if (isFirstLoad) setSyncing(true);

      const submissionId = getSubmission()?.id ?? "";
      const syncUrl = `/api/sync-status?submissionId=${encodeURIComponent(submissionId)}&phone=${encodeURIComponent(phone)}&userId=${encodeURIComponent(userId)}`;
      fetch(syncUrl)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data: SyncResult) => {
          if (!data.ok) {
            setSyncError("Sync failed — will retry");
            return;
          }
          setSyncError(null);
          if (!data.found) return;
          const current = getSubmission();
          if (!current) return;
          const synced: TBSubmission = {
            ...current,
            status:            data.status ?? current.status,
            rejectionReason:   data.rejectionReason ?? current.rejectionReason,
            payoutEligibility: data.payoutEligibility ?? current.payoutEligibility,
            payoutStatus:      data.payoutStatus ?? current.payoutStatus,
            views:             data.views    ?? current.views,
            likes:             data.likes    ?? current.likes,
            comments:          data.comments ?? current.comments,
            payoutInr:         data.payoutInr && data.payoutInr > 0 ? data.payoutInr : current.payoutInr,
            upi:               data.upi && data.upi.length > 2 ? data.upi : current.upi,
          };
          const updated: TBSubmission = {
            ...synced,
            payoutInr: displayPayoutInr(synced),
            status: effectiveStatus(synced),
          };
          if (JSON.stringify(updated) !== JSON.stringify(current)) {
            const payload = {
              submissionId: current.id,
              previousStatus: current.status,
              status: updated.status,
              previousPayoutEligibility: current.payoutEligibility ?? "",
              payoutEligibility: updated.payoutEligibility ?? "",
              previousPayoutStatus: current.payoutStatus ?? "",
              payoutStatus: updated.payoutStatus ?? "",
              payoutInr: updated.payoutInr,
              views: updated.views,
              rejectionReason: updated.rejectionReason ?? "",
            };
            const statusEvent = current.status !== updated.status ? statusEventName(updated.status) : null;
            const firedEvents = new Set<string>();
            if (statusEvent) { track(statusEvent, { page: "/dashboard", payload }); firedEvents.add(statusEvent); }
            if (!isEligible(current.payoutEligibility) && isEligible(updated.payoutEligibility)) {
              track("UGC_creators_payment_eligible", { page: "/dashboard", payload });
            }
            const payoutEvent = current.payoutStatus !== updated.payoutStatus ? paymentStatusEventName(updated.payoutStatus) : null;
            if (payoutEvent && !firedEvents.has(payoutEvent)) track(payoutEvent, { page: "/dashboard", payload });
            saveSubmission(updated);
            setSubmission(updated);
            setSubmissions(getSubmissions());
          }
        })
        .catch(() => setSyncError("Network error — will retry"))
        .finally(() => { if (isFirstLoad) setSyncing(false); });
    };

    doSync(true);
    const timer = setInterval(() => doSync(false), POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") doSync(false); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phone, userId]);

  if (!submission) {
    return <EmptyState phone={phone} name={userName} />;
  }

  const displayName = displayUserName(userName, phone);
  const displayStatus = effectiveStatus(submission);
  const earnedAmount = displayPayoutInr(submission);
  const stage = order.indexOf(displayStatus);
  const isRejected = displayStatus === "rejected";
  const isPaymentEligible = isEligible(submission.payoutEligibility) || displayStatus === "milestone_reached" || displayStatus === "paid";
  const nextMilestone = milestones.find((m) => m.v > submission.views);
  const lastMilestone = [...milestones].reverse().find((m) => m.v <= submission.views);
  const progressPct = nextMilestone
    ? Math.min(100, ((submission.views - (lastMilestone?.v ?? 0)) / (nextMilestone.v - (lastMilestone?.v ?? 0))) * 100)
    : 100;

  const statusMeta = {
    rejected:          { bg: "bg-red-100",     icon: <XCircle className="size-7 text-red-600" />,      label: "Rejected",         msg: submission.rejectionReason || "Your video didn't meet our guidelines this time." },
    submitted:         { bg: "bg-blue-50",      icon: <Clock className="size-7 text-tb-blue" />,        label: "Submitted",        msg: "We received your video and it's in the queue." },
    under_review:      { bg: "bg-amber-50",     icon: <RefreshCw className="size-7 text-amber-500" />,  label: "Under Review",     msg: "Our team is verifying your video — usually done within 24 hours." },
    approved:          { bg: "bg-emerald-50",   icon: <CheckCircle2 className="size-7 text-emerald-600" />, label: "Approved",    msg: "Your video passed review. Views are now being tracked." },
    live:              { bg: "bg-emerald-50",   icon: <Sparkles className="size-7 text-emerald-600" />, label: "Live & Tracking",  msg: "Your video is live — cross a milestone to unlock a payout." },
    milestone_reached: { bg: "bg-violet-50",   icon: <PartyPopper className="size-7 text-violet-600" />,label: "Milestone Hit",   msg: "You crossed a payout milestone! Transfer will hit your UPI within 48h." },
    paid:              { bg: "bg-emerald-50",   icon: <PartyPopper className="size-7 text-emerald-600" />, label: "Paid via UPI", msg: "Money has been sent to your UPI account. Congratulations!" },
  } as const;
  const sm = statusMeta[displayStatus] ?? statusMeta["submitted"];

  return (
    <div className="min-h-screen bg-tb-bg">

      {/* ── Hero header band ── */}
      <div className="tb-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-black text-white select-none shrink-0">
                {displayName[0]?.toUpperCase() ?? "C"}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/50">Creator Dashboard</div>
                <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">{displayName}</h1>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isRejected ? "bg-red-400/20 text-red-200" :
                    displayStatus === "paid" ? "bg-emerald-400/20 text-emerald-200" :
                    "bg-white/15 text-white/80"
                  }`}>
                    <span className={`size-1.5 rounded-full ${isRejected ? "bg-red-400" : displayStatus === "paid" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                    {sm.label}
                  </span>
                  {syncing && <span className="text-xs text-white/50 flex items-center gap-1"><RefreshCw className="size-3 animate-spin" /> Syncing…</span>}
                  {syncError && !syncing && <span className="text-xs text-amber-300 flex items-center gap-1"><AlertCircle className="size-3" /> {syncError}</span>}
                </div>
              </div>
            </div>
            <Link to="/submit" className="btn-orange inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm self-start sm:self-auto shrink-0">
              <Send className="size-4" /> Submit another video
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">

        {/* ── Rejection banner ── */}
        {isRejected && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-4 fade-up">
            <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <XCircle className="size-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-red-800">Video rejected</div>
              <div className="text-sm text-red-700 mt-1 leading-relaxed">{submission.rejectionReason || "Your video didn't meet our content guidelines."}</div>
            </div>
            <Link to="/submit" className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors px-3 py-2 rounded-lg">
              Resubmit <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* ── Payment eligible banner ── */}
        {isPaymentEligible && !isRejected && displayStatus !== "paid" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-4 fade-up">
            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-emerald-800">Payment eligible</div>
              <div className="text-sm text-emerald-700/80 mt-0.5">UPI transfer will be initiated within 48 hours.</div>
            </div>
            {earnedAmount > 0 && (
              <div className="shrink-0 text-right">
                <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Amount</div>
                <div className="text-xl font-black text-emerald-800">₹{earnedAmount.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Status + Timeline card ── */}
        <div className="card overflow-hidden fade-up">
          {/* Status row */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border">
            <div className={`size-14 rounded-2xl ${sm.bg} flex items-center justify-center shrink-0`}>
              {sm.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Current status</div>
              <div className="text-2xl font-black text-tb-navy mt-0.5">{sm.label}</div>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{sm.msg}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {(displayStatus === "approved" || displayStatus === "live" || displayStatus === "milestone_reached" || displayStatus === "paid") && (
                <span className="badge badge-green text-xs"><CheckCircle2 className="size-3" /> Video approved</span>
              )}
              {isPaymentEligible && (
                <span className="badge badge-green text-xs"><ShieldCheck className="size-3" /> Payment eligible</span>
              )}
              {submission.videoUrl && (
                <a href={submission.videoUrl} target="_blank" rel="noreferrer" className="badge hover:bg-blue-50 text-xs text-tb-blue">
                  View video <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          {/* Timeline */}
          {!isRejected && (
            <div className="p-5 sm:p-6 bg-secondary/30">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Progress</div>
              <div className="relative">
                {/* connector line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border hidden sm:block" />
                <div className="absolute top-4 left-4 h-0.5 bg-tb-blue hidden sm:block transition-all duration-700"
                  style={{ width: stage >= 0 ? `${Math.min(((stage) / (timeline.length - 1)) * 100, 100)}%` : "0%" }} />
                <ol className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-0 relative">
                  {timeline.map((t, i) => {
                    const reached = i <= stage;
                    const current = i === stage;
                    return (
                      <li key={t.key} className="flex flex-col items-center text-center sm:px-1">
                        <div className={`relative size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all ${
                          reached ? "tb-gradient text-white border-tb-blue shadow-sm shadow-blue-200" :
                          current ? "border-tb-blue text-tb-blue bg-white" :
                          "border-border bg-white text-muted-foreground"
                        }`}>
                          {reached ? <CheckCircle2 className="size-4" /> : i + 1}
                        </div>
                        <div className={`mt-2 text-xs font-bold leading-tight ${current ? "text-tb-blue" : reached ? "text-tb-navy" : "text-muted-foreground"}`}>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{t.desc}</div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* ── Metrics + Payout ── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Views & engagement */}
          <div className="card p-6 lg:col-span-2 space-y-5 fade-up">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total views</div>
                <div className="text-5xl font-black text-tb-navy mt-1 leading-none">{submission.views.toLocaleString("en-IN")}</div>
              </div>
              {nextMilestone ? (
                <div className="text-right shrink-0 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-tb-blue uppercase tracking-wide">Next payout</div>
                  <div className="text-sm font-bold text-tb-navy mt-0.5">{nextMilestone.label} views</div>
                  <div className="text-lg font-black text-tb-orange">₹{nextMilestone.pay.toLocaleString("en-IN")}</div>
                </div>
              ) : (
                <div className="badge badge-green px-3 py-1.5 text-sm">Max tier 🎉</div>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full tb-gradient shimmer rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground font-medium">
                <span>{lastMilestone?.label ?? "0"} views</span>
                <span className="text-tb-blue font-semibold">{progressPct.toFixed(0)}% to next</span>
                <span>{nextMilestone ? `${nextMilestone.label} views` : "10L+"}</span>
              </div>
            </div>

            {/* Engagement stats */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <Stat Icon={Eye}           label="Views"    value={submission.views.toLocaleString("en-IN")} color="blue" />
              <Stat Icon={Heart}         label="Likes"    value={submission.likes.toLocaleString("en-IN")} color="rose" />
              <Stat Icon={MessageCircle} label="Comments" value={submission.comments.toLocaleString("en-IN")} color="violet" />
            </div>
          </div>

          {/* Payout card */}
          <div className="card tb-gradient text-white relative overflow-hidden fade-up">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-32 rounded-full bg-indigo-700/20 blur-2xl pointer-events-none" />
            <div className="relative p-6 flex flex-col h-full justify-between gap-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="badge bg-white/15 text-white border-white/20 text-xs"><Wallet className="size-3.5" /> UPI Payout</div>
                  {isPaymentEligible && (
                    <div className="badge bg-emerald-400/20 text-emerald-200 border-emerald-400/30 text-xs"><CheckCircle2 className="size-3" /> Eligible</div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    {displayStatus === "paid" ? "Sent to" : "Sending to"}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/90 truncate bg-white/10 px-3 py-2 rounded-lg">
                    {submission.upi || "UPI not added"}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Total earned</div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-white/60">₹</span>
                  <span className="text-5xl font-black text-white leading-none">{earnedAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 text-xs text-white/60 leading-relaxed">
                  {displayStatus === "paid"              ? "✓ Transferred to your UPI" :
                   displayStatus === "milestone_reached" ? "⏳ Queued — arrives within 48h" :
                   isPaymentEligible                     ? "⏳ Initiated — arrives within 48h" :
                   "Cross 10K views to unlock ₹500"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <UploadedVideos submissions={submissions} />

        {/* ── Quick actions ── */}
        <div className="grid sm:grid-cols-2 gap-3 fade-up">
          <Link to="/submit" className="card p-5 flex items-center gap-4 hover:border-tb-blue hover:shadow-md transition-all group">
            <div className="size-12 rounded-xl tb-gradient text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send className="size-5" />
            </div>
            <div>
              <div className="font-bold text-tb-navy">Submit another video</div>
              <div className="text-sm text-muted-foreground mt-0.5">More videos = more milestones = more payouts</div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground ml-auto shrink-0 group-hover:text-tb-blue transition-colors" />
          </Link>
          <Link to="/sop" className="card p-5 flex items-center gap-4 hover:border-tb-blue hover:shadow-md transition-all group">
            <div className="size-12 rounded-xl bg-blue-100 text-tb-blue flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="font-bold text-tb-navy">Re-read Creator SOP</div>
              <div className="text-sm text-muted-foreground mt-0.5">Tips that boost your approval rate to 90%+</div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground ml-auto shrink-0 group-hover:text-tb-blue transition-colors" />
          </Link>
        </div>

      </div>
    </div>
  );
}

function UploadedVideos({ submissions }: { submissions: TBSubmission[] }) {
  if (submissions.length === 0) return null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-base font-bold text-tb-navy">Uploaded videos</div>
          <div className="text-sm text-muted-foreground mt-0.5">Previous uploads, review status and payout state.</div>
        </div>
        <span className="badge text-xs">{submissions.length} total</span>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-3 pr-4 font-semibold">Video</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Payment</th>
              <th className="py-3 pl-4 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((item) => {
              const itemStatus = effectiveStatus(item);
              const itemAmount = displayPayoutInr(item);
              return (
                <tr key={item.id} className="border-b border-border/70 last:border-0">
                  <td className="py-4 pr-4">
                    <div className="font-semibold text-tb-navy truncate max-w-[280px]">
                      {item.videoFileName || `Video ${new Date(item.createdAt).toLocaleDateString("en-IN")}`}
                    </div>
                    <a
                      href={item.cdnUrl || item.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-tb-blue hover:underline"
                    >
                      Open video <ExternalLink className="size-3" />
                    </a>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`badge text-xs capitalize ${statusClasses(itemStatus)}`}>
                      {itemStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-tb-navy capitalize">{paymentLabel(item)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{item.upi || "UPI not added"}</div>
                  </td>
                  <td className="py-4 pl-4 text-right font-black text-tb-navy">
                    ₹{itemAmount.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {submissions.map((item) => {
          const itemStatus = effectiveStatus(item);
          const itemAmount = displayPayoutInr(item);
          return (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-tb-navy truncate">
                    {item.videoFileName || `Video ${new Date(item.createdAt).toLocaleDateString("en-IN")}`}
                  </div>
                  <a
                    href={item.cdnUrl || item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-tb-blue hover:underline"
                  >
                    Open video <ExternalLink className="size-3" />
                  </a>
                </div>
                <span className={`badge text-xs capitalize shrink-0 ${statusClasses(itemStatus)}`}>
                  {itemStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Payment</div>
                  <div className="font-semibold text-tb-navy capitalize">{paymentLabel(item)}</div>
                </div>
                <div className="text-right">
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-black text-tb-navy">₹{itemAmount.toLocaleString("en-IN")}</div>
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3.5 hover:border-tb-blue/40 transition-colors">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-1"><Icon className="size-3.5" /> {label}</div>
      <div className="text-xl font-black text-tb-navy">{value}</div>
    </div>
  );
}

function EmptyState({ phone, name }: { phone: string; name: string }) {
  const displayName = displayUserName(name, phone);

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center fade-up">
      <img
        src="https://cdn.testbook.com/1755173671769-testbook-logo.png/1755173673.png"
        alt="Testbook"
        className="h-10 w-auto mx-auto"
      />
      <h1 className="mt-6 text-3xl font-bold text-tb-navy">Welcome, {displayName}!</h1>
      <p className="mt-3 text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
        You haven't sent us a video yet. Create your first publish-ready video — payouts start at <strong className="text-tb-navy">10,000 views (₹500)</strong>.
      </p>
      <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto">
        {[
          { n: "1", t: "Create the video", d: "30–60 second vertical video on your exam prep journey" },
          { n: "2", t: "Upload to Testbook", d: "Give us the final video file for review" },
          { n: "3", t: "We publish and track", d: "Milestones on the published video trigger UPI payout" },
        ].map(({ n, t, d }) => (
          <div key={n} className="card p-5">
            <div className="size-8 rounded-full tb-gradient text-white text-sm font-bold flex items-center justify-center">{n}</div>
            <div className="mt-3 text-sm font-bold text-tb-navy">{t}</div>
            <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{d}</div>
          </div>
        ))}
      </div>
      <Link to="/submit" className="btn-orange mt-8 inline-flex text-base px-8 py-3.5">Send your first video <ArrowRight className="size-4" /></Link>
    </section>
  );
}
