import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight, Wallet, CheckCircle2, AlertCircle, Loader2, Instagram,
  Youtube, Facebook, Sparkles, ExternalLink,
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

const exams = ["SSC / Govt", "Banking", "Railways", "NEET / Medical", "JEE / Engineering", "UPSC / Civils", "Teaching", "State PSC", "CAT / MBA", "Other"];
const platforms = [
  { id: "instagram", label: "Instagram Reel", Icon: Instagram },
  { id: "youtube",   label: "YouTube Short",  Icon: Youtube },
  { id: "facebook",  label: "Facebook Reel",  Icon: Facebook },
] as const;

type UpiState = { loading: boolean; upi: string | null; error: string | null };

function SubmitPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [upiState, setUpiState] = useState<UpiState>({ loading: true, upi: null, error: null });
  const [form, setForm] = useState({
    fullName: "", email: "", upi: "",
    examCategory: exams[0],
    platform: "instagram" as TBSubmission["platform"],
    followers: "", videoUrl: "", caption: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
      .catch(() => setUpiState({ loading: false, upi: null, error: "Couldn't reach UPI service" }));
  }, []);

  const isUrl = (s: string) => /^https?:\/\/.+/i.test(s);
  const isUpi = (s: string) => /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(s);
  const valid =
    form.fullName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    isUpi(form.upi) &&
    form.followers.trim() !== "" &&
    isUrl(form.videoUrl) &&
    form.caption.trim().length >= 20 &&
    form.consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    const submission: TBSubmission = {
      id: "tb_" + Math.random().toString(36).slice(2, 10),
      ...form,
      phone,
      status: "submitted",
      views: 0, likes: 0, comments: 0, payoutInr: 0,
      createdAt: Date.now(),
      history: [{ status: "submitted", at: Date.now() }],
    };
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
    } catch {/* non-blocking — still save locally */}
    saveSubmission(submission);
    setSubmitting(false);
    setDone(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  };

  if (done) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="card p-8 max-w-md w-full text-center fade-up">
          <div className="size-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-tb-navy">Submitted!</h2>
          <p className="mt-2 text-sm text-muted-foreground">Our team is reviewing your video. Redirecting to your dashboard…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-14">
      <div className="fade-up">
        <span className="badge"><Sparkles className="size-3.5" /> New submission</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-tb-navy">Submit your video</h1>
        <p className="mt-2 text-muted-foreground">Approval lands in your dashboard within 24 hours.</p>
      </div>

      {/* UPI banner */}
      <div className={`mt-6 card p-4 flex items-start gap-3 fade-up ${
        upiState.loading ? "" : upiState.upi ? "!border-emerald-200 bg-emerald-50/40" : "!border-amber-200 bg-amber-50/50"
      }`}>
        <div className={`size-9 rounded-xl flex items-center justify-center ${
          upiState.loading ? "bg-secondary" : upiState.upi ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}>
          {upiState.loading ? <Loader2 className="size-5 animate-spin" /> :
            upiState.upi ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
        </div>
        <div className="flex-1">
          {upiState.loading ? (
            <div className="text-sm font-medium text-tb-navy">Checking UPI on file…</div>
          ) : upiState.upi ? (
            <>
              <div className="text-sm font-semibold text-emerald-800">UPI on file: {upiState.upi}</div>
              <div className="text-xs text-emerald-700/80">Payouts will go here. Update below if you want a different ID.</div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-amber-900">No UPI linked yet</div>
              <div className="text-xs text-amber-800/80">Add your UPI below — payouts won't be sent without it.</div>
            </>
          )}
        </div>
        <Wallet className="size-5 text-muted-foreground hidden sm:block" />
      </div>

      <form onSubmit={submit} className="mt-6 card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <input className="input-field" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Phone (verified)">
            <input className="input-field bg-secondary" disabled value={`+91 ${phone}`} />
          </Field>
          <Field label="Email">
            <input type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="UPI ID" hint="e.g. yourname@okhdfc">
            <input className="input-field" required placeholder="name@upi" value={form.upi} onChange={(e) => setForm({ ...form, upi: e.target.value })} />
          </Field>
          <Field label="Exam category">
            <select className="input-field" value={form.examCategory} onChange={(e) => setForm({ ...form, examCategory: e.target.value })}>
              {exams.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Followers">
            <input className="input-field" required placeholder="e.g. 2400" value={form.followers}
              onChange={(e) => setForm({ ...form, followers: e.target.value.replace(/[^\d]/g, "") })} />
          </Field>
        </div>

        <Field label="Platform">
          <div className="grid grid-cols-3 gap-2">
            {platforms.map(({ id, label, Icon }) => {
              const active = form.platform === id;
              return (
                <button type="button" key={id}
                  onClick={() => setForm({ ...form, platform: id })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
                    active ? "border-tb-blue bg-blue-50 text-tb-blue" : "border-border hover:border-tb-blue/50"
                  }`}>
                  <Icon className="size-4" /> {label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Public video URL" hint="Paste the public link to your reel/short">
          <input className="input-field" required placeholder="https://instagram.com/reel/..." value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </Field>

        <Field label="Caption used on the post" hint="Min 20 characters · include #TestbookPass">
          <textarea rows={4} className="input-field resize-none" required value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        </Field>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 size-4 accent-tb-blue" checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
          <span className="text-sm text-muted-foreground">
            I confirm this is my original content, follows the <Link to="/sop" className="text-tb-blue font-medium">Creator SOP</Link>, and I consent to Testbook resharing it on its official channels.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button disabled={!valid || submitting} className="btn-primary w-full sm:w-auto">
            {submitting ? <span className="spinner" /> : <>Submit for review <ArrowRight className="size-4" /></>}
          </button>
          <Link to="/sop" className="text-sm text-muted-foreground hover:text-tb-blue inline-flex items-center gap-1">
            Re-read the SOP <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </form>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-tb-navy">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
