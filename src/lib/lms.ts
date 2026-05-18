/**
 * Server-side LMS CDN upload helpers + Apps Script event dispatcher.
 * All functions in this file are intended for server routes ONLY — never import in browser code.
 */

const LMS_EMAIL     = "learning@testbook.com";
const LMS_PASSWORD  = "learning!@#book";
const LOGIN_URL     = "https://lms-api.testbook.com/api/v2/admin/login";
const PRESIGNED_API = "https://lms-api.testbook.com/api/v2/pre-signed-upload?language=All";
const LMS_ADMIN_API = "https://lms-api.testbook.com/api/v2/admin";
const STUDENT_ME_API = "https://api-new.testbook.com/api/v2.2/students/me";

export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxHEfj6FeZiuJmIeanZpSxGWkD3YHyvxhjkAa99cmw8lGNoY-gEqTibMHtBmGa3jkjauw/exec";

const APPS_SCRIPT_TOKEN = "TB_UGC_SECRET_2025";

// Keep old export alias so existing imports don't break
export const WEBHOOK_URL = APPS_SCRIPT_URL;

/* ── Event types ─────────────────────────────────────────── */

export type EventMeta = {
  creatorPhone?: string;
  submissionId?: string;
};

/**
 * Relevant webhook event names.
 *
 * Naming convention: UGC_creators_<area>_<action>_<result>
 */
export const EVENT = {
  VIDEO_UPLOAD_COMPLETED:   "UGC_creators_video_upload_completed",
  VIDEO_UPLOAD_FAILED:      "UGC_creators_video_upload_failed",
  SUBMISSION_SYNC_COMPLETED:"UGC_creators_submission_sync_completed",
  SUBMISSION_SYNC_FAILED:   "UGC_creators_submission_sync_failed",
  VIDEO_REVIEW_STARTED:     "UGC_creators_video_review_started",
  VIDEO_APPROVED:           "UGC_creators_video_approved",
  VIDEO_REJECTED:           "UGC_creators_video_rejected",
  VIDEO_LIVE:               "UGC_creators_video_live",
  VIDEO_MILESTONE_REACHED:  "UGC_creators_video_milestone_reached",
  PAYMENT_ELIGIBLE:         "UGC_creators_payment_eligible",
  PAYMENT_INITIATED:        "UGC_creators_payment_initiated",
  PAYMENT_COMPLETED:        "UGC_creators_payment_completed",
  PAYMENT_FAILED:           "UGC_creators_payment_failed",
} as const;

/* ── Webhook fire (fire-and-forget) ──────────────────────── */

export async function fireEvent(
  event: string,
  data: Record<string, unknown>,
  meta: EventMeta = {},
): Promise<void> {
  const payload = {
    type: "event",
    token: APPS_SCRIPT_TOKEN,
    eventName: event,
    userId: meta.creatorPhone ?? "",
    phone: meta.creatorPhone ?? "",
    page: String(data.page ?? ""),
    platform: String(data.platform ?? ""),
    payload: { ...data, submissionId: meta.submissionId },
  };
  try {
    await fetch(APPS_SCRIPT_URL, {
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

/* ── LMS student lookup + VPA ───────────────────────────── */

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function firstArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  const record = asRecord(value);
  if (!record) return [];

  for (const key of ["data", "results", "students", "docs"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested;
    const nestedRecord = asRecord(nested);
    if (nestedRecord) {
      const nestedArray = firstArray(nestedRecord);
      if (nestedArray.length) return nestedArray;
    }
  }

  return [];
}

function getString(value: unknown, key: string): string | null {
  const record = asRecord(value);
  const found = record?.[key];
  return typeof found === "string" && found.trim() ? found : null;
}

function extractToken(value: unknown): string | null {
  const direct = typeof value === "string" ? value : null;
  if (direct?.includes(".")) return direct;

  const record = asRecord(value);
  if (!record) return null;

  for (const key of ["auth_code", "authCode", "token", "jwt"]) {
    const token = getString(record, key);
    if (token) return token;
  }

  return extractToken(record.data);
}

export function toLmsMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export async function lmsFindStudentByMobile(
  token: string,
  phone: string,
): Promise<{ id: string; mobile: string | null } | null> {
  const mobile = toLmsMobile(phone);
  if (!mobile) return null;

  const url = new URL(`${LMS_ADMIN_API}/students`);
  url.searchParams.set("language", "All");
  url.searchParams.set("skip", "0");
  url.searchParams.set("limit", "10");
  url.searchParams.set("export", "false");
  url.searchParams.set("filter", JSON.stringify({ mobile }));
  url.searchParams.set("fields", "");

  const resp = await fetch(url, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Bearer ${token}`,
      "x-tb-client": "lm",
      "Origin": "https://lms.testbook.com",
      "Referer": "https://lms.testbook.com/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`LMS student search HTTP ${resp.status}: ${text.slice(0, 300)}`);

  let data: unknown;
  try { data = JSON.parse(text); }
  catch { throw new Error(`LMS student search response is not JSON: ${text.slice(0, 200)}`); }

  const student = firstArray(data).map(asRecord).find(Boolean);
  const id = getString(student, "_id") ?? getString(student, "id");
  return id ? { id, mobile: getString(student, "mobile") } : null;
}

export async function lmsGenerateStudentToken(
  token: string,
  studentId: string,
): Promise<string> {
  const resp = await fetch(`${LMS_ADMIN_API}/students/${encodeURIComponent(studentId)}/gentoken?language=All`, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Bearer ${token}`,
      "x-tb-client": "lm",
      "Origin": "https://lms.testbook.com",
      "Referer": "https://lms.testbook.com/",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`LMS gentoken HTTP ${resp.status}: ${text.slice(0, 300)}`);

  let data: unknown;
  try { data = JSON.parse(text); }
  catch { data = text; }

  const studentToken = extractToken(data);
  if (!studentToken) throw new Error(`LMS gentoken response did not include an auth code.`);
  return studentToken;
}

export async function lmsGetStudentVpa(authCode: string): Promise<string | null> {
  const url = new URL(STUDENT_ME_API);
  url.searchParams.set("auth_code", authCode);
  url.searchParams.set("fields", "_id,name,mobile,vpa");
  url.searchParams.set("X-Tb-Client", "web,1.3");

  const resp = await fetch(url, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "x-tb-client": "web,1.3",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const text = await resp.text().catch(() => "");
  if (!resp.ok) throw new Error(`Student profile HTTP ${resp.status}: ${text.slice(0, 300)}`);

  let data: unknown;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Student profile response is not JSON: ${text.slice(0, 200)}`); }

  const record = asRecord(data);
  const profile = asRecord(record?.data) ?? record;
  return getString(profile, "vpa");
}

export async function lmsGetStudentVpaByPhone(phone: string): Promise<{
  studentId: string | null;
  mobile: string | null;
  vpa: string | null;
}> {
  const token = await lmsLogin();
  const student = await lmsFindStudentByMobile(token, phone);
  if (!student) return { studentId: null, mobile: toLmsMobile(phone), vpa: null };

  const authCode = await lmsGenerateStudentToken(token, student.id);
  const vpa = await lmsGetStudentVpa(authCode);
  return { studentId: student.id, mobile: student.mobile, vpa };
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
