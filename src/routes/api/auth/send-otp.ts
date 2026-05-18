import { createFileRoute } from "@tanstack/react-router";
import { testbookSendOtp } from "@/lib/testbook-otp";

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

export const Route = createFileRoute("/api/auth/send-otp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            phone?: string;
            resend?: boolean;
          };
          const result = await testbookSendOtp(
            String(body.phone ?? ""),
            body.resend === true,
          );
          return json(result, result.ok ? 200 : result.status || 502);
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
