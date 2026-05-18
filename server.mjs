import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = parseInt(process.env.PORT || "4173", 10);
const CLIENT_DIR = join(__dirname, "dist/client");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

async function tryStatic(pathname, res) {
  const filePath = join(CLIENT_DIR, decodeURIComponent(pathname));
  // Prevent path traversal outside CLIENT_DIR
  if (!filePath.startsWith(CLIENT_DIR)) return false;
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const content = await readFile(filePath);
    const immutable = pathname.startsWith("/assets/");
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": immutable
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
      "Content-Length": content.length,
    });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

async function toFetchRequest(req) {
  const host = req.headers.host || "localhost";
  const url = `http://${host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
    else headers.set(k, v);
  }
  const hasBody = !["GET", "HEAD"].includes(req.method || "GET");
  return new Request(url, {
    method: req.method || "GET",
    headers,
    ...(hasBody
      ? {
          body: Readable.toWeb(req),
          duplex: "half",
        }
      : {}),
  });
}

async function sendFetchResponse(fetchRes, res) {
  const headers = {};
  fetchRes.headers.forEach((v, k) => {
    headers[k] = v;
  });
  res.writeHead(fetchRes.status, headers);
  if (fetchRes.body) {
    const reader = fetchRes.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

// Load the built SSR handler (Cloudflare Workers-style fetch API)
const { default: ssrHandler } = await import("./dist/server/server.js");

const httpServer = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");

    // 1. Try to serve a static file from dist/client
    if (await tryStatic(pathname, res)) return;

    // 2. Hand off to TanStack Start SSR handler
    const fetchReq = await toFetchRequest(req);
    const fetchRes = await ssrHandler.fetch(fetchReq, {}, {});
    await sendFetchResponse(fetchRes, res);
  } catch (err) {
    console.error("[server]", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
    }
    res.end("Internal Server Error");
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});
