"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isWriterAuthenticated } from "@/lib/auth";
import {
  createPost,
  deletePost,
  updatePost,
  addSubscriber,
} from "@/lib/posts";
import type { FontPreference, PostStatus } from "@/lib/types";

async function requireWriter() {
  const ok = await isWriterAuthenticated();
  if (!ok) {
    throw new Error("Unauthorized");
  }
}

export async function savePostAction(formData: FormData) {
  await requireWriter();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "Untitled");
  const content = String(formData.get("content") || "");
  const status = String(formData.get("status") || "draft") as PostStatus;
  const font_preference = String(
    formData.get("font_preference") || "merriweather"
  ) as FontPreference;

  if (id) {
    const post = await updatePost(id, {
      title,
      content,
      status,
      font_preference,
    });
    if (!post) throw new Error("Failed to update post");
    revalidatePath("/");
    revalidatePath(`/posts/${post.slug}`);
    revalidatePath("/write");
    if (status === "published") {
      redirect(`/posts/${post.slug}`);
    }
    redirect(`/write/${post.id}`);
  }

  const post = await createPost({
    title,
    content,
    status,
    font_preference,
  });
  if (!post) throw new Error("Failed to create post");
  revalidatePath("/");
  revalidatePath("/write");
  if (status === "published") {
    redirect(`/posts/${post.slug}`);
  }
  redirect(`/write/${post.id}`);
}

export async function deletePostAction(formData: FormData) {
  await requireWriter();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deletePost(id);
  revalidatePath("/");
  revalidatePath("/write");
  redirect("/write");
}

export type SubscribeResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function subscribeAction(
  _prev: SubscribeResult | null,
  formData: FormData
): Promise<SubscribeResult> {
  const email = String(formData.get("email") || "");
  const result = await addSubscriber(email);
  if (!result.ok) {
    return { ok: false, error: result.error || "Could not subscribe." };
  }
  return { ok: true, message: "You're on the list. Thanks for subscribing." };
}
