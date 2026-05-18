import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Phone, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { getUser, setUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Testbook Creator Lab" },
      { name: "description", content: "Login with your phone number and OTP to start submitting videos and tracking payouts." },
      { property: "og:title", content: "Login — Testbook Creator Lab" },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (getUser()) navigate({ to: "/dashboard" });
  }, [navigate]);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validPhone) { setError("Enter a valid 10-digit Indian mobile number."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setStep("otp");
    setInfo("Demo OTP: enter 1234 to login · 0000 = unregistered");
  };

  const handleOtp = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 3) refs.current[i + 1]?.focus();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otp.join("");
    if (code.length !== 4) { setError("Enter the 4-digit OTP."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    if (code === "1234") {
      setUser({ phone, loggedInAt: Date.now() });
      navigate({ to: "/dashboard" });
    } else if (code === "0000") {
      setError("This number isn't registered for the campaign yet. Please use a different number.");
    } else {
      setError("Incorrect OTP. Try 1234 (demo).");
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-6">
          <div className="size-12 rounded-2xl tb-gradient mx-auto flex items-center justify-center shadow-lg">
            <Sparkles className="size-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl md:text-3xl font-bold text-tb-navy">Welcome to Creator Lab</h1>
          <p className="mt-2 text-sm text-muted-foreground">Login with your phone to submit videos and track UPI payouts.</p>
        </div>

        <div className="card p-6">
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-tb-navy">Mobile number</span>
                <div className="mt-1.5 flex items-stretch rounded-xl border border-border bg-white focus-within:border-tb-blue focus-within:ring-4 focus-within:ring-blue-500/10 transition">
                  <span className="px-3 flex items-center gap-1 text-sm text-muted-foreground border-r border-border">
                    <Phone className="size-4" /> +91
                  </span>
                  <input
                    type="tel" inputMode="numeric" autoFocus
                    maxLength={10} placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-3 py-3 bg-transparent outline-none text-base"
                  />
                </div>
              </label>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button disabled={!validPhone || loading} className="btn-primary w-full">
                {loading ? <span className="spinner" /> : <>Send OTP <ArrowRight className="size-4" /></>}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                By continuing you agree to the campaign terms & content policy.
              </p>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="text-sm">
                <div className="text-muted-foreground">OTP sent to</div>
                <div className="font-semibold text-tb-navy">+91 {phone}</div>
                <button type="button" onClick={() => { setStep("phone"); setOtp(["","","",""]); setError(null); setInfo(null); }} className="text-tb-blue text-xs font-medium mt-1">Change number</button>
              </div>
              <div className="flex gap-2 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={(e) => handleOtp(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
                    className="otp-box"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {info && (
                <div className="text-xs flex items-start gap-2 p-3 rounded-xl bg-blue-50 text-tb-blue border border-blue-100">
                  <ShieldCheck className="size-4 mt-0.5 shrink-0" /> {info}
                </div>
              )}
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button disabled={loading} className="btn-primary w-full">
                {loading ? <span className="spinner" /> : <>Verify & continue <ArrowRight className="size-4" /></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-5">
          Trouble logging in? Email <a className="text-tb-blue font-medium" href="mailto:creators@testbook.com">creators@testbook.com</a>
        </p>
      </div>
    </section>
  );
}
