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
      { title: "Login — Testbook Creator Lab" },
      {
        name: "description",
        content:
          "Login with your phone number and OTP to start submitting videos and tracking payouts.",
      },
      { property: "og:title", content: "Login — Testbook Creator Lab" },
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
  "Earn ₹500 – ₹25,000 directly to your UPI",
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
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] tb-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* dot grid */}
        <div className="absolute inset-0 dot-grid opacity-25" />
        {/* glow orbs */}
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-indigo-700/20 blur-3xl" />

        <div className="relative">
          <img
            src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
            alt="Testbook"
            className="h-8 w-auto"
          />
          <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/50">
            Creator Lab
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              Create the video.
              <br />
              Send it to Testbook.
              <br />
              <span className="tb-text-gradient">Get paid in UPI.</span>
            </h2>
            <p className="mt-4 text-white/70 text-base max-w-sm leading-relaxed">
              Upload your finished file to Creator Lab. Testbook publishes
              approved videos and tracks real view milestones.
            </p>
          </div>

          <ul className="space-y-3">
            {perks.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-sm text-white/85"
              >
                <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-3">
            {stats.map(({ Icon, k, v }) => (
              <div key={k} className="glass p-4 rounded-2xl text-center">
                <Icon className="size-4 text-tb-blue-light mx-auto" />
                <div className="mt-2 text-xl font-black text-white">{k}</div>
                <div className="text-[10px] text-white/60 mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                P
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  Priya S. · SSC CGL
                </div>
                <div className="text-xs text-white/60">
                  6.2L views · Earned ₹18,400
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/80 italic leading-relaxed">
              "Uploaded my first video on a Monday. Testbook approved it by
              Wednesday and UPI hit on Friday."
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 bg-gradient-to-b from-blue-50/60 to-white relative overflow-hidden">
        {/* Subtle background orbs */}
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-10 size-48 rounded-full bg-indigo-100/40 blur-2xl pointer-events-none" />

        <div className="w-full max-w-sm fade-up relative">

          {/* Mobile hero (hidden on desktop) */}
          <div className="lg:hidden mb-8">
            <div className="tb-gradient rounded-2xl p-5 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 dot-grid opacity-20" />
              <div className="relative">
                <img
                  src="https://cdn.testbook.com/1761306364299-testbook-white.png/1761306366.png"
                  alt="Testbook"
                  className="h-6 w-auto mx-auto mb-3 opacity-90"
                />
                <p className="text-sm font-semibold text-white/90 leading-relaxed">
                  Share your story. Earn up to <span className="text-yellow-300 font-black">₹25,000</span> via UPI.
                </p>
                <div className="flex justify-center gap-4 mt-3">
                  {stats.map(({ k, v }) => (
                    <div key={k} className="text-center">
                      <div className="text-base font-black">{k}</div>
                      <div className="text-[10px] text-white/60">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-border shadow-sm text-[11px] text-muted-foreground font-medium">
              <Lock className="size-3 text-emerald-500" />
              OTP verified · Secure login
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <StepDot
              n={1}
              active={step === "phone"}
              done={step === "otp"}
              label="Phone"
            />
            <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-border">
              <div
                className="h-full tb-gradient transition-all duration-500"
                style={{ width: step === "otp" ? "100%" : "0%" }}
              />
            </div>
            <StepDot
              n={2}
              active={step === "otp"}
              done={false}
              label="Verify"
            />
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-2xl font-black text-tb-navy flex items-center gap-2">
              {step === "phone" ? (
                <><Phone className="size-5 text-tb-blue" /> Enter your number</>
              ) : (
                <><ShieldCheck className="size-5 text-emerald-500" /> Verify your number</>
              )}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {step === "phone" ? (
                "We'll send a 6-digit OTP to your mobile number to confirm your identity."
              ) : (
                <>
                  OTP sent to{" "}
                  <span className="font-bold text-tb-navy">+91 {phone}</span>.
                  Enter it below to continue.
                </>
              )}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-white shadow-xl shadow-blue-900/5 overflow-hidden">
            {/* Gradient top accent */}
            <div className="h-1 w-full tb-gradient" />

            <div className="p-6">
              {step === "phone" ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-tb-navy block mb-1.5">
                      Mobile number
                    </label>
                    <div className="flex items-stretch rounded-xl border border-border bg-white overflow-hidden focus-within:border-tb-blue focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <span className="px-3 flex items-center gap-1.5 text-sm font-semibold text-tb-navy border-r border-border bg-blue-50/60 shrink-0">
                        <span className="text-base">🇮🇳</span> +91
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
                        className="flex-1 px-3 py-3.5 bg-transparent outline-none text-base font-medium tracking-widest"
                      />
                      {validPhone && (
                        <span className="pr-3 flex items-center">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        </span>
                      )}
                    </div>
                    {error && (
                      <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <span className="size-3 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">!</span>
                        {error}
                      </p>
                    )}
                  </div>

                  <button
                    disabled={!validPhone || busy}
                    className="btn-primary w-full text-base py-3.5 group"
                  >
                    {loading === "send" ? (
                      <>
                        <span className="spinner" /> Sending…
                      </>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    By continuing you agree to our campaign terms &amp; content
                    policy.
                  </p>
                </form>
              ) : (
                <form onSubmit={verify} className="space-y-5">
                  {/* OTP boxes */}
                  <div>
                    <label className="text-sm font-semibold text-tb-navy block mb-3">
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
                            w-11 h-13 sm:w-12 text-center text-xl font-black rounded-xl border-2 outline-none
                            transition-all duration-150 bg-blue-50/40
                            ${d
                              ? "border-tb-blue bg-blue-50 text-tb-navy scale-105 shadow-sm shadow-blue-200"
                              : "border-border text-tb-navy focus:border-tb-blue focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            }
                          `}
                          style={{ height: "52px" }}
                        />
                      ))}
                    </div>
                    {error && (
                      <p className="mt-3 text-xs text-red-600 text-center flex items-center justify-center gap-1">
                        <span className="size-3 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">!</span>
                        {error}
                      </p>
                    )}
                  </div>

                  {/* OTP hint */}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                    <ShieldCheck className="size-4 mt-0.5 shrink-0 text-emerald-600" />
                    <p className="text-xs leading-relaxed">
                      Enter the 6-digit OTP sent to <span className="font-bold">+91 {phone}</span>. Valid for 10 minutes.
                    </p>
                  </div>

                  <button
                    disabled={!otpFilled || busy}
                    className="btn-primary w-full text-base py-3.5 group"
                  >
                    {loading === "verify" ? (
                      <>
                        <span className="spinner" /> Verifying…
                      </>
                    ) : (
                      <>
                        Verify &amp; continue
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={goBack}
                      className="text-muted-foreground hover:text-tb-navy transition-colors font-medium"
                    >
                      ← Change number
                    </button>
                    {resend > 0 ? (
                      <span className="text-muted-foreground tabular-nums">
                        Resend in <span className="font-semibold text-tb-navy">{resend}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleResend}
                        className="text-tb-blue font-semibold flex items-center gap-1 disabled:opacity-60 hover:underline"
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
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Lock className="size-3 text-emerald-500" /> 256-bit secure
            </span>
            <span className="size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1">
              <Star className="size-3 text-amber-400 fill-amber-400" /> 12K+ creators
            </span>
            <span className="size-1 rounded-full bg-border" />
            <a
              className="text-tb-blue font-medium hover:underline"
              href="mailto:creators@testbook.com"
            >
              Help
            </a>
          </div>

          {/* Floating social proof pill */}
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border shadow-sm text-xs text-muted-foreground">
              <Sparkles className="size-3 text-tb-blue" />
              <span>Avg. payout <span className="font-bold text-tb-navy">₹11,200</span> per creator</span>
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
    <div className="flex items-center gap-1.5">
      <div
        className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
          done
            ? "tb-gradient text-white shadow-blue-200"
            : active
              ? "border-2 border-tb-blue text-tb-blue bg-white shadow-blue-100"
              : "border-2 border-border text-muted-foreground bg-white"
        }`}
      >
        {done ? <CheckCircle2 className="size-4" /> : n}
      </div>
      <span
        className={`text-xs font-semibold ${active ? "text-tb-navy" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}
