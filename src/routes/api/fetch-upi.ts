import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Stubbed UPI registry. In prod this would query a database / partner API.
// Returns a deterministic-looking UPI for "demo" phones, null otherwise.
export const Route = createFileRoute("/api/fetch-upi")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const phone = (url.searchParams.get("phone") ?? "").replace(/\D/g, "");
        const userId = url.searchParams.get("userId") ?? phone;
        // Demo rule: phones ending in even digit have a UPI on file
        const lastDigit = Number(phone.slice(-1) || "1");
        const upi = phone && lastDigit % 2 === 0
          ? `creator${phone.slice(-4)}@okhdfc`
          : null;
        return new Response(JSON.stringify({ phone, userId, upi }), {
          status: 200, headers: { "Content-Type": "application/json", ...cors },
        });
      },
    },
  },
});
