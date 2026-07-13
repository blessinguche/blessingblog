import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  detectImageKind,
} from "@/lib/file-magic";
import type { GalleryImage } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGES_FILE = path.join(DATA_DIR, "images.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureImageStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  try {
    await fs.access(IMAGES_FILE);
  } catch {
    await fs.writeFile(IMAGES_FILE, "[]", "utf8");
  }
}

async function readImages(): Promise<GalleryImage[]> {
  await ensureImageStore();
  const raw = await fs.readFile(IMAGES_FILE, "utf8");
  return JSON.parse(raw) as GalleryImage[];
}

async function writeImages(images: GalleryImage[]) {
  await ensureImageStore();
  await fs.writeFile(IMAGES_FILE, JSON.stringify(images, null, 2), "utf8");
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  const images = await readImages();
  return images.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getGalleryImage(
  id: string
): Promise<GalleryImage | null> {
  const images = await readImages();
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

  await ensureImageStore();
  const id = randomUUID();
  const ext =
    kind === "jpeg" ? "jpg" : kind === "png" ? "png" : kind === "gif" ? "gif" : "webp";
  const safeName = (file.name || `image.${ext}`)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const filename = `${id}-${safeName}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  const image: GalleryImage = {
    id,
    name: sanitizeFileName(file.name || filename),
    url: `/uploads/${filename}`,
    created_at: new Date().toISOString(),
  };

  const images = await readImages();
  images.unshift(image);
  await writeImages(images);
  return image;
}

function sanitizeFileName(name: string) {
  return name.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 120);
}

export async function deleteGalleryImage(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;

  const images = await readImages();
  const target = images.find((img) => img.id === id);
  if (!target) return false;

  const next = images.filter((img) => img.id !== id);
  await writeImages(next);

  const filename = path.basename(target.url);
  if (!filename || filename.includes("..")) return true;

  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    // file may already be gone
  }
  return true;
}
