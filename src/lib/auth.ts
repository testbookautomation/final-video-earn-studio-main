// Lightweight browser auth/session + submission helpers (no backend persistence yet).

export type TBUser = {
  phone: string;
  userId?: string;
  name?: string;
  loggedInAt: number;
  sessionId?: string;
};

export type TBUserSession = {
  id: string;
  firstSeenAt: number;
  lastSeenAt: number;
  phone?: string;
  userId?: string;
};

export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "live"
  | "milestone_reached"
  | "paid"
  | "rejected";

export type TBSubmission = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  upi: string;
  examCategory: string;
  platform: "instagram" | "youtube" | "facebook";
  followers: string;
  videoMode: "upload" | "link";
  videoUrl: string;
  videoFileName?: string;
  videoFileSize?: number;
  cdnUrl?: string;       // LMS CDN URL after successful upload
  caption: string;
  consent: boolean;
  status: SubmissionStatus;
  rejectionReason?: string;
  payoutEligibility?: string;
  payoutStatus?: string;
  views: number;
  likes: number;
  comments: number;
  payoutInr: number;
  createdAt: number;
  history: { status: SubmissionStatus; at: number }[];
};

export const USER_KEY = "tb_user";
export const USER_SESSION_KEY = "tb_user_session";
export const SUBMISSION_KEY = "tb_submission";
export const SUBMISSIONS_KEY = "tb_submissions";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tbs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function persistUserSession(session: TBUserSession): TBUserSession {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("tb:session"));
  return session;
}

export function getOrCreateUserSession(): TBUserSession | null {
  if (!isBrowser()) return null;

  const now = Date.now();
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw) as TBUserSession;
      if (session?.id) {
        return persistUserSession({
          ...session,
          firstSeenAt: session.firstSeenAt || now,
          lastSeenAt: now,
        });
      }
    }
  } catch {
    localStorage.removeItem(USER_SESSION_KEY);
  }

  return persistUserSession({
    id: createSessionId(),
    firstSeenAt: now,
    lastSeenAt: now,
  });
}

export function updateUserSession(user?: Pick<TBUser, "phone" | "userId"> | null): TBUserSession | null {
  if (!isBrowser()) return null;

  const session = getOrCreateUserSession();
  if (!session) return null;

  const next: TBUserSession = {
    ...session,
    lastSeenAt: Date.now(),
  };

  if (user === null) {
    delete next.phone;
    delete next.userId;
  } else if (user) {
    if ("phone" in user) {
      const phone = normalizePhone(user.phone ?? "");
      if (phone.length === 10) next.phone = phone;
      else delete next.phone;
    }
    if ("userId" in user) {
      const userId = (user.userId ?? "").trim();
      if (userId) next.userId = userId;
      else if (!next.phone) delete next.userId;
    }
    if (!next.userId && next.phone) next.userId = next.phone;
  }

  return persistUserSession(next);
}

const PHONE_PARAM_KEYS = [
  "phone",
  "Phone",
  "mobile",
  "Mobile",
  "phoneNo",
  "phone_no",
  "phoneNumber",
  "phone_number",
  "mobileNumber",
  "mobile_number",
];

const USER_ID_PARAM_KEYS = ["userid", "userId", "user_id", "uid", "studentId", "student_id"];

function firstParam(params: URLSearchParams, keys: string[]): string {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  const lowerKeys = new Set(keys.map((key) => key.toLowerCase()));
  for (const [key, value] of params.entries()) {
    if (lowerKeys.has(key.toLowerCase()) && value) return value;
  }
  return "";
}

export function getUrlUserParams(search: string): { phone: string; userId: string; hasIdentity: boolean } {
  const params = new URLSearchParams(search);
  const phone = normalizePhone(firstParam(params, PHONE_PARAM_KEYS));
  const userId = firstParam(params, USER_ID_PARAM_KEYS).trim();

  return {
    phone,
    userId,
    hasIdentity: phone.length === 10 || userId.length > 0,
  };
}

export function getUser(): TBUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw) as TBUser;
    const session = getOrCreateUserSession();

    if (session && user.phone) {
      const next = {
        ...user,
        phone: normalizePhone(user.phone),
        userId: user.userId || normalizePhone(user.phone),
        sessionId: user.sessionId || session.id,
      };
      if (JSON.stringify(next) !== JSON.stringify(user)) {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      }
      updateUserSession(next);
      return next;
    }

    return user;
  } catch {
    return null;
  }
}

export function setUser(u: TBUser) {
  if (!isBrowser()) return;
  const session = updateUserSession(u);
  const user = {
    ...u,
    phone: normalizePhone(u.phone),
    userId: u.userId || normalizePhone(u.phone),
    sessionId: u.sessionId || session?.id,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("tb:auth"));
}

export function clearUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(USER_KEY);
  updateUserSession(null);
  window.dispatchEvent(new Event("tb:auth"));
}

export function getSubmission(): TBSubmission | null {
  const submissions = getSubmissions();
  if (submissions.length > 0) return submissions[0];

  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    return raw ? (JSON.parse(raw) as TBSubmission) : null;
  } catch {
    return null;
  }
}

export function getSubmissions(): TBSubmission[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    const submissions = raw ? (JSON.parse(raw) as TBSubmission[]) : [];
    if (Array.isArray(submissions) && submissions.length > 0) {
      return submissions.sort((a, b) => b.createdAt - a.createdAt);
    }

    const legacy = localStorage.getItem(SUBMISSION_KEY);
    return legacy ? [JSON.parse(legacy) as TBSubmission] : [];
  } catch {
    return [];
  }
}

export function saveSubmission(s: TBSubmission) {
  if (!isBrowser()) return;
  const submissions = getSubmissions();
  const next = [s, ...submissions.filter((item) => item.id !== s.id)]
    .sort((a, b) => b.createdAt - a.createdAt);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(next));
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tb:submission"));
}
