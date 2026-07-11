import { WriteShell } from "@/components/editor/write-shell";
import { listAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const drafts = await listAllPosts();

  return <WriteShell drafts={drafts} />;
}
