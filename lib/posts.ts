import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as local from "@/lib/local-store";
import type { Post, PostInput, PostSummary } from "@/lib/types";
import {
  isSupabaseConfigured,
  isSupabaseWriterConfigured,
} from "@/lib/supabase/env";
import { isWriterAuthenticated } from "@/lib/auth";
import { excerptFromHtml, slugify } from "@/lib/utils";
import { isValidEmail, normalizeEmail } from "@/lib/validate";

const POST_LIST_FIELDS =
  "id, slug, title, excerpt, status, published_at, font_preference, category, created_at, updated_at";

type SupabaseError = { code?: string; message?: string } | null;

function normalizePost(data: Post): Post {
  return {
    ...data,
    category: data.category ?? null,
  };
}

function toSummary(post: Post): PostSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, ...summary } = post;
  return summary;
}

function isSupabaseSchemaError(error: SupabaseError): boolean {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

function shouldUseLocalPostsStore() {
  return !isSupabaseWriterConfigured();
}

export async function listPublishedPosts(): Promise<PostSummary[]> {
  if (shouldUseLocalPostsStore()) {
    const posts = await local.localListPublishedPosts();
    return posts.map(toSummary);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_LIST_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    if (isSupabaseSchemaError(error)) {
      const posts = await local.localListPublishedPosts();
      return posts.map(toSummary);
    }
    console.error("listPublishedPosts", error);
    return [];
  }
  return ((data ?? []) as PostSummary[]).map((p) => ({
    ...p,
    category: p.category ?? null,
  }));
}

export async function listAllPosts(): Promise<Post[]> {
  if (shouldUseLocalPostsStore()) {
    return local.localListAllPosts();
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      if (isSupabaseSchemaError(error)) {
        return local.localListAllPosts();
      }
      console.error("listAllPosts", error);
      return [];
    }
    return ((data ?? []) as Post[]).map(normalizePost);
  } catch (err) {
    console.error("listAllPosts", err);
    return local.localListAllPosts();
  }
}

export const getPostBySlug = cache(async function getPostBySlug(
  slug: string
): Promise<Post | null> {
  if (shouldUseLocalPostsStore()) {
    return local.localGetPostBySlug(slug);
  }

  const isWriter = await isWriterAuthenticated();
  const supabase = isWriter ? createAdminClient() : await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (isSupabaseSchemaError(error)) {
      return local.localGetPostBySlug(slug);
    }
    console.error("getPostBySlug", error);
    return null;
  }
  if (!data) return null;
  if (!isWriter && data.status !== "published") return null;
  return normalizePost(data as Post);
});

export async function getPostById(id: string): Promise<Post | null> {
  if (shouldUseLocalPostsStore()) {
    return local.localGetPostById(id);
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isSupabaseSchemaError(error)) {
        return local.localGetPostById(id);
      }
      console.error("getPostById", error);
      return null;
    }
    return data ? normalizePost(data as Post) : null;
  } catch (err) {
    console.error("getPostById", err);
    return local.localGetPostById(id);
  }
}

export async function createPost(input: PostInput): Promise<Post | null> {
  if (shouldUseLocalPostsStore()) {
    return local.localCreatePost(input);
  }

  try {
    const supabase = createAdminClient();
    const baseSlug = slugify(input.slug || input.title || "untitled");
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: input.title || "Untitled",
        content: input.content || "",
        excerpt: input.excerpt ?? excerptFromHtml(input.content || ""),
        status: input.status,
        font_preference: input.font_preference || "merriweather",
        category: input.category ?? null,
        slug: baseSlug,
        published_at: input.status === "published" ? now : null,
      })
      .select("*")
      .single();

    if (error) {
      if (isSupabaseSchemaError(error)) {
        return local.localCreatePost(input);
      }

      const { data: retry, error: retryError } = await supabase
        .from("posts")
        .insert({
          title: input.title || "Untitled",
          content: input.content || "",
          excerpt: input.excerpt ?? excerptFromHtml(input.content || ""),
          status: input.status,
          font_preference: input.font_preference || "merriweather",
          category: input.category ?? null,
          slug: `${baseSlug}-${Date.now().toString(36)}`,
          published_at: input.status === "published" ? now : null,
        })
        .select("*")
        .single();

      if (retryError) {
        console.error("createPost", error, retryError);
        return null;
      }
      return normalizePost(retry as Post);
    }

    return normalizePost(data as Post);
  } catch (err) {
    console.error("createPost", err);
    return local.localCreatePost(input);
  }
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>
): Promise<Post | null> {
  if (shouldUseLocalPostsStore()) {
    return local.localUpdatePost(id, input);
  }

  const existing = await getPostById(id);
  if (!existing) return null;

  try {
    const supabase = createAdminClient();
    const nextStatus = input.status ?? existing.status;
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) payload.title = input.title;
    if (input.content !== undefined) {
      payload.content = input.content;
      payload.excerpt = input.excerpt ?? excerptFromHtml(input.content);
    } else if (input.excerpt !== undefined) {
      payload.excerpt = input.excerpt;
    }
    if (input.font_preference !== undefined) {
      payload.font_preference = input.font_preference;
    }
    if (input.category !== undefined) {
      payload.category = input.category;
    }
    if (input.status !== undefined) {
      payload.status = input.status;
      payload.published_at =
        nextStatus === "published"
          ? existing.published_at || new Date().toISOString()
          : null;
    }
    if (input.slug !== undefined) {
      payload.slug = slugify(input.slug);
    } else if (input.title !== undefined) {
      payload.slug = slugify(input.title);
    }

    const { data, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (isSupabaseSchemaError(error)) {
        return local.localUpdatePost(id, input);
      }
      console.error("updatePost", error);
      return null;
    }
    return normalizePost(data as Post);
  } catch (err) {
    console.error("updatePost", err);
    return local.localUpdatePost(id, input);
  }
}

export async function deletePost(id: string): Promise<boolean> {
  if (shouldUseLocalPostsStore()) {
    return local.localDeletePost(id);
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      if (isSupabaseSchemaError(error)) {
        return local.localDeletePost(id);
      }
      console.error("deletePost", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deletePost", err);
    return local.localDeletePost(id);
  }
}

export async function addSubscriber(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return local.localAddSubscriber(email);
  }

  const normalized = normalizeEmail(email);
  if (!normalized || !isValidEmail(normalized)) {
    return { ok: false, error: "Enter a valid email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").insert({
    email: normalized,
    confirmed: true,
  });

  if (error) {
    if (error.code === "23505") return { ok: true };
    if (isSupabaseSchemaError(error)) {
      return local.localAddSubscriber(email);
    }
    console.error("addSubscriber", error);
    return { ok: false, error: "Could not subscribe. Try again." };
  }
  return { ok: true };
}

// re-export for callers that still import from posts
export { isSupabaseConfigured } from "@/lib/supabase/env";
