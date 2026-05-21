import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Users,
  IndianRupee,
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  Star,
  ChevronLeft
} from "lucide-react";
import {
  getOrCreateUserSession,
  getUrlUserParams,
  getUser,
  setUser,
  updateUserSession,
} from "@/lib/auth";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Creators Lab" },
      {
        name: "description",
        content:
          "Login with your phone number and OTP to start submitting videos and tracking payouts.",
      },
      { property: "og:title", content: "Login — Creators Lab" },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const emptyOtp = () => Array.from({ length: OTP_LENGTH }, () => "");

type AuthApiResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  userId?: string;
  studentId?: string;
  name?: string;
};

const perks = [
  "Create a 30–60s video on your exam journey",
  "Upload the final file to Testbook in under 5 minutes",
  "Earn ₹200 – ₹1,000 directly to your UPI",
];

const stats = [
  { Icon: Users, k: "12K+", v: "Creators" },
  { Icon: IndianRupee, k: "₹4.2Cr", v: "Paid out" },
  { Icon: Trophy, k: "85%", v: "Approval" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [urlPhone, setUrlPhone] = useState("");
  const [urlUserId, setUrlUserId] = useState("");
  const [otp, setOtp] = useState(emptyOtp);
  const [loading, setLoading] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resend, setResend] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (getUser()) {
      navigate({ to: "/dashboard" });
      return;
    }

    const urlUser = getUrlUserParams(window.location.search);
    if (!urlUser.hasIdentity) {
      const session = getOrCreateUserSession();
      if (session?.userId) setUrlUserId(session.userId);
      if (session?.phone) {
        setPhone(session.phone);
        setUrlPhone(session.phone);
        setUrlUserId(session.userId || session.phone);
      }
      return;
    }

    const userId = urlUser.userId || urlUser.phone;
    updateUserSession({ phone: urlUser.phone, userId });
    setUrlUserId(userId);

    if (urlUser.phone.length === 10) {
      setPhone(urlUser.phone);
      setUrlPhone(urlUser.phone);
    }

    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", clean);
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResend(RESEND_SECONDS);
    timerRef.current = setInterval(() => {
      setResend((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const otpFilled = otp.every((d) => d !== "");
  const busy = loading !== null;
  const resolvedUserId = () => {
    if (urlUserId && (!urlPhone || phone === urlPhone)) return urlUserId;
    return phone;
  };

  const readAuthResponse = async (res: Response): Promise<AuthApiResponse> => {
    let data: AuthApiResponse = {};
    try {
      data = (await res.json()) as AuthApiResponse;
    } catch {
      /* ignore */
    }
    if (!res.ok || !data.ok) {
      throw new Error(
        data.error ||
          data.message ||
          "Unable to complete OTP request. Please try again.",
      );
    }
    return data;
  };

  const requestOtp = async (isResend = false) => {
    setError(null);
    if (!validPhone) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    const userId = resolvedUserId();
    setLoading("send");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, resend: isResend }),
      });
      await readAuthResponse(res);
      updateUserSession({ phone, userId });
      track("UGC_creators_auth_otp_requested", {
        page: "/login",
        payload: { phone, userId },
      });
      setOtp(emptyOtp());
      setStep("otp");
      startResendTimer();
      window.setTimeout(() => refs.current[0]?.focus(), 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send OTP. Please try again.",
      );
    } finally {
      setLoading(null);
    }
  };

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void requestOtp(false);
  };

  const handleOtp = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    setError(null);
    if (v && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) => {
    if (e.key === "Backspace") {
      if (otp[i]) {
        const n = [...otp];
        n[i] = "";
        setOtp(n);
      } else if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1)
      refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!digits) return;
    const next = emptyOtp();
    digits.split("").forEach((d, idx) => {
      next[idx] = d;
    });
    setOtp(next);
    setError(null);
    refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const doVerify = async (code: string) => {
    setError(null);
    if (step !== "otp" || !validPhone) {
      setError("Request an OTP before logging in.");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading("verify");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await readAuthResponse(res);
      const userId = data.userId || data.studentId || resolvedUserId();
      setUser({ phone, userId, name: data.name, loggedInAt: Date.now() });
      track("UGC_creators_auth_login_completed", {
        page: "/login",
        payload: { phone, userId, hasName: !!data.name },
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid OTP. Please check and try again.",
      );
    } finally {
      setLoading(null);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpFilled) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    await doVerify(otp.join(""));
  };

  const handleResend = () => {
    if (resend > 0 || busy) return;
    void requestOtp(true);
  };

  const goBack = () => {
    setStep("phone");
    setOtp(emptyOtp());
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setResend(0);
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] flex bg-tb-bg">
      
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[50%] tb-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Background layers */}
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-blue-500/25 blur-[100px]" />
        <div className="absolute top-1/2 -right-20 size-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 size-80 rounded-full bg-violet-600/15 blur-[100px]" />

        {/* ── Top: logo + live badge ── */}
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
              alt="Testbook"
              className="h-7 w-auto"
            />
            <div className="h-4 w-px bg-white/30" />
            <div className="text-[10px] font-black uppercase tracking-widest text-white/70 bg-white/10 px-2 py-0.5 rounded">
              Creators Lab
            </div>
          </div>
          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-wider">LIVE CAMPAIGN</span>
          </div>
        </div>

        {/* ── Middle: headline + perks + stats ── */}
        <div className="relative space-y-8 my-auto">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 font-bold backdrop-blur-md w-fit">
            <Sparkles className="size-3.5 text-yellow-300 animate-pulse" />
            ₹4.2 Crore paid out to student creators
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl xl:text-[2.75rem] font-black text-white leading-[1.15] tracking-tight">
              Create the video.
              <br />
              Send it to Testbook.
              <br />
              <span className="relative inline-block">
                <span className="tb-text-gradient bg-gradient-to-r from-white to-blue-200">Get paid in UPI.</span>
                {/* underline accent */}
                <span className="absolute -bottom-1.5 left-0 h-0.75 w-full rounded-full bg-gradient-to-r from-blue-400 to-transparent" />
              </span>
            </h2>
            <p className="text-white/70 text-sm xl:text-base max-w-md leading-relaxed">
              Upload your vertical video to Creators Lab. Approved submissions are published by Testbook, and milestone payouts go straight to your UPI.
            </p>
          </div>

          {/* Perks as pills */}
          <div className="space-y-3 max-w-md">
            {perks.map((p, i) => (
              <div
                key={p}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/15 transition-all"
              >
                <div className="size-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-300">{i + 1}</span>
                </div>
                <span className="text-xs xl:text-sm text-white/90 font-semibold">{p}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {stats.map(({ Icon, k, v }) => (
              <div
                key={k}
                className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-4 text-center hover:bg-white/15 transition-all"
              >
                <div className="size-8 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <Icon className="size-4 text-white" />
                </div>
                <div className="text-lg xl:text-xl font-black text-white">{k}</div>
                <div className="text-[10px] text-white/50 mt-0.5 uppercase tracking-widest font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom: testimonial card ── */}
        <div className="relative max-w-md">
          <div className="flex items-center gap-0.5 mb-2 ml-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-3.5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-1.5 text-[10px] text-white/50 font-bold uppercase tracking-wider">Creator Review</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-4">
            <p className="text-xs xl:text-sm text-white/90 italic leading-relaxed">
              "Uploaded my first video on a Monday. Testbook approved it by Wednesday and UPI hit my account by Friday. Highly recommend!"
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                  P
                </div>
                <div>
                  <div className="text-xs xl:text-sm font-bold text-white leading-tight">Priya S.</div>
                  <div className="text-[10px] text-white/50 mt-0.5">SSC CGL Aspirant</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-emerald-400">₹18,400</div>
                <div className="text-[10px] text-white/40">Total earned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-14 bg-gradient-to-b from-blue-50/20 to-white relative overflow-hidden">
        {/* Decorative background orbs */}
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-blue-100/40 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 -left-10 size-48 rounded-full bg-indigo-100/30 blur-[60px] pointer-events-none" />

        <div className="w-full max-w-sm fade-up relative space-y-6">

          {/* Mobile Hero View (compact, hidden on desktop) */}
          <div className="lg:hidden">
            <div className="tb-gradient rounded-3xl p-5 text-white text-center relative overflow-hidden shadow-lg shadow-blue-900/10">
              <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
              <div className="relative space-y-3.5">
                <div className="flex items-center justify-center gap-2">
                  <img
                    src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
                    alt="Testbook"
                    className="h-5.5 w-auto"
                  />
                  <span className="text-[10px] font-black tracking-widest text-white/80 bg-white/10 px-1.5 py-0.5 rounded">Creators Lab</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white/90 leading-relaxed">
                  Share your story. Earn up to <span className="text-yellow-300 font-extrabold">₹1,000</span> via UPI.
                </p>
                <div className="flex justify-center gap-6 mt-1 border-t border-white/10 pt-2 max-w-xs mx-auto">
                  {stats.map(({ k, v }) => (
                    <div key={k} className="text-center">
                      <div className="text-sm font-black">{k}</div>
                      <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/80" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-border/80 shadow-sm text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <Lock className="size-3.5 text-emerald-500" />
              OTP VERIFIED · SECURE
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/80" />
          </div>

          {/* Steps visual wizard indicator */}
          <div className="flex items-center justify-center gap-3 bg-secondary/30 p-2 rounded-2xl border border-border/40">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
              step === "phone" ? "bg-white text-tb-navy font-bold shadow-sm scale-105" : "text-muted-foreground opacity-60"
            }`}>
              <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === "phone" ? "tb-gradient text-white" : "bg-muted text-muted-foreground"
              }`}>1</span>
              <span className="text-xs font-bold tracking-tight">Phone Number</span>
            </div>
            
            <ArrowRight className="size-3.5 text-muted-foreground/60 shrink-0" />
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
              step === "otp" ? "bg-white text-tb-navy font-bold shadow-sm scale-105" : "text-muted-foreground opacity-60"
            }`}>
              <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === "otp" ? "tb-gradient text-white animate-bounce" : "bg-muted text-muted-foreground"
              }`}>2</span>
              <span className="text-xs font-bold tracking-tight">OTP Code</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl font-black text-tb-navy flex items-center justify-center sm:justify-start gap-2">
              {step === "phone" ? (
                <><Phone className="size-5.5 text-tb-blue" /> Login with Phone</>
              ) : (
                <><ShieldCheck className="size-5.5 text-emerald-500 animate-bounce" /> Verify OTP</>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {step === "phone" ? (
                "Enter your mobile number. We will send a secure 6-digit OTP to verify your account."
              ) : (
                <>
                  OTP sent to{" "}
                  <span className="font-extrabold text-tb-navy">+91 {phone}</span>.
                  Enter it below to continue.
                </>
              )}
            </p>
          </div>

          {/* Login Card */}
          <div className="card overflow-hidden bg-white border-border/70 shadow-xl shadow-slate-900/5 relative">
            {/* Top gradient highlight strip */}
            <div className="h-1 w-full bg-gradient-to-r from-tb-navy via-tb-blue to-tb-orange" />

            <div className="p-6">
              {step === "phone" ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tb-navy block uppercase tracking-wider">
                      Mobile number
                    </label>
                    <div className="flex items-stretch rounded-xl border-2 border-border focus-within:border-tb-blue focus-within:ring-4 focus-within:ring-blue-500/5 transition-all duration-200 bg-white overflow-hidden">
                      <span className="px-3.5 flex items-center gap-1.5 text-sm font-extrabold text-tb-navy border-r border-border bg-slate-50/50 shrink-0 select-none">
                        <span>🇮🇳</span> +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoFocus
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ""));
                          setError(null);
                        }}
                        className="flex-1 px-3.5 py-4 bg-transparent outline-none text-base font-bold tracking-widest text-tb-navy"
                      />
                      {validPhone && (
                        <span className="pr-3.5 flex items-center shrink-0">
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        </span>
                      )}
                    </div>
                    {error && (
                      <p className="text-xs text-red-600 flex items-center gap-1.5 pt-1 animate-fade-up">
                        <span className="size-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">!</span>
                        <span className="font-semibold">{error}</span>
                      </p>
                    )}
                  </div>

                  <button
                    disabled={!validPhone || busy}
                    className="btn-primary w-full text-base py-4 group shadow-md shadow-blue-500/10 active:scale-95"
                  >
                    {loading === "send" ? (
                      <>
                        <span className="spinner" /> Sending OTP…
                      </>
                    ) : (
                      <>
                        Send Verification OTP
                        <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed font-semibold">
                    By logging in you agree to our campaign guidelines, content requirements, and payout terms.
                  </p>
                </form>
              ) : (
                <form onSubmit={verify} className="space-y-5">
                  {/* OTP boxes grid */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-tb-navy block uppercase tracking-wider text-center sm:text-left">
                      Enter 6-digit OTP
                    </label>
                    <div className="flex gap-2 justify-center">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            refs.current[i] = el;
                          }}
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => handleOtp(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, i)}
                          onPaste={i === 0 ? handlePaste : undefined}
                          className={`
                            w-10 h-13 sm:w-11 sm:h-14 text-center text-lg sm:text-xl font-black rounded-xl border-2 outline-none
                            transition-all duration-300 scale-bounce
                            ${d
                              ? "border-tb-blue bg-blue-50/50 text-tb-navy scale-105 shadow-md shadow-blue-200/50 ring-2 ring-tb-blue/10 glow-blue"
                              : "border-border text-tb-navy bg-white focus:border-tb-blue focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:scale-110 focus:shadow-lg focus:shadow-blue-500/20 glow-blue"
                            }
                          `}
                        />
                      ))}
                    </div>
                    {error && (
                      <p className="text-xs text-red-600 text-center flex items-center justify-center gap-1.5 pt-1 animate-fade-up">
                        <span className="size-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">!</span>
                        <span className="font-semibold">{error}</span>
                      </p>
                    )}
                  </div>

                  {/* Dynamic Alert description box */}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                    <ShieldCheck className="size-4.5 mt-0.5 shrink-0 text-emerald-600 animate-pulse" />
                    <p className="text-xs leading-relaxed font-semibold">
                      OTP is valid for 10 minutes. Check your messages for the secure login code.
                    </p>
                  </div>

                  <button
                    disabled={!otpFilled || busy}
                    className="btn-primary w-full text-base py-4 group shadow-md shadow-blue-500/10 active:scale-95"
                  >
                    {loading === "verify" ? (
                      <>
                        <span className="spinner" /> Verifying OTP…
                      </>
                    ) : (
                      <>
                        Verify &amp; Enter Dashboard
                        <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  {/* Actions footer row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={goBack}
                      className="text-muted-foreground hover:text-tb-navy transition-colors font-bold flex items-center gap-1"
                    >
                      <ChevronLeft className="size-4" /> Change number
                    </button>
                    {resend > 0 ? (
                      <span className="text-muted-foreground font-bold tabular-nums">
                        Resend in <span className="text-tb-navy">{resend}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleResend}
                        className="text-tb-blue font-bold flex items-center gap-1 disabled:opacity-60 hover:underline"
                      >
                        {loading === "send" ? (
                          <span className="spinner" />
                        ) : (
                          <RefreshCw className="size-3" />
                        )}{" "}
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Footer trust row */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Lock className="size-3.5 text-emerald-500" /> 256-bit secure
            </span>
            <span className="size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1">
              <Star className="size-3.5 text-amber-400 fill-amber-400" /> 12K+ creators
            </span>
            <span className="size-1 rounded-full bg-border" />
            <a
              className="text-tb-blue hover:underline"
              href="mailto:support@testbook.com"
            >
              Help
            </a>
          </div>

          {/* Floating dynamic incentive indicator */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-border/80 shadow-sm text-xs text-muted-foreground font-semibold">
              <Sparkles className="size-3.5 text-tb-blue" />
              <span>Average payout <span className="font-extrabold text-tb-navy">₹11,200</span> per creator</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StepDot({
  n,
  active,
  done,
  label,
}: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <div
        className={`size-7 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-sm ${
          done
            ? "tb-gradient text-white shadow-blue-200"
            : active
              ? "border-2 border-tb-blue text-tb-blue bg-white shadow-blue-100 scale-105"
              : "border-2 border-border text-muted-foreground bg-white"
        }`}
      >
        {done ? <CheckCircle2 className="size-3.5" /> : n}
      </div>
      <span
        className={`text-xs font-extrabold ${active ? "text-tb-navy" : "text-muted-foreground"} hidden xs:inline`}
      >
        {label}
      </span>
    </div>
  );
}
