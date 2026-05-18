/**
 * GET /api/fetch-upi?phone=...&userId=...
 *
 * Queries Apps Script for the creator's stored UPI ID via the ?type=status endpoint,
 * then extracts upi from the submission's payout record.
 */

import { createFileRoute } from "@tanstack/react-router";
import { APPS_SCRIPT_URL } from "@/lib/lms";

const APPS_SCRIPT_TOKEN = "TB_UGC_SECRET_2025";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/fetch-upi")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request }) => {
        const url    = new URL(request.url);
        const phone  = (url.searchParams.get("phone")  ?? "").replace(/\D/g, "");
        const userId = url.searchParams.get("userId") ?? phone;

        if (!phone) {
          return new Response(JSON.stringify({ phone, userId, upi: null }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        }

        try {
          const upstream = await fetch(
            `${APPS_SCRIPT_URL}?type=status&token=${encodeURIComponent(APPS_SCRIPT_TOKEN)}&phone=${encodeURIComponent(phone)}&userId=${encodeURIComponent(userId)}`,
            { redirect: "follow" },
          );
          const data = await upstream.json() as {
            success?: boolean;
            submission?: { payout?: { upi?: string } } | null;
          };

          const upi = data?.submission?.payout?.upi ?? null;
          return new Response(JSON.stringify({ phone, userId, upi }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        } catch {
          return new Response(JSON.stringify({ phone, userId, upi: null }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
