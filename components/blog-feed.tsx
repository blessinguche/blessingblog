"use client";

import { useMemo, useState } from "react";
import { PostList } from "@/components/post-list";
import type { Post } from "@/lib/types";
import { htmlToPlainText } from "@/lib/utils";

function postSearchText(post: Post): string {
  return [post.title, post.excerpt || "", htmlToPlainText(post.content)]
    .join(" ")
    .toLowerCase();
}

export function BlogFeed({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return posts;
    return posts.filter((post) => postSearchText(post).includes(normalized));
  }, [posts, normalized]);

  return (
    <>
      {posts.length > 0 ? (
        <div className="mb-10">
          <label htmlFor="post-search" className="sr-only">
            Search posts
          </label>
          <input
            id="post-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground placeholder:text-muted-soft text-base"
          />
        </div>
      ) : null}

      {filtered.length === 0 && normalized ? (
        <p className="text-muted text-center py-16">
          No posts match &ldquo;{trimmed}&rdquo;.
        </p>
      ) : (
        <PostList posts={filtered} />
      )}
    </>
  );
}
