"use server";

import { revalidatePath } from "next/cache";
import { isWriterAuthenticated } from "@/lib/auth";
import {
  deleteGalleryImage,
  listGalleryImages,
  saveGalleryImage,
} from "@/lib/images";
import type { GalleryImage } from "@/lib/types";

async function requireWriter() {
  const ok = await isWriterAuthenticated();
  if (!ok) {
    throw new Error("Unauthorized");
  }
}

export async function uploadImageAction(
  formData: FormData
): Promise<{ ok: true; image: GalleryImage } | { ok: false; error: string }> {
  await requireWriter();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  try {
    const image = await saveGalleryImage(file);
    revalidatePath("/my-images");
    revalidatePath("/write");
    return { ok: true, image };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function deleteImageAction(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authed = await isWriterAuthenticated();
  if (!authed) {
    return { ok: false, error: "You must be logged in to delete images." };
  }

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, error: "Image not found." };
  }

  const deleted = await deleteGalleryImage(id);
  if (!deleted) {
    return { ok: false, error: "Image not found." };
  }

  revalidatePath("/my-images");
  revalidatePath("/write");
  return { ok: true };
}

export async function listImagesAction(): Promise<GalleryImage[]> {
  await requireWriter();
  return listGalleryImages();
}
