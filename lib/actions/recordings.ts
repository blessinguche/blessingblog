"use server";

import { isWriterAuthenticated } from "@/lib/auth";
import { saveRecording } from "@/lib/recordings";
import type { SavedRecording } from "@/lib/recordings";

async function requireWriter() {
  const ok = await isWriterAuthenticated();
  if (!ok) {
    throw new Error("Unauthorized");
  }
}

export async function uploadRecordingAction(
  formData: FormData
): Promise<
  { ok: true; recording: SavedRecording } | { ok: false; error: string }
> {
  await requireWriter();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No recording to upload." };
  }
  try {
    const recording = await saveRecording(file);
    return { ok: true, recording };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}
