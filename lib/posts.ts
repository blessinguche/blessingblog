import { createClient } from "@/lib/supabase/server";
import * as local from "@/lib/local-store";
import type { Post, PostInput } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/auth-session";
import { excerptFromHtml, slugify } from "@/lib/utils";

export async function listPublishedPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) {
    return local.localListPublishedPosts();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("listPublishedPosts", error);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function listAllPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) {
    return local.localListAllPosts();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listAllPosts", error);
    return [];
  }
  return (data ?? []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) {
    return local.localGetPostBySlug(slug);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getPostBySlug", error);
    return null;
  }
  return data as Post | null;
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) {
    return local.localGetPostById(id);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getPostById", error);
    return null;
  }
  return data as Post | null;
}

export async function createPost(input: PostInput): Promise<Post | null> {
  if (!isSupabaseConfigured()) {
    return local.localCreatePost(input);
  }

  const supabase = await createClient();
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
      slug: baseSlug,
      published_at: input.status === "published" ? now : null,
    })
    .select("*")
    .single();

  if (error) {
    // Retry with suffix on slug conflict
    const { data: retry, error: retryError } = await supabase
      .from("posts")
      .insert({
        title: input.title || "Untitled",
        content: input.content || "",
        excerpt: input.excerpt ?? excerptFromHtml(input.content || ""),
        status: input.status,
        font_preference: input.font_preference || "merriweather",
        slug: `${baseSlug}-${Date.now().toString(36)}`,
        published_at: input.status === "published" ? now : null,
      })
      .select("*")
      .single();

    if (retryError) {
      console.error("createPost", error, retryError);
      return null;
    }
    return retry as Post;
  }

  return data as Post;
}

export async function updatePost(
  id: string,
  input: Partial<PostInput>
): Promise<Post | null> {
  if (!isSupabaseConfigured()) {
    return local.localUpdatePost(id, input);
  }

  const existing = await getPostById(id);
  if (!existing) return null;

  const supabase = await createClient();
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
    console.error("updatePost", error);
    return null;
  }
  return data as Post;
}

export async function deletePost(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return local.localDeletePost(id);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    console.error("deletePost", error);
    return false;
  }
  return true;
}

export async function addSubscriber(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return local.localAddSubscriber(email);
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").insert({
    email: normalized,
    confirmed: true,
  });

  if (error) {
    if (error.code === "23505") return { ok: true };
    console.error("addSubscriber", error);
    return { ok: false, error: "Could not subscribe. Try again." };
  }
  return { ok: true };
}
