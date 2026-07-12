import { isPostCategory } from "@/lib/categories";
import { sanitizePlainText, sanitizePostHtml } from "@/lib/sanitize";
import type { FontPreference, PostCategoryId, PostStatus } from "@/lib/types";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function safeNextPath(next: string): string {
  const trimmed = next.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0")
  ) {
    return "/write";
  }
  return trimmed;
}

export function isValidEmail(email: string): boolean {
  const normalized = sanitizePlainText(email, 254).toLowerCase();
  return EMAIL_RE.test(normalized);
}

export function normalizeEmail(email: string): string {
  return sanitizePlainText(email, 254).toLowerCase();
}

export function validateContactInput(input: {
  name: string;
  email: string;
  subject: string;
  body: string;
}):
  | { ok: true; data: typeof input }
  | { ok: false; error: string } {
  const name = sanitizePlainText(input.name, 100);
  const email = normalizeEmail(input.email);
  const subject = sanitizePlainText(input.subject, 200);
  const body = sanitizePlainText(input.body, 5000);

  if (!name || !email || !subject || !body) {
    return { ok: false, error: "Please fill in all fields." };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (/[\r\n]/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }

  return { ok: true, data: { name, email, subject, body } };
}

const POST_STATUSES = new Set<PostStatus>(["draft", "published"]);
const FONT_PREFS = new Set<FontPreference>(["merriweather", "typewriter"]);

export function validatePostInput(input: {
  title: string;
  content: string;
  status: string;
  font_preference: string;
  category: string;
}):
  | {
      ok: true;
      data: {
        title: string;
        content: string;
        status: PostStatus;
        font_preference: FontPreference;
        category: PostCategoryId | null;
      };
    }
  | { ok: false; error: string } {
  const title = sanitizePlainText(input.title || "Untitled", 200);
  const content = sanitizePostHtml(input.content || "");
  const status = input.status as PostStatus;
  const font_preference = input.font_preference as FontPreference;
  const category: PostCategoryId | null = isPostCategory(input.category)
    ? input.category
    : null;

  if (!POST_STATUSES.has(status)) {
    return { ok: false, error: "Invalid post status." };
  }
  if (!FONT_PREFS.has(font_preference)) {
    return { ok: false, error: "Invalid font preference." };
  }
  if (content.length > 500_000) {
    return { ok: false, error: "Post content is too long." };
  }

  return {
    ok: true,
    data: { title, content, status, font_preference, category },
  };
}
