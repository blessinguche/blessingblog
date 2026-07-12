import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { audioExt, detectAudioKind } from "@/lib/file-magic";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type SavedRecording = {
  id: string;
  url: string;
  created_at: string;
};

export async function saveRecording(file: File): Promise<SavedRecording> {
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Recording must be under 12MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectAudioKind(buffer);
  if (!kind) {
    throw new Error("Unsupported audio format.");
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const id = randomUUID();
  const ext = audioExt(kind);
  const filename = `${id}-voice.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  return {
    id,
    url: `/uploads/${filename}`,
    created_at: new Date().toISOString(),
  };
}
