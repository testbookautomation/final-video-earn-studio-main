// Client-side event tracker — fire-and-forget, never throws.
// Sends events to /api/track which forwards them to Apps Script.

import { isBrowser, getUser } from "@/lib/auth";

type TrackOptions = {
  page?:     string;
  platform?: string;
  payload?:  Record<string, unknown>;
};

const allowedEvents = new Set([
  "creator.auth.otp_requested",
  "creator.auth.login_completed",
  "creator.video.file_selected",
  "creator.submission.submit_clicked",
]);

export function track(eventName: string, opts: TrackOptions = {}): void {
  if (!isBrowser()) return;
  if (!allowedEvents.has(eventName)) return;

  const user = getUser();
  const body = {
    eventName,
    userId:   user?.phone ?? "",
    phone:    user?.phone ?? "",
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
