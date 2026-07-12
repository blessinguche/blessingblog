import Link from "next/link";
import type { PostSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getCategory } from "@/lib/categories";

export function PostList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-muted text-center py-16">
        No posts yet. The page is quiet — for now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      {posts.map((post) => {
        const cat = getCategory(post.category);
        return (
          <article key={post.id} className="text-left">
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
              <Link
                href={`/posts/${post.slug}`}
                className="text-foreground no-underline hover:opacity-80"
              >
                {post.title}
              </Link>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-soft">
              <time dateTime={post.published_at || post.created_at}>
                {formatDate(post.published_at || post.created_at)}
              </time>
              {cat ? (
                <span>
                  {cat.emoji} {cat.hash}
                </span>
              ) : null}
            </div>
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
        );
      })}
    </div>
  );
}
