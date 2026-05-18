import { createFileRoute } from "@tanstack/react-router";
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
          return json(result, result.ok ? 200 : result.status || 401);
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
