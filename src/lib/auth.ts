import { config } from "@/config";

/** Emails allowed to sign in (AUTH_ALLOWED_EMAILS, comma-separated; defaults to owner). */
export function isAllowedEmail(email: string): boolean {
  const list = (process.env.AUTH_ALLOWED_EMAILS || config.owner.contactEmail)
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
