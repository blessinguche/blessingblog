import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseUrl,
  isSupabaseWriterConfigured,
} from "@/lib/supabase/env";

export const MEDIA_BUCKET = "media";

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type StoredFile = {
  id: string;
  path: string;
  url: string;
  created_at: string;
};

function isServerlessReadOnly() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export async function uploadMediaFile(options: {
  folder: "voice" | "images";
  buffer: Buffer;
  filename: string;
  contentType: string;
}): Promise<StoredFile> {
  const id = randomUUID();
  const safeFilename = options.filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
  const objectPath = `${options.folder}/${id}-${safeFilename}`;

  if (isSupabaseWriterConfigured()) {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, options.buffer, {
        contentType: options.contentType,
        upsert: false,
      });

    if (error) {
      // Common first-run failure: bucket missing
      if (
        error.message.toLowerCase().includes("bucket") ||
        error.message.toLowerCase().includes("not found")
      ) {
        throw new Error(
          'Storage bucket "media" is missing. Run supabase/schema.sql in Supabase (storage section), then try again.'
        );
      }
      throw new Error(error.message || "Upload to storage failed.");
    }

    const base = getSupabaseUrl()?.replace(/\/$/, "") || "";
    const url = `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${objectPath}`;

    return {
      id,
      path: objectPath,
      url,
      created_at: new Date().toISOString(),
    };
  }

  if (isServerlessReadOnly()) {
    throw new Error(
      "File uploads need Supabase Storage in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, then run supabase/schema.sql."
    );
  }

  await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  const localName = `${id}-${safeFilename}`;
  await fs.writeFile(path.join(LOCAL_UPLOADS_DIR, localName), options.buffer);

  return {
    id,
    path: localName,
    url: `/uploads/${localName}`,
    created_at: new Date().toISOString(),
  };
}

export async function deleteMediaByUrl(url: string): Promise<void> {
  if (!url) return;

  if (url.startsWith("/uploads/")) {
    if (isServerlessReadOnly()) return;
    const filename = path.basename(url);
    if (!filename || filename.includes("..")) return;
    try {
      await fs.unlink(path.join(LOCAL_UPLOADS_DIR, filename));
    } catch {
      // ignore missing files
    }
    return;
  }

  if (!isSupabaseWriterConfigured()) return;

  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const objectPath = url.slice(idx + marker.length);
  if (!objectPath || objectPath.includes("..")) return;

  try {
    const supabase = createAdminClient();
    await supabase.storage.from(MEDIA_BUCKET).remove([objectPath]);
  } catch {
    // ignore
  }
}
