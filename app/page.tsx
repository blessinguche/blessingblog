import { SiteHeader } from "@/components/site-header";
import { BlogFeed } from "@/components/blog-feed";
import { listPublishedPosts } from "@/lib/posts";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await listPublishedPosts();

  return (
    <div className="min-h-screen">
      <SiteHeader variant="home" />
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <BlogFeed posts={posts} />
      </main>
    </div>
  );
}
