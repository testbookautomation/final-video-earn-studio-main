/**
 * POST /api/track
 *
 * Receives client-side events and forwards them to Apps Script Events sheet.
 * Fire-and-forget on the Apps Script side — always returns 200 immediately.
 *
 * Body: { eventName, userId, phone, page, platform, payload }
 */

import { createFileRoute } from "@tanstack/react-router";
import { APPS_SCRIPT_URL } from "@/lib/lms";

const APPS_SCRIPT_TOKEN = "TB_UGC_SECRET_2025";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

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

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;
          const eventName = String(body.eventName ?? "");

          if (!allowedEvents.has(eventName)) {
            return json({ ok: true, skipped: true });
          }

          // Forward to Apps Script in the format it expects
          fetch(APPS_SCRIPT_URL, {
            method:   "POST",
            headers:  { "Content-Type": "application/json" },
            body:     JSON.stringify({
              type:      "event",
              token:     APPS_SCRIPT_TOKEN,
              eventName,
              userId:    String(body.userId    ?? ""),
              phone:     String(body.phone     ?? ""),
              page:      String(body.page      ?? ""),
              platform:  String(body.platform  ?? ""),
              payload:   body.payload ?? {},
            }),
            redirect: "follow",
          }).catch(() => {});

          return json({ ok: true });
        } catch {
          return json({ ok: false }, 400);
        }
      },
    },
  },
});
