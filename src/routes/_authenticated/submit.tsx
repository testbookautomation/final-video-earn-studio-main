import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Wallet, CheckCircle2, AlertCircle, Loader2,
  Instagram, Youtube, ExternalLink, Upload,
  X, Film, Users, Star, ScrollText, ChevronRight,
  CloudUpload, Send, RefreshCw, ChevronLeft, AlertTriangle
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
      { title: "Send Video - Creators Lab" },
      { name: "description", content: "Upload your Testbook Pass video to Testbook for review, publishing, and UPI payout tracking." },
      { property: "og:title", content: "Send Video - Creators Lab" },
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
  { views: "5,000 in 48h",   amount: "₹200" },
  { views: "10,000 in 48h",  amount: "₹350" },
  { views: "20,000 in 48h",  amount: "₹500" },
  { views: "50,000+ in 48h", amount: "₹1,000" },
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
  
  // Step navigation state
  const [wizardStep, setWizardStep] = useState(1);
  const [attemptedStepTransition, setAttemptedStepTransition] = useState(false);

  const [form, setForm]             = useState({
    fullName: "", email: "no-email@testbook.com", upi: "",
    examCategory: "",
    platform: "instagram" as TBSubmission["platform"],
    followers: "100",
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
  const [cdnUrl, setCdnUrl]             = useState<string | null>(null); 
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
    setCdnUrl(null); 
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

  // Step-level Validation helpers
  const isNameValid = form.fullName.trim().length >= 2;
  const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
  const isUpiValid = isUpi(form.upi);

  const isConsentValid = form.consent;
  const isTermsValid = termsRead;
  const isVideoValid = !!videoFile;

  // New step validation: Step 1 is Video, Step 2 is Creator Info
  const isStep1Valid = isVideoValid && isConsentValid && isTermsValid;
  const isStep2Valid = isNameValid && isEmailValid && isUpiValid;

  const handleNextStep1 = () => {
    setAttemptedStepTransition(true);
    if (isStep1Valid) {
      setWizardStep(2);
      setAttemptedStepTransition(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const validationItems = [
    { ok: isNameValid, message: "Enter your full name." },
    { ok: isUpiValid, message: "Login at testbook.com/referrals and update your UPI ID." },
    { ok: isVideoValid, message: "Choose a video file." },
    { ok: isConsentValid, message: "Confirm the content consent checkbox." },
    { ok: isTermsValid, message: "Agree to the Terms & Conditions checkbox." },
  ];

  const missingItems = validationItems.filter((item) => !item.ok);
  const valid = missingItems.length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || isBusy) return;

    setErrorMsg("");
    track("UGC_creators_submission_submit_clicked", { page: "/submit", platform: form.platform });
    const submissionId = "tb_" + Math.random().toString(36).slice(2, 10);
    const sessionId = getOrCreateUserSession()?.id ?? "";

    let resolvedCdnUrl = cdnUrl;

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
        setCdnUrl(resolvedCdnUrl);
      } catch (err) {
        setStage("error");
        setErrorMsg(errorToMessage(err));
        return;
      }
    } else {
      setUploadProgress(100);
    }

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
    } catch { }

    saveSubmission(submission);
    setStage("done");
    setTimeout(() => navigate({ to: "/dashboard" }), 1600);
  };

  const progressPct = clampProgress(cdnUrl || stage === "creating_submission" ? 100 : uploadProgress);
  const currentFact = uploadFacts[factIndex % uploadFacts.length];

  if (stage === "done") {
    return (
      <section className="min-h-[75vh] flex items-center justify-center px-4 py-10">
        <div className="card p-8 sm:p-10 max-w-md w-full text-center fade-up glass border-emerald-100 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          <div className="size-20 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner animate-bounce">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-tb-navy">Sent to Testbook!</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your video file was uploaded successfully. We will notify you once review finishes and views start accumulating.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["Review in 24h", "Testbook publishes", "UPI payout on milestone"].map((s, idx) => (
              <div key={s} className="card p-3 bg-white/80 border-emerald-50 shadow-sm flex flex-col items-center justify-center">
                <div className="size-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 font-bold text-xs">
                  {idx + 1}
                </div>
                <div className="text-[10px] font-bold text-tb-navy leading-tight">{s}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center items-center gap-2">
            <Loader2 className="size-4 animate-spin text-tb-blue" />
            <span className="text-xs font-semibold text-muted-foreground">Redirecting to Dashboard...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-6 md:py-10 space-y-6">
      
      {/* Header Banner */}
      <div className="fade-up flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 border border-border/80 p-5 rounded-2xl shadow-sm glass">
        <div className="space-y-1">
          <span className="badge badge-orange"><Star className="size-3.5 fill-tb-orange text-tb-orange" /> Creator Campaign</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-tb-navy">Upload video &amp; earn</h1>
          <p className="text-sm text-muted-foreground">
            Share your exam preparation story. Let Testbook publish and track your payout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowToModal(true)}
          className="btn-ghost py-2.5 px-4 text-xs font-bold shrink-0 self-start md:self-auto"
        >
          <Film className="size-3.5 text-tb-blue" /> View Video Guide
        </button>
      </div>

      {/* Progress Wizard */}
      <div className="mb-6 fade-up">
        {/* Desktop Step Wizard */}
        <div className="hidden sm:flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-tb-blue -translate-y-1/2 z-0 transition-all duration-500 ease-out"
            style={{ width: `${((wizardStep - 1) / 1) * 100}%` }} 
          />
               
          {[
            { step: 1, label: "1. Video Submission", desc: "Upload final file" },
            { step: 2, label: "2. Creator Details", desc: "Verify identity & UPI" },
          ].map((item) => {
            const active = wizardStep === item.step;
            const completed = wizardStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (completed || item.step < wizardStep) {
                    setWizardStep(item.step);
                    setAttemptedStepTransition(false);
                  }
                }}
                disabled={!completed && item.step > wizardStep}
                className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-border/80 shadow-sm relative z-10 hover:border-tb-blue/30 disabled:hover:border-border/80 transition-all group disabled:opacity-80"
              >
                <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  completed ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" :
                  active ? "tb-gradient text-white shadow-sm shadow-blue-200 scale-105" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {completed ? <CheckCircle2 className="size-4" /> : item.step}
                </div>
                <div className="text-left">
                  <div className={`text-xs font-bold leading-none ${active ? "text-tb-blue" : completed ? "text-tb-navy" : "text-muted-foreground"}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-none">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Mobile Step Wizard */}
        <div className="sm:hidden flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-border/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-full tb-gradient text-white text-sm font-black flex items-center justify-center shrink-0">
              {wizardStep}
            </span>
            <div>
              <div className="text-sm font-bold text-tb-navy">
                {wizardStep === 1 && "1. Video Submission"}
                {wizardStep === 2 && "2. Creator Details"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Step {wizardStep} of 2</div>
            </div>
          </div>
          <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden shrink-0">
            <div className="h-full tb-gradient transition-all duration-300" style={{ width: `${(wizardStep / 2) * 100}%` }} />
          </div>
        </div>
      </div>

      {isBusy && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes softGlowPulse {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 0.9; transform: scale(1.03); }
            }
            @keyframes subtleFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            .glow-pulse {
              animation: softGlowPulse 4s infinite ease-in-out;
            }
            .premium-float {
              animation: subtleFloat 6s infinite ease-in-out;
            }
            @keyframes sweepSweep {
              0% { left: -100%; }
              100% { left: 200%; }
            }
            .shimmer-sweep-bar {
              position: absolute;
              top: 0;
              bottom: 0;
              width: 50%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
              animation: sweepSweep 2s infinite ease-in-out;
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in-up {
              animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />

          <div className="fixed inset-0 z-40 bg-[#040817]/85 backdrop-blur-lg" aria-hidden="true" />

          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="status" aria-live="polite">
            <div className="w-full max-w-[340px] sm:max-w-[360px] rounded-[2.5rem] overflow-hidden relative premium-float"
              style={{
                background: "linear-gradient(160deg, #0d1538 0%, #060a1e 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              }}>
              
              {/* Volumetric glow effects inside card */}
              <div className="absolute top-[-20%] left-[-20%] w-[200px] h-[200px] rounded-full bg-blue-600/15 blur-[55px] pointer-events-none glow-pulse" />
              <div className="absolute bottom-[-20%] right-[-20%] w-[200px] h-[200px] rounded-full bg-purple-600/15 blur-[55px] pointer-events-none glow-pulse" />

              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

              <div className="px-6 pt-7 pb-5 flex flex-col items-center relative z-10">
                
                {/* Circular neon progress ring */}
                <div className="relative flex items-center justify-center mb-5" style={{ width: 170, height: 170 }}>
                  <svg width="170" height="170" viewBox="0 0 170 170" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="glowStrong">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    
                    {/* Dark backing ring */}
                    <circle cx="85" cy="85" r="72" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    
                    {/* Glowing outer soft ring */}
                    <circle
                      cx="85" cy="85" r="72"
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      filter="url(#glowStrong)"
                      opacity="0.35"
                      strokeDasharray={`${2 * Math.PI * 72}`}
                      strokeDashoffset={`${2 * Math.PI * 72 * (1 - progressPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                    
                    {/* Sharp inner ring */}
                    <circle
                      cx="85" cy="85" r="72"
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      strokeDasharray={`${2 * Math.PI * 72}`}
                      strokeDashoffset={`${2 * Math.PI * 72 * (1 - progressPct / 100)}`}
                      style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
                    />
                  </svg>

                  {/* Inside circle content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <img
                      src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
                      alt="Testbook"
                      className="h-4.5 w-auto opacity-70 mb-1"
                    />
                    <div className="relative flex items-baseline">
                      <span className={`text-4xl font-extrabold tracking-tight tabular-nums leading-none bg-gradient-to-r ${progressPct === 100 ? "from-emerald-400 to-teal-300" : "from-white via-slate-100 to-slate-300"} bg-clip-text text-transparent`}>
                        {progressPct}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 ml-0.5">%</span>
                    </div>
                    {progressPct === 100 && (
                      <span className="mt-1 flex items-center gap-1 text-[9px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="size-3 animate-pulse" /> Done
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtitle upload name */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white tracking-tight">
                    {progressPct === 100 ? "Upload Complete!" : "Uploading to Testbook"}
                  </span>
                  {progressPct < 100 && (
                    <span className="flex gap-0.5 items-end" style={{ height: 14 }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-0.5 rounded-full bg-indigo-400 animate-bounce"
                          style={{ height: `${7 + i * 3}px`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  )}
                </div>

                <p className={`mt-1 text-xs text-center font-medium leading-relaxed max-w-[240px] ${progressPct === 100 ? "text-emerald-400" : "text-slate-400/80"}`}>
                  {progressPct < 30 && "Preparing your video file…"}
                  {progressPct >= 30 && progressPct < 70 && "Transferring to Testbook secure servers…"}
                  {progressPct >= 70 && progressPct < 100 && "Almost there — finalizing cache…"}
                  {progressPct === 100 && "Your video is in — we'll review it shortly."}
                </p>

                {/* Shimmering horizontal progress bar */}
                <div className="mt-5 w-full h-2 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct === 100
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)"
                    }}
                  >
                    {progressPct < 100 && <span className="shimmer-sweep-bar" />}
                  </div>
                </div>

                {/* MB size dynamic tick */}
                {videoFile && progressPct < 100 && (
                  <div className="mt-2.5 flex items-center justify-between w-full px-1 text-[10px] font-bold text-slate-400/80 tracking-wide uppercase">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {fmt(Math.round((progressPct / 100) * videoFile.size))}
                    </span>
                    <span>of {fmt(videoFile.size)}</span>
                  </div>
                )}
              </div>

              <div className="mx-5 h-px bg-white/[0.06]" />

              {/* Dynamic Creator Hack rotating section */}
              <div 
                key={factIndex} 
                className="mx-5 my-5 rounded-3xl p-4.5 transition-all duration-500 ease-out animate-fade-in-up" 
                style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px solid rgba(255,255,255,0.04)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.01)"
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="size-5 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Star className="size-3 fill-indigo-400 text-indigo-400 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                    Creator Hack
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white/95 leading-snug">{currentFact.title}</div>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-medium">{currentFact.body}</p>
              </div>

              <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(99,155,255,0.1),transparent)" }} />
            </div>
          </div>
        </>
      )}

      {/* STEP 1: Video file & Agreements */}
      {wizardStep === 1 && (
        <div className="space-y-5 fade-up">
          {/* Main upload section */}
          <div className="card p-6 space-y-5 bg-white shadow-sm border-border/80">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="size-8 rounded-xl tb-gradient text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-base font-extrabold text-tb-navy">Video Submission</h2>
                <p className="text-xs text-muted-foreground">Select and upload your original vertical MP4 review video.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Size constraints pill */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/60 text-sm text-blue-800">
                <CloudUpload className="size-5 shrink-0 text-tb-blue" />
                <span>
                  Supported: <strong>{ACCEPTED_VIDEO_EXTENSIONS}</strong> · Maximum file size: <strong>{MAX_VIDEO_UPLOAD_LABEL}</strong>
                </span>
              </div>

              {/* Upload Drop Zone */}
              {videoFile ? (
                <div className={`card p-5 border-2 relative overflow-hidden transition-all duration-300 ${
                  cdnUrl ? "border-emerald-200 bg-emerald-50/15" : "border-tb-blue bg-blue-50/10"
                }`}>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* HTML5 video preview player wrapped in simulated premium smartphone */}
                    {videoPreview && (
                      <div className="sm:col-span-1 flex justify-center items-center">
                        <div className="relative w-[130px] h-[230px] rounded-[1.8rem] border-4 border-slate-900 bg-black shadow-2xl overflow-hidden ring-4 ring-slate-800/10 flex items-center justify-center">
                          {/* Notch */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-900 rounded-b-xl z-20 flex justify-center items-center">
                            <div className="size-1 rounded-full bg-slate-700/80 mr-1" />
                            <div className="w-5 h-0.75 rounded-full bg-slate-800" />
                          </div>
                          
                          {/* Video */}
                          <video
                            src={videoPreview}
                            className="w-full h-full object-cover relative z-10"
                            controls
                            playsInline
                          />
                          
                          {/* Gloss reflection overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-20" />
                        </div>
                      </div>
                    )}

                    {/* Metadata & Progress details */}
                    <div className="sm:col-span-2 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-tb-navy truncate max-w-[200px] sm:max-w-xs" title={videoFile.name}>
                              {videoFile.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-semibold flex items-center gap-2">
                              <span>{fmt(videoFile.size)}</span>
                              <span>•</span>
                              <span className="uppercase">{videoFile.type.split("/")[1] || "MP4"}</span>
                            </div>
                          </div>
                          
                          <button
                            type="button" 
                            onClick={removeFile}
                            disabled={isBusy}
                            className="size-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 flex items-center justify-center shrink-0 transition-all border border-border hover:border-red-200 disabled:opacity-40"
                          >
                            <X className="size-4" />
                          </button>
                        </div>

                        {cdnUrl ? (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-100/50 px-2 py-1 rounded-lg w-fit">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            File successfully cached
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-100/60 px-2 py-1 rounded-lg w-fit">
                            <Film className="size-3.5 shrink-0" />
                            Ready to upload
                          </div>
                        )}
                      </div>

                      {/* Micro Progress bar */}
                      {(isBusy || cdnUrl || uploadProgress > 0) && (
                        <div className="rounded-xl border border-blue-50 bg-white/90 p-3 shadow-inner">
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="text-tb-navy">
                              {cdnUrl || stage === "creating_submission" ? "Cached successfully" : "Upload progress"}
                            </span>
                            <span className="text-tb-blue tabular-nums">{progressPct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                            <div
                              className="h-full tb-gradient rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
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
                  className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 bg-slate-950 text-white shadow-xl glow-blue hover:border-tb-blue/60 hover:bg-slate-900/90 ${
                    dragOver
                      ? "border-tb-blue bg-slate-900/100 scale-[1.01] shadow-2xl shadow-blue-500/10"
                      : "border-slate-800"
                  }`}
                >
                  <div className="size-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 relative z-10 animate-pulse">
                    <CloudUpload className="size-9 text-white animate-pulse" />
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold text-white tracking-tight">
                    {dragOver ? "Drop files now!" : "Drag & drop video terminal"}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 font-medium max-w-xs mx-auto">
                    Only MP4, MOV or WebM formats allowed. Maximum upload limit is {MAX_VIDEO_UPLOAD_LABEL}.
                  </p>
                  
                  {/* Automated checks tags */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-sm mx-auto bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-900/40">
                      <Film className="size-3" /> MP4 / MOV / WebM
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-950/80 text-indigo-400 border border-indigo-900/40">
                      <Users className="size-3" /> Vertical 9:16 format
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-950/80 text-purple-400 border border-purple-900/40">
                      <Upload className="size-3" /> Max {MAX_VIDEO_UPLOAD_LABEL}
                    </span>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 rounded-xl px-6 py-3 hover:scale-105 active:scale-95 transition-all">
                    <Upload className="size-4 animate-bounce" /> Choose video file
                  </div>
                  <input
                    ref={fileRef} type="file" accept="video/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                  />
                </div>
              )}
              
              {attemptedStepTransition && !isVideoValid && (
                <p className="text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> You must select a video file before submitting.</p>
              )}
            </div>
          </div>

          {/* Guidelines checklist */}
          <div className="card p-5 space-y-4 bg-white shadow-sm border-border/80">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <CheckCircle2 className="size-4.5 text-tb-blue" />
              <span className="text-sm font-extrabold text-tb-navy">Submission Checklist</span>
            </div>
            
            <div className="grid gap-2 sm:grid-cols-2 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>30-60 seconds long</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Vertical aspect ratio (9:16)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Mentions Testbook Pass</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Clear lighting &amp; voiceover</span>
              </div>
            </div>
          </div>

          {/* Agreements card */}
          <div className="card p-5 space-y-4 bg-white shadow-sm border-border/80">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <ScrollText className="size-5 text-tb-blue" />
              <span className="text-base font-extrabold text-tb-navy">Authorizations &amp; Consent</span>
            </div>

            <div className={`flex items-start gap-3 p-3.5 rounded-xl hover:bg-secondary/40 transition-all ${
              attemptedStepTransition && !isConsentValid ? "border border-red-200 bg-red-50/10" : ""
            }`}>
              <input
                type="checkbox"
                id="consent-check"
                className="mt-0.5 size-5 accent-tb-blue shrink-0 cursor-pointer rounded"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              />
              <label htmlFor="consent-check" className="flex-1 cursor-pointer">
                <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  I certify this video is my authentic original creation and follows the{" "}
                  <button
                    type="button"
                    onClick={() => setHowToModal(true)}
                    className="text-tb-blue font-extrabold hover:underline inline-flex items-center gap-0.5"
                  >
                    Video creation guides <ChevronRight className="size-3.5" />
                  </button>
                  . I grant Testbook unlimited distribution &amp; publishing rights.
                </span>
                {attemptedStepTransition && !isConsentValid && (
                  <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="size-3" /> You must consent to content usage.</p>
                )}
              </label>
            </div>

            <div className={`flex items-start gap-3 p-3.5 rounded-xl hover:bg-secondary/40 transition-all ${
              attemptedStepTransition && !isTermsValid ? "border border-red-200 bg-red-50/10" : ""
            }`}>
              <input
                type="checkbox"
                id="terms-check"
                className="mt-0.5 size-5 accent-tb-blue shrink-0 cursor-pointer rounded"
                checked={termsRead}
                onChange={(e) => setTermsRead(e.target.checked)}
              />
              <label htmlFor="terms-check" className="flex-1 cursor-pointer">
                <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  I accept in full the general campaign{" "}
                  <button
                    type="button" onClick={() => setTermsModal(true)}
                    className="text-tb-blue font-extrabold hover:underline inline-flex items-center gap-0.5"
                  >
                    Terms &amp; Conditions <ChevronRight className="size-3.5" />
                  </button>
                  .
                </span>
                {attemptedStepTransition && !isTermsValid && (
                  <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="size-3" /> Agreement with terms is required.</p>
                )}
              </label>
            </div>
          </div>

          {/* Action row */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNextStep1}
              className="btn-primary w-full sm:w-auto px-8 py-3.5"
            >
              Continue to Details <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Creator profile details */}
      {wizardStep === 2 && (
        <form onSubmit={submit} className="space-y-5 fade-up">
          {/* UPI Status Alert banner */}
          <div className={`card p-5 flex items-start gap-4 glass transition-all duration-300 ${
            upiState.loading ? "border-border" : upiState.upi
              ? "!border-emerald-100 bg-emerald-50/20"
              : "!border-amber-100 bg-amber-50/30"
          }`}>
            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              upiState.loading ? "bg-secondary text-muted-foreground animate-pulse"
              : upiState.upi   ? "bg-emerald-100 text-emerald-700"
                               : "bg-amber-100 text-amber-700"
            }`}>
              {upiState.loading
                ? <Loader2 className="size-5 animate-spin" />
                : upiState.upi
                  ? <CheckCircle2 className="size-6 text-emerald-600" />
                  : <AlertCircle className="size-6 text-amber-600" />}
            </div>
            <div className="flex-1 min-w-0">
              {upiState.loading ? (
                <div className="text-sm font-bold text-tb-navy">Checking linked UPI account...</div>
              ) : upiState.upi ? (
                <>
                  <div className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    UPI Active: <code className="bg-emerald-100/60 px-1.5 py-0.5 rounded text-xs font-mono">{upiState.upi}</code>
                  </div>
                  <div className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                    Testbook pays payouts directly to this linked UPI ID. To change this, update your settings at testbook.com.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="size-4 shrink-0" /> Action required: Link your UPI
                  </div>
                  <div className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    You cannot submit video entries without a linked UPI ID. Update your payment configuration inside your Testbook Referrals account.
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={TESTBOOK_REFERRALS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-amber-800 hover:scale-102 active:scale-98 shadow-sm"
                    >
                      Login &amp; Link UPI <ExternalLink className="size-3" />
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-5 bg-white shadow-sm border-border/80">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="size-8 rounded-xl tb-gradient text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-base font-extrabold text-tb-navy">Creator Information</h2>
                <p className="text-xs text-muted-foreground">Verify your identity and payment credentials.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-sm font-bold text-tb-navy">Full name</span>
                <input
                  className={`input-field ${attemptedStepTransition && !isNameValid ? "!border-red-400 bg-red-50/10 focus:ring-red-100" : ""}`} 
                  required 
                  placeholder="Enter your exact name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
                {attemptedStepTransition && !isNameValid && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> Name is required (min 2 chars).</p>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-bold text-tb-navy">Phone number (verified)</span>
                <div className="relative">
                  <input
                    className="input-field bg-secondary/50 cursor-not-allowed text-muted-foreground font-semibold"
                    disabled value={`+91 ${phone}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-tb-navy">Linked UPI ID</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Managed on Testbook</span>
                </div>
                <div className="relative">
                  <input
                    className={`input-field bg-secondary/50 cursor-not-allowed text-tb-navy font-mono font-medium ${attemptedStepTransition && !isUpiValid ? "!border-red-400" : ""}`}
                    required
                    disabled
                    placeholder={
                      upiState.loading
                        ? "Checking credentials..."
                        : upiState.upi
                          ? "Linked automatically"
                          : "No UPI on file"
                    }
                    value={form.upi}
                  />
                  {form.upi && isUpiValid && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    </span>
                  )}
                </div>
                {attemptedStepTransition && !isUpiValid && (
                  <p className="text-[11px] font-bold text-red-500 flex items-start gap-1">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" /> 
                    <span>Invalid or missing UPI ID. Please update it at testbook.com/referrals first.</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload progress & status display */}
          {isBusy && (
            <div className="card p-5 space-y-4 !border-tb-blue/30 bg-blue-50/40 fade-up">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 text-tb-blue animate-spin shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-tb-navy">{STAGE_LABELS[stage]}</span>
                    <span className="text-tb-blue tabular-nums">{progressPct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full tb-gradient rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {stage === "error" && (
            <div className="card p-5 !border-red-200 bg-red-50/50 flex items-start gap-3 fade-up">
              <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-bold text-red-800">Upload failed</div>
                <div className="text-sm text-red-700 mt-0.5 leading-relaxed">{errorMsg}</div>
                <button
                  type="button"
                  onClick={() => { setStage("idle"); setErrorMsg(""); setUploadProgress(0); }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors px-4 py-2 rounded-xl"
                >
                  <RefreshCw className="size-3.5" /> Try again
                </button>
              </div>
            </div>
          )}

          {/* Action row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setWizardStep(1);
                setAttemptedStepTransition(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-ghost w-full sm:w-auto px-6 py-3.5 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Back to Video
            </button>

            <button
              disabled={isBusy}
              onClick={() => setAttemptedStepTransition(true)}
              className="btn-orange w-full sm:w-auto px-10 py-3.5 text-base shadow-lg shadow-orange-500/25"
            >
              {isBusy
                ? <><Loader2 className="size-4 animate-spin" /> {STAGE_LABELS[stage]}</>
                : <><Send className="size-4" /> Submit Video File</>
              }
            </button>
          </div>
        </form>
      )}

      {/* How to create video modal */}
      {howToModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 fade-up"
          onClick={() => setHowToModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Film className="size-5 text-tb-blue" />
                <div>
                  <div className="font-extrabold text-tb-navy">How to build a high-paying video</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Optimize your structure for massive student viewership.</div>
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
                    <div key={item} className="flex items-start gap-2 text-sm text-red-700 font-semibold">
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
                <CheckCircle2 className="size-4" /> I understand and will follow this
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

      {/* Terms & Conditions Modal */}
      {termsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 fade-up"
          onClick={() => setTermsModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <ScrollText className="size-5 text-tb-blue" />
                <div>
                  <div className="font-extrabold text-tb-navy">Terms &amp; Conditions</div>
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
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {payoutRules.map((rule) => (
                    <div key={rule.views} className="rounded-lg border border-orange-100 bg-white px-3 py-2 shadow-sm">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Views</div>
                      <div className="text-xs font-bold text-tb-navy">{rule.views}</div>
                      <div className="mt-1 text-sm font-black text-tb-orange">{rule.amount}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                  Payouts are cumulative. Example: 50,000+ views in 48h earns ₹200 + ₹350 + ₹500 + ₹1,000 = ₹2,050 total. Payout is processed after review, eligibility confirmation, and valid UPI details.
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
              ].map(({ t, b }) => (
                <div key={t} className="space-y-1">
                  <div className="font-bold text-tb-navy">{t}</div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{b}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-border shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => { setTermsRead(true); setTermsModal(false); }}
                className="btn-primary flex-1 justify-center py-3"
              >
                <CheckCircle2 className="size-4" /> I agree to these Terms
              </button>
              <Link to="/terms" target="_blank" className="btn-ghost text-center text-sm py-2">
                Full version <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
