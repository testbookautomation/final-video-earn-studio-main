/**
 * POST /api/submit
 *
 * Receives the full creator submission payload (including cdnUrl from /api/upload-lms).
 * Fires webhook events and forwards to Apps Script.
 *
 * Events fired:
 *   creator.submission.created
 *   creator.submission.forwarded_to_apps_script
 *   creator.submission.apps_script_accepted
 *   creator.submission.apps_script_failed
 */

import { createFileRoute } from "@tanstack/react-router";
import { EVENT, WEBHOOK_URL, fireEvent } from "@/lib/lms";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzBm0a1BSio88QWXaYz-5Xc0XTc8gDdxH4HFaEow1N4HNsWpRriD6jCGhz1ORHxDXsu/exec";

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

export const Route = createFileRoute("/api/submit")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;

          const submissionId  = String(body.id       ?? "");
          const creatorPhone  = String(body.phone    ?? "");
          const meta          = { creatorPhone, submissionId };

          /* ── creator.submission.created ──────────────────────────── */
          await fireEvent(EVENT.CREATOR_SUBMISSION_CREATED, {
            submissionId,
            fullName:       body.fullName,
            phone:          creatorPhone,
            email:          body.email,
            upi:            body.upi,
            examCategory:   body.examCategory,
            platform:       body.platform,
            followers:      body.followers,
            caption:        typeof body.caption === "string" ? body.caption.slice(0, 300) : "",
            cdnUrl:         body.cdnUrl     ?? null,
            videoFileName:  body.videoFileName ?? null,
            videoFileSize:  body.videoFileSize ?? null,
            hasCdnVideo:    !!(body.cdnUrl),
            createdAt:      body.createdAt  ?? Date.now(),
          }, meta);

          /* ── Forward full payload to Apps Script ─────────────────── */
          await fireEvent(EVENT.CREATOR_SUBMISSION_FORWARDED_TO_APPS_SCRIPT, {
            submissionId,
            destination: "apps_script",
            message: "Forwarding submission payload to Apps Script webhook.",
          }, meta);

          const upstream = await fetch(APPS_SCRIPT_URL, {
            method:   "POST",
            headers:  { "Content-Type": "application/json" },
            body:     JSON.stringify({ type: "submission", payload: body, receivedAt: Date.now() }),
            redirect: "follow",
          }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) } as unknown as Response));

          let upstreamText = "";
          try { upstreamText = await upstream.text(); } catch { /* ignore */ }

          if (upstream.ok) {
            await fireEvent(EVENT.CREATOR_SUBMISSION_APPS_SCRIPT_ACCEPTED, {
              submissionId,
              upstreamStatus: upstream.status,
              message: "Apps Script acknowledged the submission successfully.",
            }, meta);
          } else {
            await fireEvent(EVENT.CREATOR_SUBMISSION_APPS_SCRIPT_FAILED, {
              submissionId,
              upstreamStatus: upstream.status,
              upstreamBody:   upstreamText.slice(0, 500),
              message: "Apps Script returned a non-success response.",
            }, meta);
          }

          return json({
            ok:             upstream.ok,
            forwarded:      upstream.ok,
            upstreamStatus: upstream.status,
            upstream:       upstreamText.slice(0, 500),
          });

        } catch (err) {
          return json({ ok: false, error: String(err) }, 400);
        }
      },
    },
  },
});
