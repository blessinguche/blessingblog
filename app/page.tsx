import { SiteHeader } from "@/components/site-header";
import { PostList } from "@/components/post-list";
import { listPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await listPublishedPosts();

  return (
    <div className="min-h-screen">
      <SiteHeader variant="home" />
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <PostList posts={posts} />
      </main>
    </div>
  );
}
