/**
 * GET /api/fetch-upi?phone=...&userId=...
 *
 * Queries LMS for the student's VPA, then falls back to Apps Script for older
 * creator submissions that only have payout.upi stored there.
 */

import { createFileRoute } from "@tanstack/react-router";
import { APPS_SCRIPT_URL, lmsGetStudentProfileByPhone } from "@/lib/lms";

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
        const debug  = url.searchParams.get("debug") === "1";
        let lmsError: string | null = null;
        let lmsName: string | null = null;
        let lmsStudentId: string | null = null;
        let lmsMobile: string | null = null;

        if (!phone) {
          return new Response(JSON.stringify({ phone, userId, upi: null }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        }

        try {
          const lms = await lmsGetStudentProfileByPhone(phone);
          lmsName = lms.name;
          lmsStudentId = lms.studentId;
          lmsMobile = lms.mobile;
          if (lms.vpa) {
            return new Response(JSON.stringify({
              phone,
              userId,
              upi: lms.vpa,
              name: lms.name,
              source: "lms",
              studentId: lms.studentId,
              mobile: lms.mobile,
            }), {
              status: 200, headers: { "Content-Type": "application/json", ...cors },
            });
          }
        } catch (err) {
          lmsError = String(err);
          // Fall through to Apps Script so a temporary LMS issue does not block the form.
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
          return new Response(JSON.stringify({
            phone,
            userId,
            upi,
            name: lmsName,
            source: upi ? "apps_script" : null,
            studentId: lmsStudentId,
            mobile: lmsMobile,
            ...(debug ? { lmsError } : {}),
          }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        } catch {
          return new Response(JSON.stringify({
            phone,
            userId,
            upi: null,
            name: lmsName,
            source: null,
            studentId: lmsStudentId,
            mobile: lmsMobile,
            ...(debug ? { lmsError } : {}),
          }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
