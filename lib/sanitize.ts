import DOMPurify from "isomorphic-dompurify";

const POST_ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "img",
  "figure",
  "figcaption",
  "audio",
  "details",
  "summary",
  "small",
  "sub",
  "sup",
  "mark",
  "br",
];

const POST_ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "class",
  "controls",
  "preload",
  "data-blessing-voice",
  "data-duration",
  "data-label",
  "style",
  "rel",
  "target",
];

const SAFE_URI = /^(?:(?:https?|mailto):|\/|#)/i;
const UPLOAD_URI = /^\/uploads\/[a-zA-Z0-9._-]+$/;

DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (data.attrName !== "href" && data.attrName !== "src") return;
  const value = data.attrValue?.trim() || "";
  if (!value) {
    data.keepAttr = false;
    return;
  }
  if (data.attrName === "src") {
    const isUpload = UPLOAD_URI.test(value);
    const isSafeExternal = /^https?:\/\//i.test(value);
    if (!isUpload && !isSafeExternal) {
      data.keepAttr = false;
    }
    return;
  }
  if (/^javascript:/i.test(value) || /^data:/i.test(value)) {
    data.keepAttr = false;
  }
});

export function sanitizePostHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: POST_ALLOWED_TAGS,
    ALLOWED_ATTR: POST_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP: SAFE_URI,
  });
}

export function sanitizePlainText(text: string, maxLength = 10_000): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isSafeLinkUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return false;
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/");
}

export function isSafeUploadPath(url: string): boolean {
  return UPLOAD_URI.test(url.trim());
}
