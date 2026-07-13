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
import { validatePostInput, isValidEmail, normalizeEmail } from "@/lib/validate";

async function requireWriter() {
  const ok = await isWriterAuthenticated();
  if (!ok) {
    throw new Error("Unauthorized");
  }
}

export async function savePostAction(formData: FormData) {
  await requireWriter();

  const validated = validatePostInput({
    title: String(formData.get("title") || "Untitled"),
    content: String(formData.get("content") || ""),
    status: String(formData.get("status") || "draft"),
    font_preference: String(formData.get("font_preference") || "merriweather"),
    category: String(formData.get("category") || ""),
  });

  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const { title, content, status, font_preference, category } = validated.data;
  const id = String(formData.get("id") || "");

  if (id) {
    const post = await updatePost(id, {
      title,
      content,
      status,
      font_preference,
      category,
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
    category,
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
  const email = normalizeEmail(String(formData.get("email") || ""));
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email." };
  }

  const result = await addSubscriber(email);
  if (!result.ok) {
    return { ok: false, error: result.error || "Could not subscribe." };
  }
  return { ok: true, message: "You're on the list. Thanks for subscribing." };
}
