/**
 * POST /api/submit
 *
 * Receives the full creator submission payload (including cdnUrl from /api/upload-lms).
 * Forwards to Apps Script in the exact { type: "submit", token, ... } format it expects,
 * then emits one final sync outcome event.
 */

import { createFileRoute } from "@tanstack/react-router";
import { APPS_SCRIPT_URL, EVENT, fireEvent } from "@/lib/lms";

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

export const Route = createFileRoute("/api/submit")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;

          const submissionId = String(body.id       ?? "");
          const creatorPhone = String(body.phone    ?? "");
          const meta         = { creatorPhone, submissionId };

          /* ── Build the Apps Script submit payload ─────────────── */
          const appsScriptPayload = {
            type:         "submit",
            token:        APPS_SCRIPT_TOKEN,
            name:         String(body.fullName     ?? ""),
            phone:        creatorPhone,
            userId:       creatorPhone,
            email:        String(body.email        ?? ""),
            upi:          String(body.upi          ?? ""),
            examCategory: String(body.examCategory ?? ""),
            platform:     String(body.platform     ?? ""),
            videoLink:    String(body.cdnUrl ?? body.videoUrl ?? ""),
            socialHandle: String(body.socialHandle ?? ""),
            caption:      String(body.caption      ?? "").slice(0, 500),
            followers:    String(body.followers    ?? ""),
            upiConfirm:   !!(body.upi),
            consent:      body.consent === true,
            metadata: {
              submissionId,
              videoFileName: body.videoFileName ?? null,
              videoFileSize: body.videoFileSize ?? null,
            },
          };

          /* ── Forward to Apps Script ───────────────────────────── */
          const upstream = await fetch(APPS_SCRIPT_URL, {
            method:   "POST",
            headers:  { "Content-Type": "application/json" },
            body:     JSON.stringify(appsScriptPayload),
            redirect: "follow",
          }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) } as unknown as Response));

          let upstreamText = "";
          try { upstreamText = await upstream.text(); } catch { /* ignore */ }

          let upstreamData: Record<string, unknown> = {};
          try { upstreamData = JSON.parse(upstreamText); } catch { /* ignore */ }

          /* ── Internal event ───────────────────────────────────── */
          await fireEvent(
            upstream.ok
              ? EVENT.SUBMISSION_SYNC_COMPLETED
              : EVENT.SUBMISSION_SYNC_FAILED,
            {
              submissionId,
              upstreamStatus: upstream.status,
              appsScriptId:   upstreamData.submissionId ?? null,
            },
            meta,
          );

          return json({
            ok:             upstream.ok,
            forwarded:      upstream.ok,
            upstreamStatus: upstream.status,
            appsScriptId:   upstreamData.submissionId ?? null,
          });

        } catch (err) {
          return json({ ok: false, error: String(err) }, 400);
        }
      },
    },
  },
});
