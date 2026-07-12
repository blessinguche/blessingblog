export type ImageKind = "jpeg" | "png" | "gif" | "webp";
export type AudioKind = "webm" | "mp4" | "ogg" | "wav" | "mp3";

export function detectImageKind(buffer: Buffer): ImageKind | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "gif";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export function detectAudioKind(buffer: Buffer): AudioKind | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "webm";
  }
  if (buffer.toString("ascii", 0, 4) === "OggS") {
    return "ogg";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  ) {
    return "wav";
  }
  if (buffer.toString("ascii", 0, 3) === "ID3") {
    return "mp3";
  }
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return "mp3";
  }
  if (buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
    return "mp4";
  }

  return null;
}

export function imageMime(kind: ImageKind) {
  return {
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  }[kind];
}

export function audioExt(kind: AudioKind) {
  return {
    webm: "webm",
    mp4: "m4a",
    ogg: "ogg",
    wav: "wav",
    mp3: "mp3",
  }[kind];
}
