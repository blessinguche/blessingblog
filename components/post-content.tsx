export function PostContent({ html }: { html: string }) {
  return (
    <div
      className="prose-blessing"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
