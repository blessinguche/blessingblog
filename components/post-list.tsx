import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-muted text-center py-16">
        No posts yet. The page is quiet — for now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      {posts.map((post) => (
        <article key={post.id} className="text-left">
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
            <Link
              href={`/posts/${post.slug}`}
              className="text-foreground no-underline hover:opacity-80"
            >
              {post.title}
            </Link>
          </h2>
          <time
            dateTime={post.published_at || post.created_at}
            className="block mt-2 text-sm text-muted-soft"
          >
            {formatDate(post.published_at || post.created_at)}
          </time>
          {post.excerpt ? (
            <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/90">
              {post.excerpt}
            </p>
          ) : null}
          <Link
            href={`/posts/${post.slug}`}
            className="inline-block mt-3 text-sm text-muted no-underline hover:text-foreground"
          >
            Read more…
          </Link>
        </article>
      ))}
    </div>
  );
}
