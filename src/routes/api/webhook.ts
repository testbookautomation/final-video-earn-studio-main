/**
 * POST /api/webhook
 *
 * Receives inbound webhook events from external systems (Apps Script, ops tools, etc.).
 * Logs every event with its name, timestamp, and payload for observability.
 *
 * Expected body shape:
 * {
 *   event:        string;     — e.g. "creator.submission.status_updated"
 *   timestamp:    number;     — Unix ms
 *   creatorPhone?: string;
 *   submissionId?: string;
 *   data:         object;
 * }
 */

import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

export const Route = createFileRoute("/api/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;

          const eventName    = String(body.event     ?? "unknown");
          const timestamp    = body.timestamp ?? Date.now();
          const submissionId = body.submissionId ?? null;
          const creatorPhone = body.creatorPhone  ?? null;

          console.log(
            `[webhook] event="${eventName}"`,
            submissionId ? `submissionId="${submissionId}"` : "",
            creatorPhone ? `phone="${creatorPhone}"` : "",
            `timestamp=${timestamp}`,
            "data=", JSON.stringify(body.data ?? {}).slice(0, 600),
          );

          return json({
            ok:          true,
            event:       eventName,
            receivedAt:  Date.now(),
          });

        } catch (err) {
          return json({ ok: false, error: String(err) }, 400);
        }
      },
    },
  },
});
