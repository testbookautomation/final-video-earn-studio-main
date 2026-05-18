// Lightweight localStorage auth + submission helpers (no backend persistence yet).

export type TBUser = {
  phone: string;
  name?: string;
  loggedInAt: number;
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
  videoUrl: string;
  caption: string;
  consent: boolean;
  status: SubmissionStatus;
  views: number;
  likes: number;
  comments: number;
  payoutInr: number;
  createdAt: number;
  history: { status: SubmissionStatus; at: number }[];
};

export const USER_KEY = "tb_user";
export const SUBMISSION_KEY = "tb_submission";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getUser(): TBUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as TBUser) : null;
  } catch {
    return null;
  }
}

export function setUser(u: TBUser) {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("tb:auth"));
}

export function clearUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("tb:auth"));
}

export function getSubmission(): TBSubmission | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    return raw ? (JSON.parse(raw) as TBSubmission) : null;
  } catch {
    return null;
  }
}

export function saveSubmission(s: TBSubmission) {
  if (!isBrowser()) return;
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tb:submission"));
}
