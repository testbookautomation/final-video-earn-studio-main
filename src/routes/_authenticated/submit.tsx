import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Wallet, CheckCircle2, AlertCircle, Loader2,
  Instagram, Youtube, ExternalLink, Upload,
  X, Film, Users, Star, ScrollText, ChevronRight,
  CloudUpload, Send, RefreshCw,
} from "lucide-react";
import { getOrCreateUserSession, getUser, saveSubmission, setUser, type TBSubmission } from "@/lib/auth";
import { track } from "@/lib/analytics";
import {
  ACCEPTED_VIDEO_EXTENSIONS,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_LABEL,
  isAcceptedVideoFile,
} from "@/lib/upload-limits";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Send Video - Testbook Creator Lab" },
      { name: "description", content: "Upload your Testbook Pass video to Testbook for review, publishing, and UPI payout tracking." },
      { property: "og:title", content: "Send Video - Testbook Creator Lab" },
      { property: "og:url", content: "/submit" },
    ],
  }),
  component: SubmitPage,
});

const platforms = [
  { id: "instagram", label: "Instagram audience", Icon: Instagram, followerLabel: "Instagram followers" },
  { id: "youtube",   label: "YouTube audience",   Icon: Youtube,   followerLabel: "YouTube subscribers" },
] as const;

const payoutRules = [
  { views: "10,000", amount: "₹500" },
  { views: "50,000", amount: "₹2,500" },
  { views: "1 Lakh", amount: "₹6,000" },
  { views: "5 Lakh", amount: "₹15,000" },
  { views: "10 Lakh", amount: "₹25,000" },
];

const TESTBOOK_REFERRALS_URL = "https://testbook.com/referrals";

const uploadFacts = [
  {
    title: "Testbook Pass is built for exam prep",
    body: "It brings mock tests, PYQs, live classes, notes, and practice into one learning flow.",
  },
  {
    title: "Your first 3 seconds matter",
    body: "Start with a real student problem, then show how Testbook Pass helped you solve it.",
  },
  {
    title: "You create, Testbook publishes",
    body: "Upload the final file here. Our team reviews it and publishes approved videos from Testbook channels.",
  },
  {
    title: "Views unlock payout milestones",
    body: "Once a Testbook-published video crosses eligible milestones, payout is processed to your linked UPI.",
  },
];

const howToSteps = [
  {
    title: "Create a final 30-60s video",
    body: "Use vertical 9:16 format, clear voice, good light, and no editing watermarks.",
  },
  {
    title: "Show Testbook Pass clearly",
    body: "Screen-record or show useful parts like mock tests, PYQs, live classes, notes, or practice.",
  },
  {
    title: "Tell your real exam story",
    body: "Mention your exam, one specific feature you use, and why it helps your preparation.",
  },
  {
    title: "Give the video to Testbook",
    body: "Upload the final file here. You do not need to publish it yourself or write the final caption.",
  },
];

const howToDonts = [
  "No copyrighted music or clips",
  "No fake rank, selection, or result claims",
  "No competitor app or coaching logo visible",
];

type UpiState = { loading: boolean; upi: string | null; error: string | null };
type UploadResponse = { ok: boolean; cdnUrl?: string; filename?: string; error?: string };

// Two-stage submit pipeline stages
type SubmitStage =
  | "idle"
  | "uploading_to_cdn"   // Step 1 — sending video to LMS CDN
  | "creating_submission"// Step 2 — saving submission + forwarding to Apps Script
  | "done"               // All complete
  | "error";             // Something failed

const STAGE_LABELS: Record<SubmitStage, string> = {
  idle:                 "",
  uploading_to_cdn:     "Uploading your video…",
  creating_submission:  "Sending your entry…",
  done:                 "Sent successfully!",
  error:                "Something went wrong",
};

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " GB";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " MB";
  return (n / 1024).toFixed(0) + " KB";
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function errorToMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function uploadVideoToLms(
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/api/upload-lms");
    xhr.upload.onloadstart = () => onProgress(2);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(95, (event.loaded / event.total) * 95));
    };
    xhr.upload.onload = () => onProgress(95);
    xhr.onerror = () => reject(new Error("Network interrupted while uploading the video. Please try again."));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}") as UploadResponse;
        onProgress(data.ok ? 100 : 0);
        resolve(data);
      } catch {
        reject(new Error(`Upload failed (HTTP ${xhr.status}). Please try again.`));
      }
    };

    xhr.send(formData);
  });
}

function SubmitPage() {
  const navigate = useNavigate();
  const [phone, setPhone]           = useState("");
  const [userId, setUserId]         = useState("");
  const [upiState, setUpiState]     = useState<UpiState>({ loading: true, upi: null, error: null });
  const [form, setForm]             = useState({
    fullName: "", email: "", upi: "",
    examCategory: "",
    platform: "instagram" as TBSubmission["platform"],
    followers: "",
    videoMode: "upload" as const,
    videoUrl: "",
    caption: "",
    consent: false,
  });
  const [videoFile, setVideoFile]       = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [stage, setStage]               = useState<SubmitStage>("idle");
  const [errorMsg, setErrorMsg]         = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [factIndex, setFactIndex]       = useState(0);
  const [cdnUrl, setCdnUrl]             = useState<string | null>(null); // persisted after Step 1
  const [howToModal, setHowToModal]     = useState(false);
  const [termsModal, setTermsModal]     = useState(false);
  const [termsRead, setTermsRead]       = useState(false);
  const fileRef      = useRef<HTMLInputElement>(null);
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const isBusy = stage === "uploading_to_cdn" || stage === "creating_submission";

  useEffect(() => {
    if (!isBusy) return;

    const timer = window.setInterval(() => {
      setFactIndex((i) => (i + 1) % uploadFacts.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isBusy]);

  useEffect(() => {
    const u = getUser();
    if (!u) return;
    setPhone(u.phone);
    const uid = u.userId ?? u.phone;
    setUserId(uid);
    fetch(`/api/fetch-upi?phone=${encodeURIComponent(u.phone)}&userId=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((d: { upi?: string | null; name?: string | null; studentId?: string | null }) => {
        const name = d.name?.trim();
        setForm((f) => ({
          ...f,
          ...(d.upi ? { upi: d.upi } : {}),
          ...(name && !f.fullName ? { fullName: name } : {}),
        }));
        if (name) setUser({ ...u, name, userId: u.userId || d.studentId || uid });
        setUpiState({ loading: false, upi: d.upi ?? null, error: null });
      })
      .catch(() => setUpiState({ loading: false, upi: null, error: null }));
  }, []);

  useEffect(() => {
    return () => { if (videoPreview) URL.revokeObjectURL(videoPreview); };
  }, [videoPreview]);

  const pickFile = (file: File) => {
    if (!isAcceptedVideoFile(file)) {
      setErrorMsg(`Please choose a video file in ${ACCEPTED_VIDEO_EXTENSIONS} format.`);
      return;
    }
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      setErrorMsg(`Video is too large. Maximum upload size is ${MAX_VIDEO_UPLOAD_LABEL}.`);
      return;
    }
    setErrorMsg("");
    setVideoFile(file);
    setCdnUrl(null); // reset CDN URL if a new file is picked
    setUploadProgress(0);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(URL.createObjectURL(file));
    track("UGC_creators_video_file_selected", { page: "/submit", payload: { fileName: file.name, fileSizeMb: +(file.size / 1e6).toFixed(2) } });
  };

  const removeFile = () => {
    setVideoFile(null);
    setCdnUrl(null);
    setUploadProgress(0);
    if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  };

  const isUpi = (s: string) => /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9._-]{2,}$/.test(s.trim());
  const currentPlatform = platforms.find((p) => p.id === form.platform)!;

  const validationItems = [
    { ok: form.fullName.trim().length >= 2, message: "Enter your full name." },
    { ok: /\S+@\S+\.\S+/.test(form.email), message: "Enter a valid email address." },
    { ok: isUpi(form.upi), message: "Login at testbook.com/referrals and update your UPI ID." },
    { ok: form.followers.trim() !== "", message: `Enter your ${currentPlatform.followerLabel.toLowerCase()}.` },
    { ok: !!videoFile, message: "Choose a video file." },
    { ok: form.consent, message: "Confirm the content consent checkbox." },
    { ok: termsRead, message: "Agree to the Terms & Conditions checkbox." },
  ];

  const missingItems = validationItems.filter((item) => !item.ok);
  const valid = missingItems.length === 0;

  /* ── Two-stage submit pipeline ──────────────────────────── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || isBusy) return;

    setErrorMsg("");
    track("UGC_creators_submission_submit_clicked", { page: "/submit", platform: form.platform });
    const submissionId = "tb_" + Math.random().toString(36).slice(2, 10);
    const sessionId = getOrCreateUserSession()?.id ?? "";

    /* ── Stage 1: Upload video to LMS CDN ─────────────────── */
    let resolvedCdnUrl = cdnUrl; // reuse if already uploaded (retry scenario)

    if (!resolvedCdnUrl) {
      setStage("uploading_to_cdn");
      setUploadProgress(0);

      const fd = new FormData();
      fd.append("file",          videoFile!);
      fd.append("submissionId",  submissionId);
      fd.append("creatorPhone",  phone);
      fd.append("creatorUserId", userId);
      fd.append("sessionId",     sessionId);
      fd.append("platform",      form.platform);

      try {
        const data = await uploadVideoToLms(fd, setUploadProgress);

        if (!data.ok || !data.cdnUrl) {
          throw new Error(data.error ?? "Video upload failed. Please try again.");
        }

        resolvedCdnUrl = data.cdnUrl;
        setCdnUrl(resolvedCdnUrl); // persist so retry skips re-upload
      } catch (err) {
        setStage("error");
        setErrorMsg(errorToMessage(err));
        return;
      }
    } else {
      setUploadProgress(100);
    }

    /* ── Stage 2: Save submission + forward to Apps Script ── */
    setStage("creating_submission");
    setUploadProgress(100);

    let submission: TBSubmission = {
      id: submissionId,
      ...form,
      videoFileName: videoFile?.name,
      videoFileSize: videoFile?.size,
      videoUrl:      resolvedCdnUrl,
      cdnUrl:        resolvedCdnUrl,
      phone,
      status:        "submitted",
      views: 0, likes: 0, comments: 0, payoutInr: 0,
      createdAt: Date.now(),
      history: [{ status: "submitted", at: Date.now() }],
    };

    try {
      const res = await fetch("/api/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...submission, userId, sessionId, videoFile: undefined }),
      });
      const data = await res.json().catch(() => ({})) as { appsScriptId?: string | null };
      if (data.appsScriptId) {
        submission = { ...submission, id: data.appsScriptId };
      }
    } catch { /* non-blocking — submission is saved locally regardless */ }

    saveSubmission(submission);
    setStage("done");
    setTimeout(() => navigate({ to: "/dashboard" }), 1600);
  };

  const progressPct = clampProgress(cdnUrl || stage === "creating_submission" ? 100 : uploadProgress);
  const currentFact = uploadFacts[factIndex % uploadFacts.length];

  /* ── Success screen ─────────────────────────────────────── */
  if (stage === "done") {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="card p-10 max-w-md w-full text-center fade-up">
          <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-tb-navy">Video sent to Testbook!</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your video has been uploaded to Testbook. Our team will review it and publish it if approved.
            Redirecting to your dashboard…
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {["Review in 24h", "Testbook publishes", "UPI payout on milestone"].map((s) => (
              <div key={s} className="card p-3">
                <CheckCircle2 className="size-4 text-emerald-500 mx-auto mb-2" />
                <div className="text-xs font-medium text-tb-navy">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ── Main form ──────────────────────────────────────────── */
  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-14 space-y-6">

      {/* Header */}
      <div className="fade-up">
        <span className="badge text-xs"><Star className="size-3.5" /> New submission</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Send your video to Testbook</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Upload your finished video file. Testbook will review and publish approved videos.
        </p>
      </div>

      {isBusy && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-[#060d1f]/80 backdrop-blur-md" aria-hidden="true" />

          {/* Centered modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5 fade-up" role="status" aria-live="polite">
            <div className="w-full max-w-xs rounded-[2rem] overflow-hidden"
              style={{ background: "linear-gradient(160deg,#0f1f4a 0%,#112060 60%,#0d1a3e 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,155,255,0.1)" }}>

              {/* Top glow strip */}
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(99,155,255,0.6),transparent)" }} />

              {/* Main content */}
              <div className="px-7 pt-8 pb-6 flex flex-col items-center">

                {/* Circular progress ring */}
                <div className="relative" style={{ width: 156, height: 156 }}>
                  <svg width="156" height="156" viewBox="0 0 156 156" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    {/* Track */}
                    <circle cx="78" cy="78" r="66" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    {/* Progress */}
                    <circle
                      cx="78" cy="78" r="66"
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      strokeDasharray={`${2 * Math.PI * 66}`}
                      strokeDashoffset={`${2 * Math.PI * 66 * (1 - progressPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                  </svg>

                  {/* Center: logo + percent */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <img
                      src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
                      alt="Testbook"
                      className="h-6 w-auto opacity-90"
                    />
                    <span className={`text-3xl font-black tabular-nums leading-none ${progressPct === 100 ? "text-emerald-400" : "text-white"}`}>
                      {progressPct}%
                    </span>
                    {progressPct === 100 && (
                      <CheckCircle2 className="size-4 text-emerald-400 mt-0.5" />
                    )}
                  </div>
                </div>

                {/* Title + animated bars */}
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-base font-black text-white tracking-tight">
                    {progressPct === 100 ? "Upload Complete!" : "Uploading to Testbook"}
                  </span>
                  {progressPct < 100 && (
                    <span className="flex gap-0.5 items-end" style={{ height: 14 }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-0.5 rounded-full bg-blue-400 animate-bounce"
                          style={{ height: `${7 + i * 3}px`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  )}
                </div>

                {/* Status text */}
                <p className={`mt-1 text-xs font-medium ${progressPct === 100 ? "text-emerald-400" : "text-white/40"}`}>
                  {progressPct < 30 && "Preparing your video…"}
                  {progressPct >= 30 && progressPct < 70 && "Transferring to Testbook servers…"}
                  {progressPct >= 70 && progressPct < 100 && "Almost there — finalising…"}
                  {progressPct === 100 && "Your video is in — we'll review it shortly."}
                </p>

                {/* Flat linear bar (secondary) */}
                <div className="mt-5 w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progressPct}%`, background: progressPct === 100 ? "#34d399" : "linear-gradient(90deg,#60a5fa,#818cf8)" }}
                  >
                    <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer-sweep_1.6s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Fact card */}
              <div className="mx-4 my-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="size-3 fill-blue-400 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Testbook Pass Fact</span>
                </div>
                <div className="text-sm font-bold text-white/90 leading-snug">{currentFact.title}</div>
                <p className="mt-1 text-xs text-white/45 leading-relaxed">{currentFact.body}</p>
              </div>

              {/* Bottom glow */}
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(99,155,255,0.3),transparent)" }} />
            </div>
          </div>
        </>
      )}

      {/* UPI banner */}
      <div className={`card p-4 flex items-start gap-3 fade-up ${
        upiState.loading ? "" : upiState.upi
          ? "!border-emerald-200 bg-emerald-50/40"
          : "!border-amber-200 bg-amber-50/50"
      }`}>
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
          upiState.loading ? "bg-secondary"
          : upiState.upi   ? "bg-emerald-100 text-emerald-700"
                           : "bg-amber-100 text-amber-700"
        }`}>
          {upiState.loading
            ? <Loader2 className="size-5 animate-spin" />
            : upiState.upi
              ? <CheckCircle2 className="size-5" />
              : <AlertCircle className="size-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {upiState.loading ? (
            <div className="text-sm font-semibold text-tb-navy">Checking UPI on file…</div>
          ) : upiState.upi ? (
            <>
              <div className="text-sm font-bold text-emerald-800">UPI on file: {upiState.upi}</div>
              <div className="text-sm text-emerald-700/80 mt-0.5">Payouts will be sent here. Update it in your Testbook account if it needs changing.</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-amber-900">No UPI linked yet</div>
              <div className="text-sm text-amber-800/80 mt-0.5 leading-relaxed">
                Go to{" "}
                <a
                  href={TESTBOOK_REFERRALS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-950 underline underline-offset-2"
                >
                  testbook.com/referrals
                </a>
                , login, update your UPI ID, then come back and refresh this page.
              </div>
              <a
                href={TESTBOOK_REFERRALS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-800"
              >
                Login &amp; update UPI <ExternalLink className="size-3.5" />
              </a>
            </>
          )}
        </div>
        <Wallet className="size-5 text-muted-foreground hidden sm:block shrink-0 mt-0.5" />
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* ── Section 1: Personal details ── */}
        <FormSection title="Personal details" step={1}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name">
              <input
                className="input-field" required placeholder="Your full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Field>
            <Field label="Phone number (verified)">
              <input
                className="input-field bg-secondary/60 cursor-not-allowed text-muted-foreground"
                disabled value={`+91 ${phone}`}
              />
            </Field>
            <Field label="Email address">
              <input
                type="email" className="input-field" required placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="UPI ID" hint="e.g. name@okhdfc">
              <input
                className="input-field bg-secondary/60 cursor-not-allowed text-tb-navy"
                required
                disabled
                placeholder={
                  upiState.loading
                    ? "Checking UPI..."
                    : upiState.upi
                      ? "UPI linked to your Testbook account"
                      : "No UPI linked. Update it from Testbook referrals"
                }
                value={form.upi}
              />
              {form.upi && !isUpi(form.upi) && (
                <p className="mt-1.5 text-xs text-red-600">
                  UPI on file is invalid. Login at{" "}
                  <a href={TESTBOOK_REFERRALS_URL} target="_blank" rel="noreferrer" className="font-bold underline">
                    testbook.com/referrals
                  </a>{" "}
                  and update your UPI ID.
                </p>
              )}
            </Field>
          </div>
        </FormSection>

        {/* ── Section 2: Audience details ── */}
        <FormSection title="Audience details" step={2}>
          <div className="space-y-4">
            <Field label="Where is your audience strongest?">
              <div className="grid grid-cols-2 gap-3 mt-1">
                {platforms.map(({ id, label, Icon }) => {
                  const active = form.platform === id;
                  return (
                    <button
                      type="button" key={id}
                      onClick={() => setForm({ ...form, platform: id, followers: "" })}
                      className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        active
                          ? "border-tb-blue bg-blue-50 text-tb-blue shadow-sm"
                          : "border-border hover:border-tb-blue/40 text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <Icon className={`size-6 ${active ? "text-tb-blue" : ""}`} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field
              label={
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5 text-tb-blue" />
                  {currentPlatform.followerLabel}
                </span>
              }
              hint="Approximate count"
            >
              <div className="relative">
                <input
                  className="input-field pr-28" required placeholder="e.g. 4500"
                  value={form.followers}
                  onChange={(e) => setForm({ ...form, followers: e.target.value.replace(/[^\d]/g, "") })}
                />
                {form.followers && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    {Number(form.followers).toLocaleString("en-IN")} {form.platform === "youtube" ? "subs" : "followers"}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["500", "1000", "5000", "10000", "50000"].map((v) => (
                  <button
                    type="button" key={v}
                    onClick={() => setForm({ ...form, followers: v })}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                      form.followers === v
                        ? "border-tb-blue text-tb-blue bg-blue-50"
                        : "border-border text-muted-foreground hover:border-tb-blue/50"
                    }`}
                  >
                    {Number(v).toLocaleString("en-IN")}+
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </FormSection>

        {/* ── Section 3: Video upload ── */}
        <FormSection title="Give us your video" step={3}>
          <div className="space-y-4">

            {/* Info tip */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
              <CloudUpload className="size-5 mt-0.5 shrink-0 text-tb-blue" />
              <p className="text-sm text-blue-800 leading-relaxed">
                Accepted: <strong>{ACCEPTED_VIDEO_EXTENSIONS}</strong> · Max{" "}
                <strong>{MAX_VIDEO_UPLOAD_LABEL}</strong>
              </p>
            </div>

            {/* Drop zone / file selected */}
            {videoFile ? (
              <div className={`card p-4 flex items-start gap-4 ${cdnUrl ? "!border-emerald-300 bg-emerald-50/40" : "!border-blue-200 bg-blue-50/30"}`}>
                {videoPreview && (
                  <video
                    src={videoPreview}
                    className="size-20 rounded-xl object-cover shrink-0 border border-border shadow-sm"
                    muted
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-tb-navy truncate">{videoFile.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {fmt(videoFile.size)} · {videoFile.type.split("/")[1]?.toUpperCase()}
                      </div>
                    </div>
                    <button
                      type="button" onClick={removeFile}
                      disabled={isBusy}
                      className="size-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 flex items-center justify-center shrink-0 transition-colors border border-border hover:border-red-200 disabled:opacity-40"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {cdnUrl ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                      <CheckCircle2 className="size-4 shrink-0" />
                      Video uploaded — ready to send to Testbook
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 font-medium">
                      <Film className="size-4 shrink-0" />
                      Ready to upload
                    </div>
                  )}
                  {(isBusy || cdnUrl || uploadProgress > 0) && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-white/80 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold">
                        <span className="text-tb-navy">
                          {cdnUrl || stage === "creating_submission" ? "Video upload complete" : "Video upload progress"}
                        </span>
                        <span className="text-tb-blue tabular-nums">{progressPct}%</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-blue-100 overflow-hidden">
                        <div
                          className="h-full tb-gradient rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {stage === "uploading_to_cdn"
                          ? "Uploading the file. Please keep this tab open."
                          : cdnUrl || stage === "creating_submission"
                            ? "File received. We are finalising the handoff to Testbook."
                            : "Progress will appear here after you tap Upload & Send to Testbook."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                role="button" tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-tb-blue bg-blue-50 scale-[1.01]"
                    : "border-border hover:border-tb-blue/60 hover:bg-secondary/50"
                }`}
              >
                <div className="size-16 rounded-2xl tb-gradient flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="size-7 text-white" />
                </div>
                <div className="mt-4 text-base font-bold text-tb-navy">
                  {dragOver ? "Drop your video here" : "Drag & drop your video file here"}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {ACCEPTED_VIDEO_EXTENSIONS} · Maximum {MAX_VIDEO_UPLOAD_LABEL}
                </div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-tb-blue border-2 border-tb-blue/30 rounded-xl px-5 py-2.5 hover:bg-blue-50 hover:border-tb-blue/60 transition-all">
                  <Upload className="size-4" /> Choose video file
                </div>
                <input
                  ref={fileRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>
            )}

          </div>
        </FormSection>

        {/* ── Agreement ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <ScrollText className="size-5 text-tb-blue" />
            <span className="text-base font-bold text-tb-navy">Agreement</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-tb-blue shrink-0 cursor-pointer"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            />
            <div className="flex-1">
              <span className="text-sm text-muted-foreground leading-relaxed">
                I confirm this is my original content, it follows the{" "}
                <button
                  type="button"
                  onClick={() => setHowToModal(true)}
                  className="text-tb-blue font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  How to create guide <ChevronRight className="size-3.5" />
                </button>
                , and I give Testbook permission to publish and use it on official channels.
              </span>
              {!form.consent && (
                <button
                  type="button"
                  onClick={() => setHowToModal(true)}
                  className="mt-2.5 text-sm font-bold text-white bg-tb-navy hover:bg-tb-blue transition-colors px-4 py-2 rounded-lg flex items-center gap-2 w-fit"
                >
                  <Film className="size-4" /> Read How to create
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-tb-blue shrink-0 cursor-pointer"
              checked={termsRead}
              onChange={(e) => setTermsRead(e.target.checked)}
            />
            <div className="flex-1">
              <span className="text-sm text-muted-foreground leading-relaxed">
                I have read and agree to the{" "}
                <button
                  type="button" onClick={() => setTermsModal(true)}
                  className="text-tb-blue font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  Terms &amp; Conditions <ChevronRight className="size-3.5" />
                </button>{" "}
                of the Testbook Creator Campaign.
              </span>
              {!termsRead && (
                <button
                  type="button" onClick={() => setTermsModal(true)}
                  className="mt-2.5 text-sm font-bold text-white bg-tb-navy hover:bg-tb-blue transition-colors px-4 py-2 rounded-lg flex items-center gap-2 w-fit"
                >
                  <ScrollText className="size-4" /> Read Terms &amp; Conditions
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Upload + submit progress ── */}
        {isBusy && (
          <div className="card p-5 space-y-4 !border-tb-blue/30 bg-blue-50/40 fade-up">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 text-tb-blue animate-spin shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-tb-navy">{STAGE_LABELS[stage]}</span>
                  <span className="text-sm font-black text-tb-blue tabular-nums">{progressPct}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-blue-100 overflow-hidden">
                  <div
                    className="h-full tb-gradient rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
            {/* Pipeline steps */}
            <div className="space-y-2">
              {([
                { key: "uploading_to_cdn",    Icon: CloudUpload, label: "Uploading your video" },
                { key: "creating_submission", Icon: Send,        label: "Sending your entry to Testbook" },
              ] as const).map(({ key, Icon, label }) => {
                const isActive = stage === key;
                const isDone   = (stage === "creating_submission" && key === "uploading_to_cdn");
                return (
                  <div key={key} className={`flex items-center gap-2.5 text-sm ${isActive ? "text-tb-blue font-semibold" : isDone ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {isDone
                      ? <CheckCircle2 className="size-4 shrink-0" />
                      : isActive
                        ? <Loader2 className="size-4 shrink-0 animate-spin" />
                        : <div className="size-4 rounded-full border-2 border-border shrink-0" />
                    }
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {stage === "uploading_to_cdn"
                ? "Large files may take a minute. Do not close this tab."
                : "Almost done - finalising your handoff to Testbook."}
            </p>
          </div>
        )}

        {/* ── Error banner ── */}
        {stage === "error" && (
          <div className="card p-5 !border-red-200 bg-red-50/50 flex items-start gap-3 fade-up">
            <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-bold text-red-800">Upload failed</div>
              <div className="text-sm text-red-700 mt-0.5 leading-relaxed">{errorMsg}</div>
              <button
                type="button"
                onClick={() => { setStage("idle"); setErrorMsg(""); setUploadProgress(0); }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors px-3 py-1.5 rounded-lg"
              >
                <RefreshCw className="size-3.5" /> Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Submit button ── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            disabled={!valid || isBusy}
            className="btn-primary w-full sm:w-auto px-10 py-3.5 text-base"
          >
            {isBusy
              ? <><Loader2 className="size-4 animate-spin" /> {STAGE_LABELS[stage]}</>
              : <><CloudUpload className="size-4" /> Upload &amp; Send to Testbook <ArrowRight className="size-4" /></>
            }
          </button>
          {!isBusy && (
            <button
              type="button"
              onClick={() => setHowToModal(true)}
              className="text-sm text-muted-foreground hover:text-tb-blue inline-flex items-center gap-1.5 font-medium"
            >
              How to create <ChevronRight className="size-3.5" />
            </button>
          )}
        </div>

        {!valid && stage === "idle" && (
          <div className="text-xs text-muted-foreground text-center pb-2 space-y-1">
            <p>Complete the highlighted requirement to enable submission.</p>
            <p className="font-semibold text-tb-navy">{missingItems[0]?.message}</p>
          </div>
        )}
      </form>

      {/* ── How to create modal ── */}
      {howToModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 fade-up"
          onClick={() => setHowToModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Film className="size-5 text-tb-blue" />
                <div>
                  <div className="font-bold text-tb-navy">How to create your video</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Create it. Give it to Testbook. We publish approved videos.</div>
                </div>
              </div>
              <button
                type="button" onClick={() => setHowToModal(false)}
                className="size-9 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex items-center gap-2 font-bold text-tb-navy">
                  <CloudUpload className="size-4 text-tb-blue" />
                  Your job is only to create the final video file
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Testbook handles final publishing copy, posting, and view tracking after approval.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {howToSteps.map((item, index) => (
                  <div key={item.title} className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full tb-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="text-sm font-bold text-tb-navy">{item.title}</div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <div className="text-sm font-bold text-red-800">Avoid these</div>
                <div className="mt-3 grid gap-2">
                  {howToDonts.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-red-700">
                      <X className="size-4 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, consent: true }));
                  setHowToModal(false);
                }}
                className="btn-primary flex-1 justify-center py-3"
              >
                <CheckCircle2 className="size-4" /> I agree and will follow this
              </button>
              <button
                type="button"
                onClick={() => setHowToModal(false)}
                className="btn-ghost text-center text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Terms modal ── */}
      {termsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 fade-up"
          onClick={() => setTermsModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <ScrollText className="size-5 text-tb-blue" />
                <div>
                  <div className="font-bold text-tb-navy">Terms &amp; Conditions</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Testbook Creator Campaign · May 2026</div>
                </div>
              </div>
              <button
                type="button" onClick={() => setTermsModal(false)}
                className="size-9 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div ref={termsScrollRef} className="overflow-y-auto flex-1 px-6 py-5 space-y-5 text-sm text-foreground/80 leading-relaxed">
              <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <div className="flex items-center gap-2 font-bold text-tb-navy">
                  <Wallet className="size-4 text-tb-orange" />
                  Video payout rules
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {payoutRules.map((rule) => (
                    <div key={rule.views} className="rounded-lg border border-orange-100 bg-white px-3 py-2">
                      <div className="text-[11px] font-semibold text-muted-foreground">Views</div>
                      <div className="text-sm font-bold text-tb-navy">{rule.views}</div>
                      <div className="mt-1 text-sm font-black text-tb-orange">{rule.amount}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  Payouts are cumulative. Example: 1 Lakh views earns ₹500 + ₹2,500 + ₹6,000 = ₹9,000 total. Payout is processed after review, eligibility confirmation, and valid UPI details.
                </p>
              </div>
              {[
                { t: "1. Overview", b: "These Terms & Conditions govern your participation in the Testbook Creators Lab campaign, operated by Testbook.com. By submitting a video through the Creators Lab portal, you agree to be bound by these terms in their entirety." },
                { t: "2. Eligibility", b: "You must be a registered Testbook user with a valid phone number. Testbook employees and their immediate family members are not eligible." },
                { t: "3. Campaign Participation", b: "Each participant may submit one (1) video per campaign cycle. All videos must be uploaded directly through the portal for Testbook review and publishing. Testbook may modify or discontinue any campaign at any time without prior notice." },
                { t: "4. Review & Approval", b: "All submissions are subject to review. The review process typically takes 24–48 hours. Testbook reserves sole discretion to approve, reject, publish, edit, or schedule any submission." },
                { t: "5. Ownership & Intellectual Property", b: "By submitting, you irrevocably transfer all rights, title, and interest in the video to Testbook.com, including copyright and distribution rights. Testbook may use your name, likeness, and voice for promotional purposes." },
                { t: "6. Payouts", b: "Payouts follow the cumulative view milestones shown above and are processed to the UPI ID linked to your Testbook account after review and eligibility confirmation. Testbook is not responsible for failed payments due to incorrect UPI details." },
                { t: "7. Prohibited Conduct", b: "Strictly prohibited: submitting non-original content, fabricating information, manipulating view counts, using bots, abusive behaviour, or attempting to interfere with Testbook's published video metrics." },
                { t: "8. Privacy & Data", b: "By participating, you consent to Testbook collecting and processing your personal information (name, phone, email, UPI, video) for campaign administration and promotional use, per the Testbook Privacy Policy." },
                { t: "9. Disclaimers", b: "Testbook makes no guarantee regarding views or reach. Testbook is not liable for technical issues or portal downtime. Testbook may remove any video at any time without notice." },
                { t: "10. Modifications", b: "Testbook may update these Terms at any time. Continued participation constitutes acceptance of the revised terms." },
                { t: "11. Termination", b: "Testbook may terminate your participation at any time. Upon termination you forfeit pending payouts. Section 5 (IP rights) survives termination." },
                { t: "12. Governing Law", b: "These Terms are governed by the laws of India. Disputes are subject to exclusive jurisdiction of courts in Mumbai, Maharashtra. Both parties agree to 30 days of good-faith negotiation before formal proceedings." },
              ].map(({ t, b }) => (
                <div key={t}>
                  <div className="font-bold text-tb-navy mb-1.5">{t}</div>
                  <p>{b}</p>
                </div>
              ))}
              <div className="text-xs text-muted-foreground border-t border-border pt-4">
                Testbook Creators Lab · creator-support@testbook.com · ugc.testbook.com<br />
                © 2026 Testbook.com. All rights reserved.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => { setTermsRead(true); setTermsModal(false); }}
                className="btn-primary flex-1 justify-center py-3"
              >
                <CheckCircle2 className="size-4" /> I agree to these Terms &amp; Conditions
              </button>
              <Link to="/terms" target="_blank" className="btn-ghost text-center text-sm">
                Full version <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FormSection({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="size-7 rounded-full tb-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </div>
        <h2 className="text-base font-bold text-tb-navy">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label, hint, className, children,
}: {
  label: React.ReactNode; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-tb-navy">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
