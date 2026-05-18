// Client-side event tracker — fire-and-forget, never throws.
// Sends events to /api/track which forwards them to Apps Script.

import { isBrowser, getOrCreateUserSession, getUser } from "@/lib/auth";

type TrackOptions = {
  page?:     string;
  platform?: string;
  payload?:  Record<string, unknown>;
};

const allowedEvents = new Set([
  "UGC_creators_auth_otp_requested",
  "UGC_creators_auth_login_completed",
  "UGC_creators_video_file_selected",
  "UGC_creators_submission_submit_clicked",
  "UGC_creators_video_review_started",
  "UGC_creators_video_approved",
  "UGC_creators_video_rejected",
  "UGC_creators_video_live",
  "UGC_creators_video_milestone_reached",
  "UGC_creators_payment_eligible",
  "UGC_creators_payment_initiated",
  "UGC_creators_payment_completed",
  "UGC_creators_payment_failed",
]);

export function track(eventName: string, opts: TrackOptions = {}): void {
  if (!isBrowser()) return;
  if (!allowedEvents.has(eventName)) return;

  const user = getUser();
  const session = getOrCreateUserSession();
  const body = {
    eventName,
    sessionId: user?.sessionId ?? session?.id ?? "",
    userId:   user?.userId ?? user?.phone ?? session?.userId ?? "",
    phone:    user?.phone ?? session?.phone ?? "",
    page:     opts.page     ?? window.location.pathname,
    platform: opts.platform ?? "",
    payload:  opts.payload  ?? {},
  };
  fetch("/api/track", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  }).catch(() => {});
}
