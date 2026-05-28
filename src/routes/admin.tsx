import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Filter, Play, CheckCircle2, X, Eye, IndianRupee,
  Megaphone, Clock, AlertTriangle, ChevronDown, Video,
  MessageSquare, BarChart3, Users, TrendingUp
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Review — Creator's Lab by Testbook" },
      { name: "description", content: "Review and manage creator video submissions." },
    ],
  }),
  component: AdminPage,
});

type Status = "pending" | "approved" | "rejected" | "published" | "paid";

interface Submission {
  id: string;
  creatorName: string;
  phone: string;
  upi: string;
  videoTitle: string;
  submittedAt: string;
  status: Status;
  reward: number;
  paymentStatus: "unpaid" | "paid" | "processing";
  reviewComment?: string;
  views?: number;
}

const mockSubmissions: Submission[] = [
  { id: "SUB001", creatorName: "Priya Sharma", phone: "98765 43210", upi: "priya@upi", videoTitle: "Testbook Pass Changed My UPSC Prep", submittedAt: "2026-05-27", status: "pending", reward: 50, paymentStatus: "unpaid" },
  { id: "SUB002", creatorName: "Rahul Verma", phone: "87654 32109", upi: "rahul@oksbi", videoTitle: "How I Cracked SSC CGL with Testbook", submittedAt: "2026-05-26", status: "approved", reward: 50, paymentStatus: "unpaid", views: 4200 },
  { id: "SUB003", creatorName: "Anjali Singh", phone: "76543 21098", upi: "anjali@ybl", videoTitle: "Best App for UP Police Preparation", submittedAt: "2026-05-25", status: "published", reward: 50, paymentStatus: "processing", views: 18900 },
  { id: "SUB004", creatorName: "Mohit Gupta", phone: "65432 10987", upi: "mohit@paytm", videoTitle: "Testbook Pass Review Honest Opinion", submittedAt: "2026-05-25", status: "paid", reward: 50, paymentStatus: "paid", views: 32100 },
  { id: "SUB005", creatorName: "Deepa Nair", phone: "54321 09876", upi: "deepa@upi", videoTitle: "Why I Recommend Testbook to All Students", submittedAt: "2026-05-24", status: "rejected", reward: 0, paymentStatus: "unpaid", reviewComment: "Video duration is under 30 seconds. Please re-record with a 30–60s version." },
  { id: "SUB006", creatorName: "Saurabh Yadav", phone: "43210 98765", upi: "saurabh@upi", videoTitle: "Testbook Pass Mock Tests Are Incredible", submittedAt: "2026-05-24", status: "pending", reward: 50, paymentStatus: "unpaid" },
  { id: "SUB007", creatorName: "Kavya Menon", phone: "32109 87654", upi: "kavya@oksbi", videoTitle: "Top Reason to Choose Testbook for NEET", submittedAt: "2026-05-23", status: "published", reward: 50, paymentStatus: "paid", views: 55400 },
  { id: "SUB008", creatorName: "Arjun Patel", phone: "21098 76543", upi: "arjun@ybl", videoTitle: "My Journey from Fail to Pass with Testbook", submittedAt: "2026-05-22", status: "approved", reward: 50, paymentStatus: "unpaid", views: 2800 },
];

const statusConfig: Record<Status, { label: string; className: string; Icon: React.ElementType }> = {
  pending: { label: "Pending Review", className: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  approved: { label: "Approved", className: "bg-blue-50 text-blue-700 border-blue-200", Icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", Icon: X },
  published: { label: "Published", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Megaphone },
  paid: { label: "Paid", className: "bg-green-50 text-green-700 border-green-200", Icon: IndianRupee },
};

const filterOptions: { label: string; value: Status | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Published", value: "published" },
  { label: "Paid", value: "paid" },
];

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.className}`}>
      <cfg.Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

const statsCards = [
  { label: "Total Submissions", value: "8", Icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Pending Review", value: "2", Icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Approved / Published", value: "4", Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Unpaid Rewards", value: "₹150", Icon: IndianRupee, color: "text-orange-600", bg: "bg-orange-50" },
];

function AdminPage() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [comment, setComment] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions);

  const filtered = submissions.filter((s) => {
    const matchStatus = filter === "all" || s.status === filter;
    const matchSearch = s.creatorName.toLowerCase().includes(search.toLowerCase()) || s.videoTitle.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  function updateStatus(id: string, status: Status) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status, ...(comment ? { reviewComment: comment } : {}), ...(status === "paid" ? { paymentStatus: "paid" as const } : status === "published" ? { paymentStatus: "processing" as const } : {}) }
          : s
      )
    );
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, status } : null);
    }
    setComment("");
  }

  function markPaid(id: string) {
    setSubmissions((prev) =>
      prev.map((s) => s.id === id ? { ...s, paymentStatus: "paid", status: "paid" } : s)
    );
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, paymentStatus: "paid", status: "paid" } : null);
    }
  }

  const pendingPayouts = submissions.filter((s) => s.status === "published" && s.paymentStatus !== "paid").length;

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* Top bar */}
      <div className="bg-white border-b border-border/80 sticky top-[52px] sm:top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-xl bg-gradient-to-br from-[#0b1437] to-[#1e3a8a] flex items-center justify-center">
              <BarChart3 className="size-4 text-white" />
            </span>
            <div>
              <div className="text-sm font-black text-[#08163f] leading-none">Admin Review</div>
              <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">Creator's Lab by Testbook</div>
            </div>
          </div>
          {pendingPayouts > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
              <AlertTriangle className="size-3" />
              {pendingPayouts} pending UPI payout{pendingPayouts > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statsCards.map((s) => (
            <div key={s.label} className="card bg-white p-4 flex items-center gap-3">
              <div className={`size-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.Icon className={`size-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-lg font-black text-[#08163f] leading-none">{s.value}</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left panel — list */}
          <div className="flex-1 min-w-0">
            {/* Filter + search */}
            <div className="card bg-white p-3 mb-3 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  className="w-full rounded-xl border border-border/80 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                  placeholder="Search by creator or video title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {filterOptions.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                      filter === f.value
                        ? "bg-[#0b1437] text-white border-[#0b1437]"
                        : "border-border/80 text-muted-foreground hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="card bg-white overflow-hidden">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Filter className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No submissions match your filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-slate-50/80">
                        <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Creator</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Video Title</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                        <th className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((sub) => (
                        <tr
                          key={sub.id}
                          onClick={() => setSelected(sub)}
                          className={`border-b border-border/40 last:border-0 hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.id === sub.id ? "bg-blue-50/60" : ""}`}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="size-8 rounded-full bg-gradient-to-br from-[#0b1437] to-[#1e3a8a] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                                {sub.creatorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </span>
                              <div>
                                <div className="font-bold text-[#08163f] text-xs sm:text-sm leading-none">{sub.creatorName}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{sub.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <span className="text-xs text-[#08163f] font-semibold line-clamp-1 max-w-[180px]">{sub.videoTitle}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">{sub.submittedAt}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={sub.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelected(sub); }}
                              className="inline-flex items-center gap-1 rounded-xl border border-border/60 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:border-blue-200 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="size-3" /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right panel — detail */}
          <div className="w-full lg:w-[380px] shrink-0">
            {selected ? (
              <div className="card bg-white p-5 space-y-4 sticky top-[116px] sm:top-[132px]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-[#08163f] leading-none">{selected.creatorName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{selected.phone} · {selected.upi}</div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Video preview placeholder */}
                <div className="relative aspect-[9/16] w-full max-w-[160px] mx-auto rounded-2xl bg-slate-950 overflow-hidden shadow-lg border-4 border-slate-800">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="size-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                      <Play className="size-5 text-white fill-white ml-0.5" />
                    </div>
                    <span className="text-[10px] text-white/60 font-semibold leading-tight">{selected.videoTitle}</span>
                  </div>
                  <span className="absolute top-2 left-2 text-[8px] font-black bg-blue-600/90 text-white px-2 py-0.5 rounded-full">9:16</span>
                </div>

                <div className="text-xs font-bold text-[#08163f] leading-snug">{selected.videoTitle}</div>
                <div className="text-[11px] text-muted-foreground">Submitted: {selected.submittedAt}</div>

                {selected.views && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <TrendingUp className="size-3.5" />
                    {selected.views.toLocaleString()} views
                  </div>
                )}

                {selected.reviewComment && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 font-semibold leading-relaxed">
                    <MessageSquare className="size-3.5 inline mr-1.5 opacity-70" />
                    {selected.reviewComment}
                  </div>
                )}

                {/* Comment input */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">Review Comment</label>
                  <textarea
                    className="w-full rounded-xl border border-border/80 bg-slate-50 p-2.5 text-xs resize-none outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                    rows={2}
                    placeholder="Optional reason or note..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {selected.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(selected.id, "approved")}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="size-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(selected.id, "rejected")}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2.5 text-xs font-black text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="size-3.5" /> Reject
                      </button>
                    </>
                  )}
                  {selected.status === "approved" && (
                    <button
                      onClick={() => updateStatus(selected.id, "published")}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition-colors"
                    >
                      <Megaphone className="size-3.5" /> Mark as Published
                    </button>
                  )}
                  {(selected.status === "published" || selected.status === "approved") && selected.paymentStatus !== "paid" && (
                    <button
                      onClick={() => markPaid(selected.id)}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-black text-white hover:bg-green-700 transition-colors"
                    >
                      <IndianRupee className="size-3.5" /> Mark ₹50 as Paid
                    </button>
                  )}
                  {selected.status === "paid" && (
                    <div className="col-span-2 rounded-xl bg-green-50 border border-green-100 p-2.5 text-center text-xs font-bold text-green-700">
                      <CheckCircle2 className="size-3.5 inline mr-1" /> ₹50 paid to {selected.upi}
                    </div>
                  )}
                  {selected.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(selected.id, "pending")}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-border/80 px-3 py-2.5 text-xs font-bold text-muted-foreground hover:border-blue-200 hover:text-blue-600 transition-colors"
                    >
                      Move back to Pending
                    </button>
                  )}
                </div>

                {/* UPI payout info */}
                <div className="rounded-xl bg-[#0b1437] p-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1">UPI Payout</div>
                  <div className="text-sm font-black text-white">{selected.upi}</div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    {selected.paymentStatus === "paid"
                      ? "Payment sent"
                      : selected.paymentStatus === "processing"
                      ? "Processing..."
                      : "Not yet paid"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-white p-8 text-center">
                <Eye className="size-10 text-muted-foreground/25 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Select a submission to review it here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
