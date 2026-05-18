import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, Clock, Eye, Heart, MessageCircle, IndianRupee,
  Wallet, Send, FileText, Sparkles, AlertCircle, PartyPopper,
  ShieldCheck, XCircle, ExternalLink, RefreshCw,
} from "lucide-react";
import { getSubmission, getSubmissions, getUser, saveSubmission, type TBSubmission, type SubmissionStatus } from "@/lib/auth";
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

const FIRST_PAYOUT_VIEWS = milestones[0]?.v ?? 10000;

function earnedPayoutInr(views: number): number {
  return milestones
    .filter((milestone) => views >= milestone.v)
    .reduce((total, milestone) => total + milestone.pay, 0);
}

const timeline: { key: SubmissionStatus; label: string; desc: string }[] = [
  { key: "submitted",         label: "Submitted",        desc: "Video received" },
  { key: "under_review",      label: "Under review",     desc: "Team is verifying" },
  { key: "approved",          label: "Approved",         desc: "Cleared for tracking" },
  { key: "live",              label: "Tracking live",    desc: "Views being counted" },
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

function isQueuedPayoutStatus(value?: string): boolean {
  return ["initiated", "processing", "queued", "pending"].includes(normalizedPayoutStatus(value));
}

function effectiveStatus(submission: Pick<TBSubmission, "status" | "views" | "payoutEligibility" | "payoutStatus">): SubmissionStatus {
  if (submission.status === "rejected") return "rejected";
  if (submission.status === "paid" || isPaidPayoutStatus(submission.payoutStatus)) return "paid";
  if (
    submission.status === "milestone_reached" ||
    isEligible(submission.payoutEligibility) ||
    isQueuedPayoutStatus(submission.payoutStatus) ||
    ((submission.status === "approved" || submission.status === "live") && submission.views >= FIRST_PAYOUT_VIEWS)
  ) {
    return "milestone_reached";
  }
  if (submission.status === "live" || (submission.status === "approved" && submission.views > 0)) return "live";
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

function DashboardPage() {
  const [submission, setSubmission] = useState<TBSubmission | null>(null);
  const [submissions, setSubmissions] = useState<TBSubmission[]>([]);
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setPhone(u.phone);
      setUserId(u.userId ?? u.phone);
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
    return <EmptyState phone={phone} />;
  }

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

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 md:py-14 space-y-6">
      <div className="fade-up flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge text-xs"><Sparkles className="size-3.5" /> Welcome back · +91 {phone}</span>
            {syncing && <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1"><RefreshCw className="size-3 animate-spin" /> Syncing…</span>}
            {syncError && !syncing && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="size-3" /> {syncError}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Your submission</h1>
          <p className="mt-2 text-base text-muted-foreground">Live status, view milestones and payout — all in one place.</p>
        </div>
        <Link
          to="/submit"
          className="btn-orange inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm sm:w-auto md:mt-1"
        >
          <Send className="size-4" />
          Submit another video
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Rejection reason banner */}
      {isRejected && submission.rejectionReason && (
        <div className="card p-5 !border-red-200 bg-red-50/50 flex items-start gap-3 fade-up">
          <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-800">Reason for rejection</div>
            <div className="text-sm text-red-700 mt-1 leading-relaxed">{submission.rejectionReason}</div>
            <Link to="/submit" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors px-3 py-1.5 rounded-lg">
              Resubmit video <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Payment eligibility banner */}
      {isPaymentEligible && !isRejected && displayStatus !== "paid" && (
        <div className="card p-4 !border-emerald-200 bg-emerald-50/40 flex items-center gap-3 fade-up">
          <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-emerald-800">Payment eligible</div>
            <div className="text-sm text-emerald-700/80 mt-0.5">Your submission has been approved for UPI payout. Transfer will be initiated within 48 hours.</div>
          </div>
          {earnedAmount > 0 && (
            <div className="text-right shrink-0">
              <div className="text-xs text-emerald-700 font-medium">Amount</div>
              <div className="text-lg font-black text-emerald-800">₹{earnedAmount.toLocaleString("en-IN")}</div>
            </div>
          )}
        </div>
      )}

      {/* Status banner */}
      <div className={`card p-5 flex flex-wrap items-center gap-4 ${isRejected ? "!border-red-200 bg-red-50/40" : ""}`}>
        <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
          isRejected ? "bg-red-100 text-red-700" :
          displayStatus === "paid" ? "bg-emerald-100 text-emerald-700" :
          "tb-gradient text-white"
        }`}>
          {isRejected ? <AlertCircle className="size-6" /> :
           displayStatus === "paid" ? <PartyPopper className="size-6" /> :
           <Clock className="size-6" />}
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current status</div>
          <div className="text-xl font-bold text-tb-navy capitalize mt-0.5">{displayStatus.replace(/_/g, " ")}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Video approved badge */}
          {(displayStatus === "approved" || displayStatus === "live" || displayStatus === "milestone_reached" || displayStatus === "paid") && (
            <span className="badge badge-green text-xs">
              <CheckCircle2 className="size-3" /> Video approved
            </span>
          )}
          {/* Payment eligible badge */}
          {isPaymentEligible && (
            <span className="badge badge-green text-xs">
              <ShieldCheck className="size-3" /> Payment eligible
            </span>
          )}
          {submission.videoUrl && (
            <a href={submission.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost text-sm">View post ↗</a>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!isRejected && (
        <div className="card p-6">
          <div className="text-base font-bold text-tb-navy mb-4">Submission timeline</div>
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {timeline.map((t, i) => {
              const reached = i <= stage;
              const current = i === stage;
              return (
                <li key={t.key} className={`relative rounded-xl p-4 border transition ${
                  reached ? "border-tb-blue/40 bg-blue-50/50" : "border-border bg-white"
                } ${current ? "ring-2 ring-tb-blue/40 shadow-sm" : ""}`}>
                  <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    reached ? "tb-gradient text-white" : "bg-secondary text-muted-foreground"
                  }`}>
                    {reached ? <CheckCircle2 className="size-4" /> : i + 1}
                  </div>
                  <div className={`mt-2.5 text-sm font-bold ${reached ? "text-tb-navy" : "text-muted-foreground"}`}>{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.desc}</div>
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
              <div className="text-sm text-muted-foreground font-medium">Total views</div>
              <div className="text-4xl font-black text-tb-navy mt-0.5">{submission.views.toLocaleString("en-IN")}</div>
            </div>
            {nextMilestone ? (
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-medium">Next payout at</div>
                <div className="text-sm font-bold text-tb-blue mt-0.5">{nextMilestone.label} views</div>
                <div className="text-base font-black text-tb-orange">₹{nextMilestone.pay.toLocaleString("en-IN")}</div>
              </div>
            ) : (
              <div className="badge badge-green text-sm px-3 py-1.5">Max tier reached 🎉</div>
            )}
          </div>
          <div className="mt-5 h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full tb-gradient relative shimmer rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground font-medium">
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
            <div className="flex items-center gap-2 flex-wrap">
              <div className="badge bg-white/15 text-white border-white/20"><Wallet className="size-3.5" /> Payout</div>
              {isPaymentEligible && (
                <div className="badge bg-emerald-400/20 text-emerald-200 border-emerald-400/30 text-xs">
                  <CheckCircle2 className="size-3" /> Eligible
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-white/70">{displayStatus === "paid" ? "Sent to" : "Will be sent to"}</div>
            <div className="font-semibold truncate">{submission.upi || "Not added"}</div>
            <div className="mt-5 text-4xl font-bold tb-text-gradient flex items-center gap-1">
              <IndianRupee className="size-7" />{earnedAmount.toLocaleString("en-IN")}
            </div>
            <div className="mt-1 text-xs text-white/70">
              {displayStatus === "paid"              ? "Transferred via UPI" :
               displayStatus === "milestone_reached" ? "Queued for transfer (within 48h)" :
               isPaymentEligible                         ? "Transfer initiated — within 48h" :
               "Cross a milestone to unlock"}
            </div>
          </div>
        </div>
      </div>

      <UploadedVideos submissions={submissions} />

      {/* Quick actions */}
      <div className="card p-6">
        <div className="text-base font-bold text-tb-navy mb-4">Quick actions</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/submit" className="flex items-start gap-3.5 p-4 rounded-xl border border-border hover:border-tb-blue hover:bg-blue-50/40 transition-all">
            <div className="size-10 rounded-xl bg-blue-100 text-tb-blue flex items-center justify-center shrink-0"><Send className="size-5" /></div>
            <div>
              <div className="text-sm font-bold text-tb-navy">Submit another video</div>
              <div className="text-sm text-muted-foreground mt-0.5">More videos = more payouts</div>
            </div>
          </Link>
          <Link to="/sop" className="flex items-start gap-3.5 p-4 rounded-xl border border-border hover:border-tb-blue hover:bg-blue-50/40 transition-all">
            <div className="size-10 rounded-xl bg-blue-100 text-tb-blue flex items-center justify-center shrink-0"><FileText className="size-5" /></div>
            <div>
              <div className="text-sm font-bold text-tb-navy">Re-read Creator SOP</div>
              <div className="text-sm text-muted-foreground mt-0.5">Boost your approval rate</div>
            </div>
          </Link>
          <a href="mailto:creators@testbook.com" className="flex items-start gap-3.5 p-4 rounded-xl border border-border hover:border-tb-blue hover:bg-blue-50/40 transition-all">
            <div className="size-10 rounded-xl bg-blue-100 text-tb-blue flex items-center justify-center shrink-0"><ArrowRight className="size-5" /></div>
            <div>
              <div className="text-sm font-bold text-tb-navy">Contact support</div>
              <div className="text-sm text-muted-foreground mt-0.5">creators@testbook.com</div>
            </div>
          </a>
        </div>
      </div>

    </section>
  );
}

function UploadedVideos({ submissions }: { submissions: TBSubmission[] }) {
  if (submissions.length === 0) return null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-base font-bold text-tb-navy">Uploaded videos</div>
          <div className="text-sm text-muted-foreground mt-0.5">Previous submissions, review status and payout state.</div>
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

function EmptyState({ phone }: { phone: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center fade-up">
      <img
        src="https://cdn.testbook.com/1755173671769-testbook-logo.png/1755173673.png"
        alt="Testbook"
        className="h-10 w-auto mx-auto"
      />
      <h1 className="mt-6 text-3xl font-bold text-tb-navy">Welcome, +91 {phone}!</h1>
      <p className="mt-3 text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
        You haven't submitted a video yet. Record your first reel — payouts start at <strong className="text-tb-navy">10,000 views (₹500)</strong>.
      </p>
      <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto">
        {[
          { n: "1", t: "Record a reel", d: "30–60 second vertical video on your exam prep journey" },
          { n: "2", t: "Upload your video", d: "Upload the video file and add your caption" },
          { n: "3", t: "Get paid via UPI", d: "Every view milestone you cross triggers a UPI transfer" },
        ].map(({ n, t, d }) => (
          <div key={n} className="card p-5">
            <div className="size-8 rounded-full tb-gradient text-white text-sm font-bold flex items-center justify-center">{n}</div>
            <div className="mt-3 text-sm font-bold text-tb-navy">{t}</div>
            <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{d}</div>
          </div>
        ))}
      </div>
      <Link to="/submit" className="btn-orange mt-8 inline-flex text-base px-8 py-3.5">Submit your first video <ArrowRight className="size-4" /></Link>
    </section>
  );
}
