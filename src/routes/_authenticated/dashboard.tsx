import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, Clock, Eye, Heart, MessageCircle, IndianRupee,
  Wallet, Send, FileText, Sparkles, AlertCircle, PartyPopper,
  ShieldCheck, XCircle, ExternalLink, RefreshCw, Film, Lock, Play, ChevronDown, X
} from "lucide-react";
import { getSubmissions, getUser, saveSubmission, setUser, type TBSubmission, type SubmissionStatus } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { openModal } from "@/lib/modal-events";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Creators Lab" },
      { name: "description", content: "Track your submission status, view milestones, and UPI incentives in real time." },
      { property: "og:title", content: "Dashboard — Creators Lab" },
      { property: "og:url", content: "/dashboard" },
    ],
  }),
  component: DashboardPage,
});

const milestones = [
  { v: 5000,  label: "5K",   pay: 200  },
  { v: 10000, label: "10K",  pay: 350  },
  { v: 20000, label: "20K",  pay: 500  },
  { v: 50000, label: "50K+", pay: 1000 },
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
  { key: "milestone_reached", label: "Milestone hit",    desc: "Incentive queued" },
  { key: "paid",              label: "Paid via UPI",     desc: "Money sent" },
];

const order: SubmissionStatus[] = ["submitted","under_review","approved","live","milestone_reached","paid"];

type SyncResult = {
  ok: boolean;
  found: boolean;
  sheetSubmissionId?: string;
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

function statusLabel(status: SubmissionStatus): string {
  switch (status) {
    case "submitted":         return "Submitted";
    case "under_review":      return "Under Review";
    case "approved":          return "Approved";
    case "live":              return "Live";
    case "milestone_reached": return "Milestone Hit";
    case "paid":              return "Paid";
    case "rejected":          return "Rejected";
    default:                  return status;
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

function videoDate(submission: Pick<TBSubmission, "createdAt">): string {
  return new Date(submission.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function videoName(submission: Pick<TBSubmission, "createdAt" | "videoFileName">): string {
  return submission.videoFileName || `Uploaded ${videoDate(submission)}`;
}

function videoOptionLabel(submission: TBSubmission): string {
  return `ID ${submission.id} - ${videoName(submission)}`;
}

function DashboardPage() {
  const [submissions, setSubmissions] = useState<TBSubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
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
    const sync = () => {
      const next = getSubmissions();
      setSubmissions(next);
      setSelectedSubmissionId((current) =>
        current && next.some((item) => item.id === current) ? current : next[0]?.id ?? "",
      );
    };
    sync();
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
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [phone, userId, userName]);

  // Poll Apps Script for real status — on mount, every 30s, and on tab focus
  useEffect(() => {
    if (!phone || !userId) return;

    const TERMINAL: SubmissionStatus[] = ["paid", "rejected"];
    const POLL_MS = 30_000;

    const syncOne = (sub: TBSubmission): Promise<void> => {
      const syncUrl = `/api/sync-status?submissionId=${encodeURIComponent(sub.id)}&phone=${encodeURIComponent(phone)}&userId=${encodeURIComponent(userId)}`;
      return fetch(syncUrl)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<SyncResult>;
        })
        .then((data) => {
          if (!data.ok || !data.found) return;
          const synced: TBSubmission = {
            ...sub,
            status:            data.status            ?? sub.status,
            rejectionReason:   data.rejectionReason   ?? sub.rejectionReason,
            payoutEligibility: data.payoutEligibility ?? sub.payoutEligibility,
            payoutStatus:      data.payoutStatus      ?? sub.payoutStatus,
            views:             data.views             ?? sub.views,
            likes:             data.likes             ?? sub.likes,
            comments:          data.comments          ?? sub.comments,
            payoutInr:         data.payoutInr && data.payoutInr > 0 ? data.payoutInr : sub.payoutInr,
            upi:               data.upi && data.upi.length > 2 ? data.upi : sub.upi,
          };
          const updated: TBSubmission = {
            ...synced,
            payoutInr: displayPayoutInr(synced),
            status:    effectiveStatus(synced),
          };
          if (JSON.stringify(updated) === JSON.stringify(sub)) return;
          const payload = {
            submissionId:              sub.id,
            previousStatus:            sub.status,
            status:                    updated.status,
            previousPayoutEligibility: sub.payoutEligibility ?? "",
            payoutEligibility:         updated.payoutEligibility ?? "",
            previousPayoutStatus:      sub.payoutStatus ?? "",
            payoutStatus:              updated.payoutStatus ?? "",
            payoutInr:                 updated.payoutInr,
            views:                     updated.views,
            rejectionReason:           updated.rejectionReason ?? "",
          };
          const firedEvents = new Set<string>();
          const statusEvent = sub.status !== updated.status ? statusEventName(updated.status) : null;
          if (statusEvent) { track(statusEvent, { page: "/dashboard", payload }); firedEvents.add(statusEvent); }
          if (!isEligible(sub.payoutEligibility) && isEligible(updated.payoutEligibility)) {
            track("UGC_creators_payment_eligible", { page: "/dashboard", payload });
          }
          const payoutEvent = sub.payoutStatus !== updated.payoutStatus ? paymentStatusEventName(updated.payoutStatus) : null;
          if (payoutEvent && !firedEvents.has(payoutEvent)) track(payoutEvent, { page: "/dashboard", payload });
          saveSubmission(updated);
        });
    };

    const doSync = (isFirstLoad = false) => {
      const toSync = getSubmissions().filter((s) => !TERMINAL.includes(s.status));
      if (toSync.length === 0) return;
      if (isFirstLoad) setSyncing(true);

      let anyError = false;
      Promise.all(
        toSync.map((sub) =>
          syncOne(sub).catch(() => { anyError = true; }),
        ),
      ).then(() => {
        const next = getSubmissions();
        setSyncError(anyError ? "Sync failed — will retry" : null);
        setSubmissions(next);
        setSelectedSubmissionId((current) =>
          current && next.some((item) => item.id === current) ? current : next[0]?.id ?? "",
        );
      }).finally(() => {
        if (isFirstLoad) setSyncing(false);
      });
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

  const submission = submissions.find((item) => item.id === selectedSubmissionId) ?? submissions[0] ?? null;

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
    submitted:         { bg: "bg-blue-50",      icon: <Clock className="size-7 text-tb-blue animate-pulse" />,        label: "Submitted",        msg: "We received your video and it's in the queue." },
    under_review:      { bg: "bg-amber-50",     icon: <RefreshCw className="size-7 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />,  label: "Under Review",     msg: "Our team is verifying your video — usually done within 24 hours." },
    approved:          { bg: "bg-emerald-50",   icon: <CheckCircle2 className="size-7 text-emerald-600" />, label: "Approved",    msg: "Your video passed review. Views are now being tracked." },
    live:              { bg: "bg-emerald-50",   icon: <Sparkles className="size-7 text-emerald-600 animate-pulse" />, label: "Live & Tracking",  msg: "Your video is live — cross a milestone to unlock an incentive." },
    milestone_reached: { bg: "bg-violet-50",   icon: <PartyPopper className="size-7 text-violet-600" />,label: "Milestone Hit",   msg: "You crossed an incentive milestone! Transfer will hit your UPI within 48h." },
    paid:              { bg: "bg-emerald-50",   icon: <PartyPopper className="size-7 text-emerald-600" />, label: "Paid via UPI", msg: "Money has been sent to your UPI account. Congratulations!" },
  } as const;
  const sm = statusMeta[displayStatus] ?? statusMeta["submitted"];

  return (
    <div className="min-h-screen bg-tb-bg pb-12">

      {/* ── Hero header band ── */}
      <div className="tb-gradient text-white relative overflow-hidden shadow-lg shadow-blue-900/10">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-start xs:items-center gap-3.5 sm:gap-4">
              <div className="size-14 sm:size-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white select-none shrink-0 shadow-inner relative">
                <span className="relative z-10">{displayName[0]?.toUpperCase() ?? "C"}</span>
                <span className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-emerald-500 rounded-full border-2 border-[#0b1437]" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Creator Dashboard</div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">{displayName}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white/90`}>
                    <span className={`size-2 rounded-full ${isRejected ? "bg-red-400" : displayStatus === "paid" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                    {sm.label}
                  </span>
                  {syncing && <span className="text-[10px] font-bold text-white/60 bg-white/5 backdrop-blur px-2.5 py-1 rounded-xl flex items-center gap-1.5"><RefreshCw className="size-3 animate-spin" /> Syncing…</span>}
                  {syncError && !syncing && <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1"><AlertCircle className="size-3" /> {syncError}</span>}
                </div>
              </div>
            </div>
            
            <Link to="/submit" className="btn-orange w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm shrink-0 shadow-lg shadow-orange-500/20 hover:scale-102 active:scale-98 transition-transform">
              <Send className="size-4 animate-bounce" style={{ animationDuration: '3s' }} /> Submit Video Entry
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">

        {/* ── Rejection banner ── */}
        {isRejected && (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-start gap-4 fade-up glass">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="size-10 sm:size-11 rounded-xl sm:rounded-2xl bg-red-100 flex items-center justify-center shrink-0 shadow-inner">
                <XCircle className="size-5 sm:size-6 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-red-900 text-sm sm:text-base">Video revision required</div>
                <div className="text-xs sm:text-sm text-red-800 mt-1 leading-relaxed">{submission.rejectionReason || "Your video didn't meet our creators content guidelines."}</div>
              </div>
            </div>
            <Link to="/submit" className="sm:shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 transition-all px-4 py-3 sm:py-2.5 rounded-xl shadow-md w-full sm:w-auto">
              Resubmit <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* ── Incentive eligible banner ── */}
        {isPaymentEligible && !isRejected && displayStatus !== "paid" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-up glass">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="size-10 sm:size-11 rounded-xl sm:rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="size-5.5 sm:size-6 text-emerald-600 animate-bounce" style={{ animationDuration: '4s' }} />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-emerald-800 text-sm sm:text-base">Payout verified &amp; approved</div>
                <div className="text-xs sm:text-sm text-emerald-700/80 mt-1">UPI transfer is processing. Expected inside your wallet in 24-48 hours.</div>
              </div>
            </div>
            {earnedAmount > 0 && (
              <div className="self-start sm:self-auto shrink-0 text-left sm:text-right bg-emerald-100/50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm w-full sm:w-auto">
                <div className="text-[9px] text-emerald-700 font-bold uppercase tracking-wide">Earned Payout</div>
                <div className="text-lg sm:text-2xl font-black text-emerald-800 mt-0.5">₹{earnedAmount.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Status + Timeline card ── */}
        <div className="card overflow-hidden fade-up bg-white shadow-sm border-border/80 rounded-2xl sm:rounded-[24px]">
          {/* Status Row */}
          <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5 border-b border-border bg-white">
            <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
              <div className={`size-12 sm:size-14 rounded-xl sm:rounded-2xl ${sm.bg} flex items-center justify-center shrink-0 shadow-sm border border-border/10`}>
                {sm.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Video Status</div>
                <div className="text-lg sm:text-2xl font-black text-tb-navy mt-0.5">{sm.label}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sm.msg}</p>
              </div>
            </div>
            
            <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
              <div className="w-full sm:w-80">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active submission file</span>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-tb-blue transition-colors z-10">
                    <Film className="size-4 shrink-0" />
                  </div>
                  <select
                    value={submission.id}
                    onChange={(event) => setSelectedSubmissionId(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-tb-blue/30 pl-10 pr-10 py-2.5 text-sm font-bold text-tb-navy shadow-sm outline-none transition duration-300 focus:border-tb-blue focus:bg-white focus:ring-4 focus:ring-tb-blue/10 cursor-pointer relative z-0"
                  >
                    {submissions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {videoOptionLabel(item)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-tb-blue transition-colors z-10">
                    <ChevronDown className="size-4 shrink-0" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {(displayStatus === "approved" || displayStatus === "live" || displayStatus === "milestone_reached" || displayStatus === "paid") && (
                  <span className="badge badge-green text-[10px] font-bold"><CheckCircle2 className="size-3" /> Reviewed &amp; Approved</span>
                )}
                {isPaymentEligible && (
                  <span className="badge badge-green text-[10px] font-bold"><ShieldCheck className="size-3" /> Incentive Active</span>
                )}
                {submission.videoUrl && (
                  <a href={submission.videoUrl} target="_blank" rel="noreferrer" className="badge hover:bg-blue-50 text-[10px] font-extrabold text-tb-blue inline-flex items-center gap-1 border border-blue-200 bg-blue-50/40">
                    Open File <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Process */}
          {!isRejected && (
            <div className="p-4 sm:p-6 bg-secondary/20">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Verification pipeline</div>
              
              {/* Desktop Horizontal Stepper */}
              <div className="hidden sm:block relative animate-bounce-in">
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-border z-0" />
                <div 
                  className="absolute top-4 left-6 h-0.5 bg-tb-blue z-0 transition-all duration-700 ease-out"
                  style={{ width: stage >= 0 ? `${Math.min(((stage) / (timeline.length - 1)) * 100, 100)}%` : "0%" }} 
                />
                
                <ol className="grid grid-cols-6 relative z-10">
                  {timeline.map((t, i) => {
                    const reached = i <= stage;
                    const current = i === stage;
                    return (
                      <li key={t.key} className="flex flex-col items-center text-center px-1">
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all duration-300 ${
                          reached ? "tb-gradient text-white border-tb-blue shadow-md shadow-blue-200 scale-105" :
                          current ? "border-tb-blue text-tb-blue bg-white animate-pulse" :
                          "border-border bg-white text-muted-foreground"
                        }`}>
                          {reached ? <CheckCircle2 className="size-4.5" /> : i + 1}
                        </div>
                        <div className={`mt-2 text-xs font-bold leading-tight ${current ? "text-tb-blue" : reached ? "text-tb-navy" : "text-muted-foreground"}`}>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 leading-snug max-w-[90px]">{t.desc}</div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Mobile Vertical Stepper - optimized with translucent premium glass blocks and glows */}
              <div className="sm:hidden space-y-3 relative py-2 animate-bounce-in">
                {/* Connecting track line */}
                <div className="absolute top-[12px] bottom-[12px] left-[11px] w-0.5 bg-border/60 z-0 rounded-full">
                  <div 
                    className="w-full bg-tb-blue transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                    style={{ height: `${(stage / (timeline.length - 1)) * 100}%` }}
                  />
                </div>
                
                {timeline.map((t, i) => {
                  const reached = i <= stage;
                  const current = i === stage;
                  return (
                    <div key={t.key} className="flex items-start gap-4 relative z-10 group">
                      {/* Step Indicator Pin */}
                      <div className={`size-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 shrink-0 transition-all duration-300 relative ${
                        reached ? "tb-gradient text-white border-tb-blue shadow-md shadow-blue-500/20 scale-105" :
                        current ? "border-tb-blue text-tb-blue bg-white animate-pulse" :
                        "border-border bg-white text-muted-foreground"
                      }`}>
                        {reached ? <CheckCircle2 className="size-3.5 text-white" /> : i + 1}
                        {current && (
                          <span className="absolute -inset-1 rounded-full border border-tb-blue animate-ping opacity-35" />
                        )}
                      </div>
                      
                      {/* Detailed Translucent Glass Card */}
                      <div className={`flex-1 min-w-0 rounded-xl p-3 border transition-all duration-300 ${
                        current ? "bg-blue-50/50 border-blue-200/80 shadow-md shadow-blue-500/5 translate-x-0.5" :
                        reached ? "bg-slate-50/40 border-slate-100" :
                        "bg-slate-50/20 border-slate-100/50 opacity-60"
                      }`}>
                        <div className={`text-xs font-extrabold leading-tight ${current ? "text-tb-blue" : reached ? "text-tb-navy" : "text-muted-foreground"}`}>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* ── Milestone Payout Roadmap Card ── */}
        {!isRejected && (
          <div className="card p-4 sm:p-6 bg-white shadow-sm border-border/80 fade-up rounded-2xl sm:rounded-[24px]">
            <div className="flex items-center justify-between gap-3 mb-6 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-extrabold text-tb-navy">Incentive Road Map</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Views milestones automatically trigger direct UPI payouts.</p>
              </div>
              <span className="badge badge-orange"><Sparkles className="size-3.5 fill-tb-orange text-tb-orange animate-spin" style={{ animationDuration: '4s' }} /> Cumulative payouts</span>
            </div>

            {/* Stepper container */}
            <div className="relative">
              {/* Desktop Horizontal Stepper */}
              <div className="hidden sm:block py-4">
                <div className="absolute top-10 left-[12.5%] right-[12.5%] h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                <div 
                  className="absolute top-10 left-[12.5%] h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  style={{ 
                    width: `${
                      submission.views >= 50000 ? "75%" :
                      submission.views >= 20000 ? "50%" :
                      submission.views >= 10000 ? "25%" :
                      submission.views >= 5000 ? "12.5%" : "0%"
                    }`
                  }}
                />

                <div className="grid grid-cols-4 relative z-10">
                  {milestones.map((m, idx) => {
                    const isCrossed = submission.views >= m.v;
                    const isNext = !isCrossed && (idx === 0 || submission.views >= milestones[idx - 1].v);
                    const percent = isNext 
                      ? ((submission.views - (idx === 0 ? 0 : milestones[idx - 1].v)) / (m.v - (idx === 0 ? 0 : milestones[idx - 1].v))) * 100 
                      : 0;

                    return (
                      <div key={m.v} className="flex flex-col items-center text-center px-2 group">
                        <div className={`size-12 rounded-[18px] flex items-center justify-center border-2 transition-all duration-300 relative ${
                          isCrossed ? "bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-400 text-white glow-emerald scale-105" :
                          isNext    ? "bg-white border-tb-blue text-tb-blue scale-105 shadow-lg shadow-blue-100" :
                          "bg-slate-50/60 backdrop-blur-sm border-slate-100 text-slate-400 opacity-60"
                        }`}>
                          {isNext && (
                            <span className="absolute -inset-1 rounded-[22px] border-2 border-tb-blue animate-ping opacity-25" />
                          )}
                          {isCrossed ? <CheckCircle2 className="size-6 text-white" /> : isNext ? <Play className="size-5 text-tb-blue rotate-90 fill-tb-blue animate-pulse" /> : <Lock className="size-5 text-slate-400" />}
                        </div>
                        
                        <div className="mt-4 space-y-1">
                          <div className={`text-xs font-black uppercase tracking-wider ${isCrossed ? "text-emerald-600" : isNext ? "text-tb-blue" : "text-slate-400"}`}>
                            {m.label} views
                          </div>
                          <div className="text-sm font-black text-tb-navy">
                            ₹{m.pay} Incentive
                          </div>
                          {isCrossed ? (
                            <span className="badge badge-green text-[9px] font-bold py-0.5 px-2 mt-2">Earned</span>
                          ) : isNext ? (
                            <div className="flex flex-col items-center gap-1 mt-2">
                              <span className="badge badge-blue text-[9px] font-bold py-0.5 px-2">Active · {percent.toFixed(0)}%</span>
                              <div className="h-1.5 w-16 bg-blue-100 rounded-full overflow-hidden mt-1.5">
                                <div className="h-full tb-gradient rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="badge bg-slate-100 border-slate-200 text-slate-400 text-[9px] font-bold py-0.5 px-2 mt-2">Locked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Vertical Stepper - re-imagined as a Web3/gaming timeline with rich emerald details */}
              <div className="sm:hidden space-y-4 relative py-1.5">
                {/* Connecting track line */}
                <div className="absolute top-[16px] bottom-[16px] left-[15px] w-0.5 bg-slate-100 z-0 rounded-full">
                  <div 
                    className="w-full bg-emerald-500 z-0 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    style={{ 
                      height: `${
                        submission.views >= 50000 ? "100%" :
                        submission.views >= 20000 ? "66%" :
                        submission.views >= 10000 ? "33%" : "0%"
                      }`
                    }}
                  />
                </div>

                {milestones.map((m, idx) => {
                  const isCrossed = submission.views >= m.v;
                  const isNext = !isCrossed && (idx === 0 || submission.views >= milestones[idx - 1].v);
                  const percent = isNext 
                    ? ((submission.views - (idx === 0 ? 0 : milestones[idx - 1].v)) / (m.v - (idx === 0 ? 0 : milestones[idx - 1].v))) * 100 
                    : 0;

                  return (
                    <div key={m.v} className="flex items-start gap-4 relative z-10 group">
                      {/* Milestone Icon Indicator */}
                      <div className={`size-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shrink-0 relative ${
                        isCrossed ? "bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-400 text-white glow-emerald scale-105" :
                        isNext    ? "bg-white border-tb-blue text-tb-blue scale-105 shadow-md shadow-blue-100" :
                        "bg-slate-50/60 backdrop-blur-sm border-slate-100 text-slate-400 opacity-60"
                      }`}>
                        {isNext && (
                          <span className="absolute -inset-1 rounded-xl border border-tb-blue animate-ping opacity-35" />
                        )}
                        {isCrossed ? <CheckCircle2 className="size-4 text-white" /> : isNext ? <Play className="size-3.5 text-tb-blue rotate-90 fill-tb-blue animate-pulse" /> : <Lock className="size-3.5 text-slate-400" />}
                      </div>
                      
                      {/* Translucent Glass Card Detail Container */}
                      <div className={`flex-1 min-w-0 rounded-xl p-3 border transition-all duration-300 ${
                        isCrossed ? "bg-emerald-50/40 border-emerald-200/80 shadow-md shadow-emerald-500/5" :
                        isNext    ? "bg-blue-50/50 border-blue-200/80 shadow-md shadow-blue-500/5 translate-x-0.5" :
                        "bg-slate-50/20 border-slate-100/50 opacity-60"
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-black ${isCrossed ? "text-emerald-700" : isNext ? "text-tb-blue" : "text-slate-400"}`}>
                            {m.label} Views Target
                          </span>
                          <span className={`text-xs font-black ${isCrossed ? "text-emerald-700" : "text-tb-navy"}`}>
                            +₹{m.pay}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          {isCrossed ? (
                            <span className="badge badge-green text-[9px] font-bold py-0.5 px-2">Payout unlocked</span>
                          ) : isNext ? (
                            <div className="flex items-center gap-2.5 w-full">
                              <span className="badge badge-blue text-[9px] font-bold py-0.5 px-2 shrink-0">Active · {percent.toFixed(0)}%</span>
                              <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden flex-1">
                                <div className="h-full tb-gradient rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="badge bg-slate-100 border-slate-200 text-slate-400 text-[9px] font-bold py-0.5 px-2">Locked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ── Metrics + Incentive Cards Grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Engagement Card */}
          <div className="card p-4 sm:p-6 lg:col-span-2 space-y-4 sm:space-y-5 bg-white shadow-sm border-border/80 fade-up rounded-2xl sm:rounded-[24px]">
            <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Accumulated views</div>
                <div className="text-3xl xs:text-4xl sm:text-5xl font-black text-tb-navy mt-1 leading-none tabular-nums">
                  {submission.views.toLocaleString("en-IN")}
                </div>
              </div>
              
              {nextMilestone ? (
                <div className="text-left xs:text-right shrink-0 bg-blue-50/50 border border-blue-100/60 rounded-2xl p-3 shadow-inner max-w-max xs:max-w-none">
                  <div className="text-[9px] font-bold text-tb-blue uppercase tracking-wide">Next milestone</div>
                  <div className="text-xs font-extrabold text-tb-navy mt-0.5">{nextMilestone.label} views</div>
                  <div className="text-sm sm:text-base font-black text-tb-orange mt-0.5">₹{nextMilestone.pay.toLocaleString("en-IN")}</div>
                </div>
              ) : (
                <div className="badge badge-green px-3 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-bold shrink-0 self-start xs:self-auto">Max Milestone Tier Crossed 🌟</div>
              )}
            </div>

            {/* Linear Progress with notch markers */}
            <div className="relative pt-1">
              <div className="h-3 rounded-full bg-secondary overflow-hidden relative shadow-inner">
                <div className="h-full tb-gradient shimmer rounded-full transition-all duration-750 ease-out" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground font-semibold">
                <span>{lastMilestone?.label ?? "0"} Views</span>
                <span className="text-tb-blue font-bold">{progressPct.toFixed(0)}% Completed</span>
                <span>{nextMilestone ? `${nextMilestone.label} Views` : "Max"}</span>
              </div>
            </div>

            {/* Metrics grid layout (3-column on all screens, highly optimized sizes) */}
            <div className="grid grid-cols-3 gap-1.5 xs:gap-3 pt-2">
              <Stat Icon={Eye}           label="Views"    value={submission.views.toLocaleString("en-IN")} color="blue" />
              <Stat Icon={Heart}         label="Likes"    value={submission.likes.toLocaleString("en-IN")} color="rose" />
              <Stat Icon={MessageCircle} label="Comments" value={submission.comments.toLocaleString("en-IN")} color="violet" />
            </div>
          </div>

          {/* Incentive Payout Card */}
          <div className="card bg-[#0b1437] border-white/10 p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden rounded-2xl sm:rounded-[24px] text-white shadow-2xl glow-blue fade-up hover-lift">
            {/* Holographic Glowing Rings */}
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-400/20 blur-xl pointer-events-none" />
            <div className="absolute -top-12 -right-12 size-48 rounded-full border border-white/10 opacity-30 pointer-events-none animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute -top-6 -right-6 size-36 rounded-full border border-dashed border-white/15 opacity-40 pointer-events-none animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
            
            <div className="relative z-10 flex flex-col justify-between h-full gap-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="badge bg-white/10 text-white border-white/20 text-[10px] font-bold"><Wallet className="size-3.5" /> UPI Incentive</div>
                  {isPaymentEligible && (
                    <div className="badge bg-emerald-400/20 text-emerald-200 border-emerald-400/30 text-[10px] font-bold animate-pulse"><CheckCircle2 className="size-3" /> Linked</div>
                  )}
                </div>
                
                <div className="mt-5 space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/50">Linked Payout Account</div>
                  <div className="text-xs font-mono font-bold text-white/95 truncate bg-white/10 px-3 py-2.5 rounded-xl border border-white/10 shadow-inner">
                    {submission.upi || "UPI not linked yet"}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Cumulative Earned Payout</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white/60">₹</span>
                  <span className="text-4xl sm:text-5xl font-black text-white leading-none tabular-nums">{earnedAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-3 text-xs text-white/70 leading-relaxed font-semibold flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full shrink-0 ${displayStatus === "paid" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                  <span>
                    {displayStatus === "paid"              ? "Credited to linked UPI account" :
                     displayStatus === "milestone_reached" ? "Incentive queued — expected within 48h" :
                     isPaymentEligible                     ? "Processed — expected within 48h" :
                     "Target 5K views in 48h to unlock ₹200"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Previous Submissions List ── */}
        <UploadedVideos submissions={submissions} />

        {/* ── Action Grid ── */}
        <div className="grid sm:grid-cols-2 gap-4 pt-1 fade-up">
          <Link to="/submit" className="card p-5 flex items-center gap-4 hover:border-tb-blue/30 hover:shadow-lg transition-all group bg-white shadow-sm border-border/80 cursor-pointer">
            <div className="size-12 rounded-2xl tb-gradient text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
              <Send className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-tb-navy text-sm sm:text-base">Upload another video</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Submit multiple entries to stack cumulative view payouts!</div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground ml-auto shrink-0 group-hover:text-tb-blue group-hover:translate-x-1 transition-all" />
          </Link>
          
          <Link to="/how-to" className="card p-5 flex items-center gap-4 hover:border-tb-blue/30 hover:shadow-lg transition-all group bg-white shadow-sm border-border/80 cursor-pointer">
            <div className="size-12 rounded-2xl bg-blue-100 text-tb-blue flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <FileText className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-tb-navy text-sm sm:text-base">Creator Guideline Packs</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Review layout guidelines to boost video approval probability.</div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground ml-auto shrink-0 group-hover:text-tb-blue group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

      </div>
    </div>
  );
}

function UploadedVideos({ submissions }: { submissions: TBSubmission[] }) {
  if (submissions.length === 0) return null;

  const [drawerSubmission, setDrawerSubmission] = useState<TBSubmission | null>(null);

  return (
    <div className="card p-4 sm:p-6 bg-white shadow-sm border-border/80 fade-up rounded-2xl sm:rounded-[24px]">
      <div className="flex items-center justify-between gap-3 mb-6 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-extrabold text-tb-navy">Upload logs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Historical verification records, stats &amp; payout transfers.</p>
        </div>
        <span className="badge text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-600">{submissions.length} uploads total</span>
      </div>

      {/* Tappable Card Deck Layout (responsive grid, gorgeous interactive cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map((item) => {
          const itemStatus = effectiveStatus(item);
          const itemAmount = displayPayoutInr(item);
          return (
            <div 
              key={item.id} 
              onClick={() => setDrawerSubmission(item)}
              className="group rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-tb-blue/30 bg-gradient-to-br from-white to-slate-50/20 p-4 sm:p-5 shadow-sm relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="size-11 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden border border-slate-800">
                    <Film className="size-5 text-slate-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/25 transition-all">
                      <Play className="size-3.5 text-white fill-white" />
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-tb-navy text-sm truncate leading-snug group-hover:text-tb-blue transition-colors" title={videoName(item)}>
                      {videoName(item)}
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono truncate">
                      ID: {item.id}
                    </div>
                  </div>
                  
                  <span className={`badge text-[9px] font-black uppercase tracking-wider ${statusClasses(itemStatus)} py-0.5 px-2 shrink-0`}>
                    {statusLabel(itemStatus)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5 bg-white/60 p-3 rounded-xl sm:rounded-2xl border border-slate-100/60 shadow-inner">
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Views Accumulated</div>
                    <div className="font-extrabold text-tb-navy text-sm mt-0.5 tabular-nums flex items-center gap-1">
                      <Eye className="size-3.5 text-tb-blue shrink-0" />
                      <span>{item.views > 0 ? item.views.toLocaleString("en-IN") : "0"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">UPI Incentive</div>
                    <div className="font-black text-emerald-700 text-sm mt-0.5 tabular-nums">
                      ₹{itemAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-muted-foreground font-bold">
                <span className="text-slate-400 font-medium">Uploaded {videoDate(item)}</span>
                <span className="text-tb-blue font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Details &amp; Timeline <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-up details drawer/modal sheet */}
      {drawerSubmission && (
        <>
          <div 
            className="mobile-bottom-sheet-overlay" 
            onClick={() => setDrawerSubmission(null)} 
          />
          <div className="mobile-bottom-sheet p-6 max-w-lg mx-auto rounded-t-3xl bg-white">
            {/* Drawer drag handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
            
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-black text-tb-navy leading-snug">{videoName(drawerSubmission)}</h4>
                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {drawerSubmission.id} • {videoDate(drawerSubmission)}</p>
              </div>
              <button 
                onClick={() => setDrawerSubmission(null)}
                className="size-8 rounded-full bg-secondary flex items-center justify-center text-tb-navy hover:text-tb-blue hover:bg-border transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Watch and Status badge */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className={`badge text-[10px] font-black uppercase tracking-wider ${statusClasses(effectiveStatus(drawerSubmission))}`}>
                {statusLabel(effectiveStatus(drawerSubmission))}
              </span>
              {(drawerSubmission.cdnUrl || drawerSubmission.videoUrl) && (
                <a
                  href={drawerSubmission.cdnUrl || drawerSubmission.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="badge hover:bg-blue-50 text-[10px] font-extrabold text-tb-blue inline-flex items-center gap-1 border border-blue-200 bg-blue-50/40"
                >
                  Watch Video <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-secondary/20 p-3 rounded-2xl border border-border/40 text-center">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Views</div>
                <div className="font-extrabold text-tb-navy text-base mt-1 tabular-nums">
                  {drawerSubmission.views > 0 ? drawerSubmission.views.toLocaleString("en-IN") : "—"}
                </div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-2xl border border-border/40 text-center">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Likes</div>
                <div className="font-extrabold text-tb-navy text-base mt-1 tabular-nums">
                  {drawerSubmission.likes > 0 ? drawerSubmission.likes.toLocaleString("en-IN") : "—"}
                </div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-2xl border border-border/40 text-center">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Comments</div>
                <div className="font-extrabold text-tb-navy text-base mt-1 tabular-nums">
                  {drawerSubmission.comments > 0 ? drawerSubmission.comments.toLocaleString("en-IN") : "—"}
                </div>
              </div>
            </div>

            {/* Rejection / Payout info */}
            {effectiveStatus(drawerSubmission) === "rejected" ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/50 p-4">
                <div className="font-bold text-red-900 text-sm flex items-center gap-1.5">
                  <XCircle className="size-4 text-red-600 animate-pulse" /> Revision Required
                </div>
                <p className="text-xs text-red-800 mt-1.5 leading-relaxed">
                  {drawerSubmission.rejectionReason || "Your video didn't meet our creators content guidelines."}
                </p>
                <Link 
                  to="/submit" 
                  onClick={() => setDrawerSubmission(null)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 transition-all py-3 rounded-xl shadow-md"
                >
                  Resubmit Entry <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-border bg-secondary/10 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider">UPI Payout Status</span>
                  <span className="font-black text-tb-navy">{paymentLabel(drawerSubmission)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider">UPI Address</span>
                  <span className="font-mono font-bold text-tb-navy truncate max-w-[200px]">{drawerSubmission.upi || "Not linked"}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider">Total Incentive</span>
                  <span className="font-black text-emerald-700 text-sm">₹{displayPayoutInr(drawerSubmission).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            {/* Vertical Pipeline for this video */}
            {effectiveStatus(drawerSubmission) !== "rejected" && (
              <div className="mt-6 border-t border-border/50 pt-5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Verification pipeline</div>
                
                {/* Mobile Vertical Stepper - optimized with translucent premium glass blocks and glows */}
                <div className="space-y-3 relative py-2">
                  {/* Connecting track line */}
                  <div className="absolute top-[12px] bottom-[12px] left-[11px] w-0.5 bg-border/60 z-0 rounded-full">
                    <div 
                      className="w-full bg-tb-blue z-0 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                      style={{ height: `${(order.indexOf(effectiveStatus(drawerSubmission)) / (timeline.length - 1)) * 100}%` }}
                    />
                  </div>
                  
                  {timeline.map((t, i) => {
                    const reached = i <= order.indexOf(effectiveStatus(drawerSubmission));
                    const current = i === order.indexOf(effectiveStatus(drawerSubmission));
                    return (
                      <div key={t.key} className="flex items-start gap-4 relative z-10 group">
                        {/* Step Indicator Pin */}
                        <div className={`size-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 shrink-0 transition-all duration-300 relative ${
                          reached ? "tb-gradient text-white border-tb-blue shadow-md shadow-blue-500/20 scale-105" :
                          current ? "border-tb-blue text-tb-blue bg-white animate-pulse" :
                          "border-border bg-white text-muted-foreground"
                        }`}>
                          {reached ? <CheckCircle2 className="size-3.5 text-white" /> : i + 1}
                          {current && (
                            <span className="absolute -inset-1 rounded-full border border-tb-blue animate-ping opacity-35" />
                          )}
                        </div>
                        
                        {/* Detailed Translucent Glass Card */}
                        <div className={`flex-1 min-w-0 rounded-xl p-3 border transition-all duration-300 ${
                          current ? "bg-blue-50/50 border-blue-200/80 shadow-md shadow-blue-500/5 translate-x-0.5" :
                          reached ? "bg-slate-50/40 border-slate-100" :
                          "bg-slate-50/20 border-slate-100/50 opacity-60"
                        }`}>
                          <div className={`text-xs font-extrabold leading-tight ${current ? "text-tb-blue" : reached ? "text-tb-navy" : "text-muted-foreground"}`}>
                            {t.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={() => setDrawerSubmission(null)}
              className="btn-ghost w-full mt-6 py-3 rounded-xl border border-border text-sm font-bold active:scale-95 transition-transform"
            >
              Close details
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ Icon, label, value, color }: { Icon: typeof Eye; label: string; value: string; color: 'blue' | 'rose' | 'violet' }) {
  const colorMeta = {
    blue: {
      border: 'border-blue-100/70 hover:border-blue-400/80',
      icon: 'text-blue-600',
      bg: 'bg-gradient-to-br from-blue-50/60 to-indigo-50/20',
      glow: 'hover:shadow-blue-500/10 hover:shadow-xl hover:scale-[1.03]'
    },
    rose: {
      border: 'border-rose-100/70 hover:border-rose-400/80',
      icon: 'text-rose-600',
      bg: 'bg-gradient-to-br from-rose-50/60 to-orange-50/20',
      glow: 'hover:shadow-rose-500/10 hover:shadow-xl hover:scale-[1.03]'
    },
    violet: {
      border: 'border-violet-100/70 hover:border-violet-400/80',
      icon: 'text-violet-600',
      bg: 'bg-gradient-to-br from-violet-50/60 to-fuchsia-50/20',
      glow: 'hover:shadow-violet-500/10 hover:shadow-xl hover:scale-[1.03]'
    }
  }[color];

  return (
    <div className={`rounded-2xl sm:rounded-3xl border p-2.5 xs:p-3.5 sm:p-5 bg-white shadow-sm transition-all duration-300 cursor-default relative overflow-hidden group ${colorMeta.border} ${colorMeta.bg} ${colorMeta.glow}`}>
      {/* Decorative backdrop glow */}
      <div className="absolute -right-6 -bottom-6 size-16 rounded-full bg-current opacity-5 blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-wider sm:tracking-widest mb-1 sm:mb-2">
        <div className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl ${color === 'blue' ? 'bg-blue-100/60' : color === 'rose' ? 'bg-rose-100/60' : 'bg-violet-100/60'} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`size-3 sm:size-4 ${colorMeta.icon}`} /> 
        </div>
        <span>{label}</span>
      </div>
      <div className="text-sm xs:text-base sm:text-2xl font-black text-tb-navy tracking-tight tabular-nums mt-0.5 sm:mt-1">{value}</div>
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
        className="h-10 w-auto mx-auto animate-pulse-soft"
      />
      <h1 className="mt-8 text-3xl font-extrabold text-tb-navy">Welcome to Creators Lab, {displayName}!</h1>
      <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
        You haven't sent us a video file yet. Create your first vertical review video on exam-prep journeys and earn up to <strong className="text-tb-navy">₹2,050 cumulative UPI payout</strong> starting at 5K views!
      </p>
      
      <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
        {[
          { n: "1", t: "Build a 30-60s video", d: "Record a vertical vertical video telling your true exam journey with Testbook Pass mock tests." },
          { n: "2", t: "Upload final file here", d: "You do not need to publish it yourself. Our review team verifies and uploads approved content." },
          { n: "3", t: "Collect UPI cash", d: "As views accumulate on Testbook channels, payout incentives hit your linked UPI account automatically." },
        ].map(({ n, t, d }) => (
          <div key={n} className="card p-5 bg-white shadow-sm border-border/80 flex flex-col justify-between">
            <div>
              <div className="size-8 rounded-xl tb-gradient text-white text-sm font-black flex items-center justify-center shadow-md">{n}</div>
              <div className="mt-4 text-sm font-extrabold text-tb-navy leading-snug">{t}</div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>
      
      <Link to="/submit" className="btn-orange mt-10 text-base px-8 py-3.5 shadow-lg shadow-orange-500/20 hover:scale-102 active:scale-98 transition-transform">
        Send your first video <ArrowRight className="size-4 animate-bounce" style={{ animationDuration: '3s' }} />
      </Link>
    </section>
  );
}
