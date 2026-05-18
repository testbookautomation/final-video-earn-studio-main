/**
 * Server-side Testbook OTP helpers.
 * Keep these behind local API routes so the browser never has to call
 * api.testbook.com directly.
 */

const TESTBOOK_API_BASE = "https://api.testbook.com/api";

type UnknownRecord = Record<string, unknown>;

export type TestbookOtpResult = {
  ok: boolean;
  status: number;
  message: string;
  userId?: string;
  studentId?: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function getString(value: unknown, key: string): string | null {
  const record = asRecord(value);
  const found = record?.[key];
  return typeof found === "string" && found.trim() ? found.trim() : null;
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

function assertValidPhone(value: string): string {
  const phone = normalizePhone(value);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }
  return phone;
}

function assertValidOtp(value: string): string {
  const otp = value.replace(/\D/g, "");
  if (otp.length !== 6) {
    throw new Error("Enter the 6-digit OTP.");
  }
  return otp;
}

function firstString(value: unknown, keys: string[]): string | null {
  for (const key of keys) {
    const found = getString(value, key);
    if (found) return found;
  }
  return null;
}

function extractUserId(payload: unknown): {
  userId?: string;
  studentId?: string;
} {
  const data = asRecord(asRecord(payload)?.data) ?? asRecord(payload);
  const student = asRecord(data?.student) ?? asRecord(data?.user);

  const studentId =
    firstString(data, ["sid", "studentId", "_id", "id"]) ??
    firstString(student, ["sid", "studentId", "_id", "id"]);

  return {
    ...(studentId ? { userId: studentId, studentId } : {}),
  };
}

async function readJson(response: Response): Promise<UnknownRecord> {
  const text = await response.text().catch(() => "");
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    return asRecord(parsed) ?? {};
  } catch {
    return { message: text.slice(0, 300) };
  }
}

function headers(contentType?: string): HeadersInit {
  return {
    Accept: "application/json, text/plain, */*",
    Origin: "https://testbook.com",
    Referer: "https://testbook.com/",
    "User-Agent": "Mozilla/5.0",
    "x-tb-client": "web,1.3",
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

function resultFromResponse(
  response: Response,
  payload: UnknownRecord,
): TestbookOtpResult {
  const success = payload.success !== false && response.ok;
  const message =
    getString(payload, "message") ??
    (success ? "OTP verified." : "OTP request failed. Please try again.");

  return {
    ok: success,
    status: response.status,
    message,
    ...extractUserId(payload),
  };
}

export async function testbookSendOtp(
  phoneValue: string,
  resend = false,
): Promise<TestbookOtpResult> {
  const phone = assertValidPhone(phoneValue);
  const url = new URL(`${TESTBOOK_API_BASE}/v2/otp/send`);
  url.searchParams.set("emailOrMobile", phone);
  if (resend) url.searchParams.set("resend", "true");

  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
  });
  const payload = await readJson(response);

  return resultFromResponse(response, payload);
}

export async function testbookVerifyOtp(
  phoneValue: string,
  otpValue: string,
): Promise<TestbookOtpResult> {
  const phone = assertValidPhone(phoneValue);
  const otp = assertValidOtp(otpValue);
  const url = new URL(`${TESTBOOK_API_BASE}/v2/otp/login`);
  url.searchParams.set("emailOrMobile", phone);
  url.searchParams.set("otp", otp);

  const response = await fetch(url, {
    method: "POST",
    headers: headers("application/json"),
    body: JSON.stringify({ emailOrMobile: phone, otp }),
  });
  const payload = await readJson(response);

  return resultFromResponse(response, payload);
}
