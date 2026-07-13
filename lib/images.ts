import { promises as fs } from "fs";
import path from "path";
import { detectImageKind } from "@/lib/file-magic";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseWriterConfigured } from "@/lib/supabase/env";
import { deleteMediaByUrl, uploadMediaFile } from "@/lib/storage";
import type { GalleryImage } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGES_FILE = path.join(DATA_DIR, "images.json");

function sanitizeFileName(name: string) {
  return name.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 120);
}

async function ensureLocalImageStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(IMAGES_FILE);
  } catch {
    await fs.writeFile(IMAGES_FILE, "[]", "utf8");
  }
}

async function readLocalImages(): Promise<GalleryImage[]> {
  await ensureLocalImageStore();
  const raw = await fs.readFile(IMAGES_FILE, "utf8");
  return JSON.parse(raw) as GalleryImage[];
}

async function writeLocalImages(images: GalleryImage[]) {
  await ensureLocalImageStore();
  await fs.writeFile(IMAGES_FILE, JSON.stringify(images, null, 2), "utf8");
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  if (isSupabaseWriterConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, name, url, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("listGalleryImages", error);
        return [];
      }
      return (data ?? []) as GalleryImage[];
    } catch (err) {
      console.error("listGalleryImages", err);
      return [];
    }
  }

  try {
    const images = await readLocalImages();
    return images.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch (err) {
    console.error("listGalleryImages local", err);
    return [];
  }
}

export async function getGalleryImage(
  id: string
): Promise<GalleryImage | null> {
  const images = await listGalleryImages();
  return images.find((img) => img.id === id) ?? null;
}

export async function saveGalleryImage(file: File): Promise<GalleryImage> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectImageKind(buffer);
  if (!kind) {
    throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed.");
  }

  const ext =
    kind === "jpeg" ? "jpg" : kind === "png" ? "png" : kind === "gif" ? "gif" : "webp";
  const contentType =
    kind === "jpeg"
      ? "image/jpeg"
      : kind === "png"
        ? "image/png"
        : kind === "gif"
          ? "image/gif"
          : "image/webp";

  const stored = await uploadMediaFile({
    folder: "images",
    buffer,
    filename: file.name || `image.${ext}`,
    contentType,
  });

  const image: GalleryImage = {
    id: stored.id,
    name: sanitizeFileName(file.name || stored.path),
    url: stored.url,
    created_at: stored.created_at,
  };

  if (isSupabaseWriterConfigured()) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("gallery_images").insert({
      id: image.id,
      name: image.name,
      url: image.url,
      created_at: image.created_at,
    });
    if (error) {
      console.error("saveGalleryImage metadata", error);
      // File is already uploaded; surface a clear error
      throw new Error(
        'Could not save image metadata. Run supabase/schema.sql (gallery_images table) and try again.'
      );
    }
    return image;
  }

  const images = await readLocalImages();
  images.unshift(image);
  await writeLocalImages(images);
  return image;
}

export async function deleteGalleryImage(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;

  if (isSupabaseWriterConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("gallery_images")
        .select("id, url")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return false;

      await deleteMediaByUrl(data.url as string);
      const { error: deleteError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);

      return !deleteError;
    } catch (err) {
      console.error("deleteGalleryImage", err);
      return false;
    }
  }

  try {
    const images = await readLocalImages();
    const target = images.find((img) => img.id === id);
    if (!target) return false;

    await writeLocalImages(images.filter((img) => img.id !== id));
    await deleteMediaByUrl(target.url);
    return true;
  } catch (err) {
    console.error("deleteGalleryImage local", err);
    return false;
  }
}
