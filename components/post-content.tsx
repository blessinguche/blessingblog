import { sanitizePostHtml } from "@/lib/sanitize";

export function PostContent({ html }: { html: string }) {
  const safeHtml = sanitizePostHtml(html);
  return (
    <div
      className="prose-blessing"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
