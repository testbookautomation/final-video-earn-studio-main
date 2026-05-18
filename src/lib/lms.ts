/**
 * Server-side LMS CDN upload helpers + webhook event dispatcher.
 * All functions in this file are intended for server routes ONLY — never import in browser code.
 */

const LMS_EMAIL     = "learning@testbook.com";
const LMS_PASSWORD  = "learning!@#book";
const LOGIN_URL     = "https://lms-api.testbook.com/api/v2/admin/login";
const PRESIGNED_API = "https://lms-api.testbook.com/api/v2/pre-signed-upload?language=All";

// Apps Script webhook — receives all platform events
export const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzBm0a1BSio88QWXaYz-5Xc0XTc8gDdxH4HFaEow1N4HNsWpRriD6jCGhz1ORHxDXsu/exec";

/* ── Event types ─────────────────────────────────────────── */

export type EventMeta = {
  creatorPhone?: string;
  submissionId?: string;
};

/**
 * All event names used across the platform.
 *
 * Naming convention: <domain>.<entity>.<action>
 *   video.upload.*         — lifecycle of a single video file going to LMS CDN
 *   creator.submission.*   — lifecycle of a creator's form submission
 */
export const EVENT = {
  // ── Video upload pipeline ──────────────────────────────────
  VIDEO_UPLOAD_STARTED:             "video.upload.started",
  VIDEO_UPLOAD_LMS_AUTH_SUCCESS:    "video.upload.lms_auth_success",
  VIDEO_UPLOAD_LMS_AUTH_FAILED:     "video.upload.lms_auth_failed",
  VIDEO_UPLOAD_PRESIGNED_URL_READY: "video.upload.presigned_url_ready",
  VIDEO_UPLOAD_PRESIGNED_URL_FAILED:"video.upload.presigned_url_failed",
  VIDEO_UPLOAD_CDN_TRANSFER_STARTED:"video.upload.cdn_transfer_started",
  VIDEO_UPLOAD_CDN_TRANSFER_SUCCESS:"video.upload.cdn_transfer_success",
  VIDEO_UPLOAD_CDN_TRANSFER_FAILED: "video.upload.cdn_transfer_failed",
  VIDEO_UPLOAD_PIPELINE_ERROR:      "video.upload.pipeline_error",

  // ── Creator submission lifecycle ──────────────────────────
  CREATOR_SUBMISSION_CREATED:                   "creator.submission.created",
  CREATOR_SUBMISSION_FORWARDED_TO_APPS_SCRIPT:  "creator.submission.forwarded_to_apps_script",
  CREATOR_SUBMISSION_APPS_SCRIPT_ACCEPTED:      "creator.submission.apps_script_accepted",
  CREATOR_SUBMISSION_APPS_SCRIPT_FAILED:        "creator.submission.apps_script_failed",
} as const;

/* ── Webhook fire (fire-and-forget) ──────────────────────── */

export async function fireEvent(
  event: string,
  data: Record<string, unknown>,
  meta: EventMeta = {},
): Promise<void> {
  const payload = {
    event,
    timestamp: Date.now(),
    ...(meta.creatorPhone  && { creatorPhone:  meta.creatorPhone }),
    ...(meta.submissionId  && { submissionId:  meta.submissionId }),
    data,
  };
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch { /* non-blocking — never throw */ }
}

/* ── LMS auth ────────────────────────────────────────────── */

export async function lmsLogin(): Promise<string> {
  const resp = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Accept":         "*/*",
      "Content-Type":   "application/x-www-form-urlencoded",
      "x-tb-client":    "lm",
      "User-Agent":     "Mozilla/5.0",
    },
    body: new URLSearchParams({ email: LMS_EMAIL, password: LMS_PASSWORD }),
  });

  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`LMS login HTTP ${resp.status}: ${text.slice(0, 400)}`);

  let data: { success: boolean; data?: { token?: string } };
  try { data = JSON.parse(text); }
  catch { throw new Error(`LMS login response is not JSON (status ${resp.status}): ${text.slice(0, 200)}`); }

  if (!data.success || !data.data?.token)
    throw new Error(`LMS login: no token returned. Response: ${JSON.stringify(data).slice(0, 300)}`);

  return data.data.token;
}

/* ── LMS presigned URL ───────────────────────────────────── */

export async function lmsGetPresignedUrl(
  token: string,
  prefix: string,
  fileExt: string,
): Promise<{ uploadUrl: string; cdnUrl: string }> {
  const resp = await fetch(PRESIGNED_API, {
    method: "POST",
    headers: {
      "Accept":          "application/json, text/plain, */*",
      "Authorization":   `Bearer ${token}`,
      "x-tb-client":     "lm",
      "Origin":          "https://lms.testbook.com",
      "Referer":         "https://lms.testbook.com/",
      "User-Agent":      "Mozilla/5.0",
      "Content-Type":    "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ prefix, fileExt }),
  });

  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`LMS presigned URL HTTP ${resp.status}: ${text.slice(0, 400)}`);

  let data: { success: boolean; data?: { uploadUrl?: string; cdnUrl?: string } };
  try { data = JSON.parse(text); }
  catch { throw new Error(`LMS presigned response not JSON (${resp.status}): ${text.slice(0, 200)}`); }

  if (!data.success || !data.data?.uploadUrl || !data.data?.cdnUrl)
    throw new Error(`LMS presigned URL missing fields. Response: ${JSON.stringify(data).slice(0, 300)}`);

  const rawCdn = data.data.cdnUrl;
  const cdnUrl = rawCdn.startsWith("//") ? `https:${rawCdn}` : rawCdn;
  return { uploadUrl: data.data.uploadUrl, cdnUrl };
}

/* ── CDN upload ──────────────────────────────────────────── */

export async function lmsUploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  cleanFilename: string,
  mimeType: string,
): Promise<{ statusCode: number; responseText: string }> {
  const formData = new FormData();
  formData.append("file", file, cleanFilename);

  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Accept":      "application/json, text/plain, */*",
      "Origin":      "https://lms.testbook.com",
      "Referer":     "https://lms.testbook.com/",
      "User-Agent":  "Mozilla/5.0",
    },
    body: formData,
  });

  const responseText = await resp.text().catch(() => "");
  return { statusCode: resp.status, responseText };
}

/* ── Filename helpers ────────────────────────────────────── */

export function cleanFileName(filename: string): string {
  return String(filename).trim().replace(/[^\w.\-() ]/g, "_");
}

export function getFileExt(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.substring(i);
}
