import { createFileRoute } from "@tanstack/react-router";
import { lmsGetStudentProfileByPhone } from "@/lib/lms";
import { testbookVerifyOtp } from "@/lib/testbook-otp";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

export const Route = createFileRoute("/api/auth/verify-otp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            phone?: string;
            otp?: string;
          };
          const result = await testbookVerifyOtp(
            String(body.phone ?? ""),
            String(body.otp ?? ""),
          );

          if (!result.ok) return json(result, result.status || 401);

          try {
            const profile = await lmsGetStudentProfileByPhone(String(body.phone ?? ""));
            return json({
              ...result,
              userId: result.userId ?? profile.studentId ?? undefined,
              studentId: result.studentId ?? profile.studentId ?? undefined,
              name: profile.name ?? undefined,
            });
          } catch {
            return json(result);
          }
        } catch (err) {
          return json(
            {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            },
            400,
          );
        }
      },
    },
  },
});
