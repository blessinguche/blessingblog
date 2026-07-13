import sanitizeHtml from "sanitize-html";

const UPLOAD_URI = /^\/uploads\/[a-zA-Z0-9._-]+$/;

function isSafeHref(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return false;
  return /^(?:https?:|mailto:|\/|#)/i.test(trimmed);
}

function isSafeSrc(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return false;
  return UPLOAD_URI.test(trimmed) || /^https?:\/\//i.test(trimmed);
}

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
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
      "div",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "rel", "target", "class"],
      img: ["src", "alt", "class"],
      audio: ["src", "controls", "preload", "class"],
      figure: ["class", "data-blessing-voice", "data-duration", "data-label"],
      "*": ["class"],
      mark: ["style", "class"],
      span: ["class", "aria-hidden"],
      div: ["class"],
      p: ["class"],
      details: ["class"],
      summary: ["class"],
      small: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        if (!isSafeHref(href)) {
          const rest = { ...attribs };
          delete rest.href;
          return { tagName, attribs: rest };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: "noopener noreferrer",
          },
        };
      },
      img: (tagName, attribs) => {
        const src = attribs.src || "";
        if (!isSafeSrc(src)) {
          return { tagName: "span", attribs: {} };
        }
        return { tagName, attribs };
      },
      audio: (tagName, attribs) => {
        const src = attribs.src || "";
        if (!isSafeSrc(src)) {
          return { tagName: "span", attribs: {} };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            controls: "true",
            preload: attribs.preload || "metadata",
          },
        };
      },
    },
  });
}

export function sanitizePlainText(text: string, maxLength = 10_000): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isSafeLinkUrl(url: string): boolean {
  return isSafeHref(url);
}

export function isSafeUploadPath(url: string): boolean {
  return UPLOAD_URI.test(url.trim());
}
