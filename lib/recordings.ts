import { randomUUID } from "crypto";
import { audioExt, detectAudioKind } from "@/lib/file-magic";
import { uploadMediaFile } from "@/lib/storage";

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

  const ext = audioExt(kind);
  const contentType =
    kind === "webm"
      ? "audio/webm"
      : kind === "mp4"
        ? "audio/mp4"
        : kind === "ogg"
          ? "audio/ogg"
          : kind === "wav"
            ? "audio/wav"
            : "audio/mpeg";

  const stored = await uploadMediaFile({
    folder: "voice",
    buffer,
    filename: `voice.${ext}`,
    contentType,
  });

  return {
    id: stored.id || randomUUID(),
    url: stored.url,
    created_at: stored.created_at,
  };
}
