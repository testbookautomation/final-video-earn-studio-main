/**
 * GET /api/sync-status?phone=...
 * Fetches the real submission status from Apps Script and returns it
 * so the creator dashboard reflects admin actions in the Google Sheet.
 */

import { createFileRoute } from "@tanstack/react-router";
import { APPS_SCRIPT_URL } from "@/lib/lms";
import type { SubmissionStatus } from "@/lib/auth";

const TOKEN = "TB_UGC_SECRET_2025";

function mapStatus(raw: string): SubmissionStatus {
  switch (raw.toLowerCase().replace(/[\s-]/g, "_")) {
    case "approved":          return "approved";
    case "rejected":          return "rejected";
    case "live":              return "live";
    case "milestone_reached": return "milestone_reached";
    case "paid":              return "paid";
    case "under_review":      return "under_review";
    default:                  return "submitted";
  }
}

export const Route = createFileRoute("/api/sync-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url    = new URL(request.url);
        const phone  = (url.searchParams.get("phone")  ?? "").replace(/\D/g, "").slice(-10);
        const userId = (url.searchParams.get("userId") ?? "").trim();

        if (!phone && !userId) {
          return new Response(JSON.stringify({ ok: false, error: "phone or userId required" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const qs = new URLSearchParams({
            type:   "status",
            token:  TOKEN,
            ...(phone  ? { phone }  : {}),
            ...(userId ? { userId } : {}),
          });
          const res = await fetch(
            `${APPS_SCRIPT_URL}?${qs.toString()}`,
            { redirect: "follow" },
          );
          const data = await res.json() as {
            success?: boolean;
            submission?: {
              status?: string;
              rejectionReason?: string;
              metrics?: { views?: number; likes?: number; comments?: number };
              payout?: {
                upi?: string;
                eligibility?: string;
                amount?: number;
                status?: string;
              };
            } | null;
          };

          if (!data.success || !data.submission) {
            return new Response(JSON.stringify({ ok: true, found: false }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const s = data.submission;
          return new Response(JSON.stringify({
            ok: true,
            found: true,
            status:            mapStatus(s.status ?? ""),
            rejectionReason:   s.rejectionReason ?? "",
            views:             s.metrics?.views    ?? 0,
            likes:             s.metrics?.likes    ?? 0,
            comments:          s.metrics?.comments ?? 0,
            payoutInr:         s.payout?.amount    ?? 0,
            payoutStatus:      s.payout?.status    ?? "",
            payoutEligibility: s.payout?.eligibility ?? "",
            upi:               s.payout?.upi       ?? "",
          }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "upstream_error" }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
