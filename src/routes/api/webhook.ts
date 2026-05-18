import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
};

// Receives status / payout updates from Apps Script or internal ops.
// In production: validate signature, persist to DB, notify the creator.
export const Route = createFileRoute("/api/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("[tb-webhook]", JSON.stringify(body).slice(0, 800));
          return new Response(JSON.stringify({ ok: true, receivedAt: Date.now() }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 400, headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
