import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { FontPreference, Post, PostInput, PostStatus } from "@/lib/types";
import { excerptFromHtml, slugify } from "@/lib/utils";

const DATA_DIR = path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(POSTS_FILE);
  } catch {
    const now = new Date().toISOString();
    const seed: Post[] = [
      {
        id: randomUUID(),
        slug: "hello-from-blessing",
        title: "Hello from Blessing",
        content: `<p>This is the first note on <em>Blessing</em> — a quiet place for thoughts, diary entries, and yaps.</p><p>Write freely. Format lightly. Publish when it feels right.</p>`,
        excerpt:
          "This is the first note on Blessing — a quiet place for thoughts, diary entries, and yaps.",
        status: "published",
        published_at: now,
        font_preference: "merriweather",
        created_at: now,
        updated_at: now,
      },
    ];
    await fs.writeFile(POSTS_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
  try {
    await fs.access(SUBSCRIBERS_FILE);
  } catch {
    await fs.writeFile(SUBSCRIBERS_FILE, "[]", "utf8");
  }
}

async function readPosts(): Promise<Post[]> {
  await ensureDataFiles();
  const raw = await fs.readFile(POSTS_FILE, "utf8");
  return JSON.parse(raw) as Post[];
}

async function writePosts(posts: Post[]) {
  await ensureDataFiles();
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), "utf8");
}

function uniqueSlug(base: string, posts: Post[], excludeId?: string): string {
  let slug = slugify(base);
  let i = 2;
  while (posts.some((p) => p.slug === slug && p.id !== excludeId)) {
    slug = `${slugify(base)}-${i}`;
    i += 1;
  }
  return slug;
}

export async function localListPublishedPosts(): Promise<Post[]> {
  const posts = await readPosts();
  return posts
    .filter((p) => p.status === "published")
    .sort((a, b) => {
      const da = a.published_at || a.created_at;
      const db = b.published_at || b.created_at;
      return db.localeCompare(da);
    });
}

export async function localListAllPosts(): Promise<Post[]> {
  const posts = await readPosts();
  return posts.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function localGetPostBySlug(slug: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function localGetPostById(id: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id) ?? null;
}

export async function localCreatePost(input: PostInput): Promise<Post> {
  const posts = await readPosts();
  const now = new Date().toISOString();
  const post: Post = {
    id: randomUUID(),
    slug: uniqueSlug(input.slug || input.title || "untitled", posts),
    title: input.title || "Untitled",
    content: input.content || "",
    excerpt: input.excerpt ?? excerptFromHtml(input.content || ""),
    status: input.status,
    published_at: input.status === "published" ? now : null,
    font_preference: input.font_preference || "merriweather",
    created_at: now,
    updated_at: now,
  };
  posts.unshift(post);
  await writePosts(posts);
  return post;
}

export async function localUpdatePost(
  id: string,
  input: Partial<PostInput> & { status?: PostStatus; font_preference?: FontPreference }
): Promise<Post | null> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const existing = posts[index];
  const nextStatus = input.status ?? existing.status;
  const title = input.title ?? existing.title;
  const content = input.content ?? existing.content;

  const updated: Post = {
    ...existing,
    title,
    content,
    excerpt:
      input.excerpt !== undefined
        ? input.excerpt
        : excerptFromHtml(content),
    status: nextStatus,
    font_preference: input.font_preference ?? existing.font_preference,
    slug: input.slug
      ? uniqueSlug(input.slug, posts, id)
      : input.title
        ? uniqueSlug(input.title, posts, id)
        : existing.slug,
    published_at:
      nextStatus === "published"
        ? existing.published_at || new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };

  posts[index] = updated;
  await writePosts(posts);
  return updated;
}

export async function localDeletePost(id: string): Promise<boolean> {
  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await writePosts(next);
  return true;
}

export async function localAddSubscriber(email: string): Promise<{ ok: boolean; error?: string }> {
  await ensureDataFiles();
  const raw = await fs.readFile(SUBSCRIBERS_FILE, "utf8");
  const list = JSON.parse(raw) as { id: string; email: string; created_at: string; confirmed: boolean }[];
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (list.some((s) => s.email === normalized)) {
    return { ok: true };
  }
  list.push({
    id: randomUUID(),
    email: normalized,
    created_at: new Date().toISOString(),
    confirmed: true,
  });
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2), "utf8");
  return { ok: true };
}
