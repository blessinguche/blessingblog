import { notFound } from "next/navigation";
import { WriteShell } from "@/components/editor/write-shell";
import { getPostById, listAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditWritePage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();
  const drafts = await listAllPosts();

  return <WriteShell post={post} drafts={drafts} />;
}
