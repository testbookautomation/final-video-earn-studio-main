import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Wallet, CheckCircle2, AlertCircle, Loader2,
  Instagram, Youtube, Facebook, ExternalLink, Upload,
  X, Film, Users, Star, ScrollText, ChevronRight,
  CloudUpload, Send, RefreshCw,
} from "lucide-react";
import { getUser, saveSubmission, type TBSubmission } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Submit Video — Testbook Creator Lab" },
      { name: "description", content: "Submit your Testbook Pass promotional video for review and start earning UPI payouts." },
      { property: "og:title", content: "Submit Video — Testbook Creator Lab" },
      { property: "og:url", content: "/submit" },
    ],
  }),
  component: SubmitPage,
});

const exams = [
  "SSC / Govt", "Banking", "Railways", "NEET / Medical",
  "JEE / Engineering", "UPSC / Civils", "Teaching", "State PSC", "CAT / MBA", "Other",
];

const platforms = [
  { id: "instagram", label: "Instagram Reel", Icon: Instagram, followerLabel: "Instagram followers" },
  { id: "youtube",   label: "YouTube Short",  Icon: Youtube,   followerLabel: "YouTube subscribers" },
  { id: "facebook",  label: "Facebook Reel",  Icon: Facebook,  followerLabel: "Facebook followers" },
] as const;

type UpiState = { loading: boolean; upi: string | null; error: string | null };

// Two-stage submit pipeline stages
type SubmitStage =
  | "idle"
  | "uploading_to_cdn"   // Step 1 — sending video to LMS CDN
  | "creating_submission"// Step 2 — saving submission + forwarding to Apps Script
  | "done"               // All complete
  | "error";             // Something failed

const STAGE_LABELS: Record<SubmitStage, string> = {
  idle:                 "",
  uploading_to_cdn:     "Uploading video to LMS CDN…",
  creating_submission:  "Saving submission & notifying team…",
  done:                 "Submitted successfully!",
  error:                "Something went wrong",
};

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " MB";
  return (n / 1024).toFixed(0) + " KB";
}

function SubmitPage() {
  const navigate = useNavigate();
  const [phone, setPhone]           = useState("");
  const [upiState, setUpiState]     = useState<UpiState>({ loading: true, upi: null, error: null });
  const [form, setForm]             = useState({
    fullName: "", email: "", upi: "",
    examCategory: exams[0],
    platform: "instagram" as TBSubmission["platform"],
    followers: "",
    videoMode: "upload" as "upload",
    videoUrl: "",
    caption: "",
    consent: false,
  });
  const [videoFile, setVideoFile]       = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [stage, setStage]               = useState<SubmitStage>("idle");
  const [errorMsg, setErrorMsg]         = useState("");
  const [cdnUrl, setCdnUrl]             = useState<string | null>(null); // persisted after Step 1
  const [termsModal, setTermsModal]     = useState(false);
  const [termsRead, setTermsRead]       = useState(false);
  const fileRef      = useRef<HTMLInputElement>(null);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) return;
    setPhone(u.phone);
    fetch(`/api/fetch-upi?phone=${encodeURIComponent(u.phone)}&userId=${u.phone}`)
      .then((r) => r.json())
      .then((d: { upi?: string | null }) => {
        if (d.upi) setForm((f) => ({ ...f, upi: d.upi! }));
        setUpiState({ loading: false, upi: d.upi ?? null, error: null });
      })
      .catch(() => setUpiState({ loading: false, upi: null, error: null }));
  }, []);

  useEffect(() => {
    return () => { if (videoPreview) URL.revokeObjectURL(videoPreview); };
  }, [videoPreview]);

  const pickFile = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setVideoFile(file);
    setCdnUrl(null); // reset CDN URL if a new file is picked
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setVideoFile(null);
    setCdnUrl(null);
    if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); }
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  };

  const isUpi = (s: string) => /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(s);

  const valid =
    form.fullName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    isUpi(form.upi) &&
    form.followers.trim() !== "" &&
    !!videoFile &&
    form.caption.trim().length >= 20 &&
    form.consent &&
    termsRead;

  const currentPlatform = platforms.find((p) => p.id === form.platform)!;
  const isBusy = stage === "uploading_to_cdn" || stage === "creating_submission";

  /* ── Two-stage submit pipeline ──────────────────────────── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || isBusy) return;

    setErrorMsg("");
    const submissionId = "tb_" + Math.random().toString(36).slice(2, 10);

    /* ── Stage 1: Upload video to LMS CDN ─────────────────── */
    let resolvedCdnUrl = cdnUrl; // reuse if already uploaded (retry scenario)

    if (!resolvedCdnUrl) {
      setStage("uploading_to_cdn");

      const fd = new FormData();
      fd.append("file",          videoFile!);
      fd.append("submissionId",  submissionId);
      fd.append("creatorPhone",  phone);
      fd.append("platform",      form.platform);

      try {
        const res  = await fetch("/api/upload-lms", { method: "POST", body: fd });
        const data = await res.json() as { ok: boolean; cdnUrl?: string; error?: string };

        if (!data.ok || !data.cdnUrl) {
          throw new Error(data.error ?? `Upload failed (HTTP ${res.status})`);
        }

        resolvedCdnUrl = data.cdnUrl;
        setCdnUrl(resolvedCdnUrl); // persist so retry skips re-upload
      } catch (err) {
        setStage("error");
        setErrorMsg(String(err));
        return;
      }
    }

    /* ── Stage 2: Save submission + forward to Apps Script ── */
    setStage("creating_submission");

    const submission: TBSubmission = {
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
      await fetch("/api/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...submission, videoFile: undefined }),
      });
    } catch { /* non-blocking — submission is saved locally regardless */ }

    saveSubmission(submission);
    setStage("done");
    setTimeout(() => navigate({ to: "/dashboard" }), 1600);
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (stage === "done") {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="card p-10 max-w-md w-full text-center fade-up">
          <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-tb-navy">Video Submitted!</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your video is on the LMS CDN and our team will review it within 24 hours.
            Redirecting to your dashboard…
          </p>
          {cdnUrl && (
            <a
              href={cdnUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-tb-blue font-medium hover:underline"
            >
              <CloudUpload className="size-3.5" /> View uploaded video on CDN
            </a>
          )}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {["Review in 24h", "Track live status", "UPI payout on milestone"].map((s) => (
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
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Submit your video</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Your video is uploaded directly to the LMS CDN — approval in your dashboard within 24 hours.
        </p>
      </div>

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
              <div className="text-sm text-emerald-700/80 mt-0.5">Payouts will be sent here. Update below to change.</div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-amber-900">No UPI linked yet</div>
              <div className="text-sm text-amber-800/80 mt-0.5">Add your UPI below — payouts can't be sent without it.</div>
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
                className="input-field" required placeholder="name@upi"
                value={form.upi}
                onChange={(e) => setForm({ ...form, upi: e.target.value })}
              />
              {form.upi && !isUpi(form.upi) && (
                <p className="mt-1.5 text-xs text-red-600">Enter a valid UPI ID (e.g. name@okaxis)</p>
              )}
            </Field>
            <Field label="Exam category" className="sm:col-span-2">
              <select
                className="input-field" value={form.examCategory}
                onChange={(e) => setForm({ ...form, examCategory: e.target.value })}
              >
                {exams.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </div>
        </FormSection>

        {/* ── Section 2: Platform & audience ── */}
        <FormSection title="Platform & audience" step={2}>
          <div className="space-y-4">
            <Field label="Which platform will you post on?">
              <div className="grid grid-cols-3 gap-3 mt-1">
                {platforms.map(({ id, label, Icon }) => {
                  const active = form.platform === id;
                  return (
                    <button
                      type="button" key={id}
                      onClick={() => setForm({ ...form, platform: id, followers: "" })}
                      className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-sm font-semibold transition-all ${
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
        <FormSection title="Upload your video" step={3}>
          <div className="space-y-4">

            {/* Info tip */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
              <CloudUpload className="size-5 mt-0.5 shrink-0 text-tb-blue" />
              <p className="text-sm text-blue-800 leading-relaxed">
                Your video will be uploaded directly to the <strong>LMS CDN</strong>.
                Accepted: <strong>MP4, MOV, AVI</strong> · Max <strong>500 MB</strong>
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
                      Uploaded to CDN — ready to submit
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 font-medium">
                      <Film className="size-4 shrink-0" />
                      Ready to upload
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
                className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
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
                <div className="mt-2 text-sm text-muted-foreground">MP4, MOV, AVI · Maximum 500 MB</div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-tb-blue border-2 border-tb-blue/30 rounded-xl px-5 py-2.5 hover:bg-blue-50 hover:border-tb-blue/60 transition-all">
                  <Upload className="size-4" /> Choose video file
                </div>
                <input
                  ref={fileRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                />
              </div>
            )}

            {/* Caption */}
            <Field label="Caption used on the post" hint="Min 20 characters · include #TestbookPass">
              <textarea
                rows={4} className="input-field resize-none" required
                placeholder={`New to Testbook Pass and honestly — wish I'd switched sooner.\n\n#TestbookPass #StudyWithMe`}
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
              <div className={`mt-1.5 text-xs text-right font-medium ${form.caption.length < 20 ? "text-muted-foreground" : "text-emerald-600"}`}>
                {form.caption.length} chars {form.caption.length < 20 ? `(${20 - form.caption.length} more needed)` : "✓"}
              </div>
            </Field>
          </div>
        </FormSection>

        {/* ── Agreement ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <ScrollText className="size-5 text-tb-blue" />
            <span className="text-base font-bold text-tb-navy">Agreement</span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-secondary/50 transition-colors">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-tb-blue shrink-0"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            />
            <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
              I confirm this is my original content, it follows the{" "}
              <Link to="/sop" className="text-tb-blue font-semibold hover:underline">Creator SOP</Link>, and
              I consent to Testbook resharing it on their official channels.
            </span>
          </label>

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
              <span className="text-sm font-semibold text-tb-navy">{STAGE_LABELS[stage]}</span>
            </div>
            {/* Pipeline steps */}
            <div className="space-y-2">
              {([
                { key: "uploading_to_cdn",    Icon: CloudUpload, label: "Uploading video to LMS CDN" },
                { key: "creating_submission", Icon: Send,        label: "Saving submission & notifying team" },
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
                : "Almost done — finalising your submission."}
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
                onClick={() => { setStage("idle"); setErrorMsg(""); }}
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
              : <><CloudUpload className="size-4" /> Upload &amp; Submit for Review <ArrowRight className="size-4" /></>
            }
          </button>
          {!isBusy && (
            <Link to="/sop" className="text-sm text-muted-foreground hover:text-tb-blue inline-flex items-center gap-1.5 font-medium">
              Re-read the SOP <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>

        {!valid && stage === "idle" && (
          <p className="text-xs text-muted-foreground text-center pb-2">
            Fill all fields, choose a video, and agree to both checkboxes to enable submission.
          </p>
        )}
      </form>

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
              {[
                { t: "1. Overview", b: "These Terms & Conditions govern your participation in the Testbook Creators Lab campaign, operated by Testbook.com. By submitting a video through the Creators Lab portal, you agree to be bound by these terms in their entirety." },
                { t: "2. Eligibility", b: "You must be a registered Testbook user with a valid phone number. Testbook employees and their immediate family members are not eligible." },
                { t: "3. Campaign Participation", b: "Each participant may submit one (1) video per campaign cycle. All videos must be uploaded directly through the portal. Testbook may modify or discontinue any campaign at any time without prior notice." },
                { t: "4. Review & Approval", b: "All submissions are subject to review. The review process typically takes 24–48 hours. Testbook reserves sole discretion to approve or reject any submission." },
                { t: "5. Ownership & Intellectual Property", b: "By submitting, you irrevocably transfer all rights, title, and interest in the video to Testbook.com, including copyright and distribution rights. Testbook may use your name, likeness, and voice for promotional purposes." },
                { t: "6. Payouts", b: "Payouts are processed within 5–7 working days to the UPI ID linked to your Testbook account. Payout amounts are indicative and do not constitute a guarantee. Testbook is not responsible for failed payments due to incorrect UPI details." },
                { t: "7. Prohibited Conduct", b: "Strictly prohibited: submitting non-original content, fabricating information, manipulating view counts, using bots, abusive behaviour, or deleting your video before payout is complete." },
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
