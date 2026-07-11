import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PostContent } from "@/components/post-content";
import { getPostBySlug } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { isWriterAuthenticated } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") {
    return { title: "Not found" };
  }
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const isWriter = await isWriterAuthenticated();

  if (!post) notFound();
  if (post.status !== "published" && !isWriter) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <article>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            {post.title}
          </h1>
          <time
            dateTime={post.published_at || post.created_at}
            className="block mt-3 text-sm text-muted-soft"
          >
            {formatDate(post.published_at || post.created_at)}
          </time>
          <div className="mt-8">
            <PostContent html={post.content} />
          </div>
        </article>
        {isWriter ? (
          <p className="mt-12 text-sm text-muted">
            <Link href={`/write/${post.id}`} className="text-muted hover:text-foreground no-underline">
              Edit this post
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}
