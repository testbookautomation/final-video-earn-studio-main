import { createFileRoute } from "@tanstack/react-router";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBm0a1BSio88QWXaYz-5Xc0XTc8gDdxH4HFaEow1N4HNsWpRriD6jCGhz1ORHxDXsu/exec";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/submit")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          // Forward to Apps Script webhook (fire-and-don't-block on failure).
          const upstream = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "submission", payload: body, receivedAt: Date.now() }),
            redirect: "follow",
          }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) } as Response));
          let responseText = "";
          try { responseText = await upstream.text(); } catch {}
          return new Response(JSON.stringify({
            ok: upstream.ok,
            forwarded: !!upstream.ok,
            upstreamStatus: upstream.status,
            upstream: responseText.slice(0, 500),
          }), { status: 200, headers: { "Content-Type": "application/json", ...cors } });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 400, headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
