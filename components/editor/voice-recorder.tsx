"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { uploadRecordingAction } from "@/lib/actions/recordings";

const MAX_MS = 10 * 60 * 1000;

type SpeechRecognitionResultLike = {
  readonly isFinal: boolean;
  readonly 0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SavedClip = {
  url: string;
  duration: number;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function getRecorderMimeType() {
  if (typeof window === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VoiceRecorderInner({ editor }: { editor: Editor }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedClip, setSavedClip] = useState<SavedClip | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const transcriptRef = useRef("");
  const interimRef = useRef("");
  const wantRecordingRef = useRef(false);
  const mimeTypeRef = useRef("audio/webm");

  const syncTranscript = useCallback((value: string) => {
    transcriptRef.current = value;
    setTranscript(value);
  }, []);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const uploadBlob = useCallback(async (blob: Blob, durationMs: number) => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    const type = blob.type || mimeTypeRef.current || "audio/webm";
    formData.set(
      "file",
      new File([blob], `voice-${Date.now()}.webm`, { type })
    );
    const result = await uploadRecordingAction(formData);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedClip({
      url: result.recording.url,
      duration: Math.round(durationMs / 1000),
    });
    setOpen(true);
  }, []);

  const stopRecording = useCallback(() => {
    wantRecordingRef.current = false;
    clearTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    if (interimRef.current.trim()) {
      const merged = `${transcriptRef.current} ${interimRef.current}`.trim();
      syncTranscript(merged);
      interimRef.current = "";
      setInterim("");
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size > 0) {
          void uploadBlob(blob, durationMs);
        }
      };
      recorder.stop();
    }

    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }, [syncTranscript, uploadBlob]);

  const startRecording = useCallback(async () => {
    setError(null);
    setSavedClip(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      wantRecordingRef.current = true;

      const mimeType = getRecorderMimeType();
      mimeTypeRef.current = mimeType || "audio/webm";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);

      const SpeechRecognitionCtor = getSpeechRecognition();
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          let interimText = "";
          let finalChunk = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0]?.transcript ?? "";
            if (result.isFinal) finalChunk += text;
            else interimText += text;
          }
          if (finalChunk) {
            const next = `${transcriptRef.current} ${finalChunk}`.trim();
            syncTranscript(next);
          }
          setInterim(interimText);
          interimRef.current = interimText;
        };
        recognition.onerror = () => {
          // keep recording audio even if speech recognition fails
        };
        recognition.onend = () => {
          if (wantRecordingRef.current) {
            try {
              recognition.start();
            } catch {
              // ignore restart races
            }
          }
        };
        recognitionRef.current = recognition;
        recognition.start();
      }

      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      setOpen(true);
      timerRef.current = window.setInterval(() => {
        const ms = Date.now() - startedAtRef.current;
        setElapsed(ms);
        if (ms >= MAX_MS) {
          stopRecording();
        }
      }, 250);
    } catch {
      setError("Microphone access was blocked.");
      stopRecording();
    }
  }, [stopRecording, syncTranscript]);

  useEffect(() => () => stopRecording(), [stopRecording]);

  const insertTranscript = () => {
    const text = transcriptRef.current.trim();
    if (!text) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "paragraph",
        content: [{ type: "text", text }],
      })
      .run();
  };

  const insertRecording = () => {
    if (!savedClip) return;
    editor
      .chain()
      .focus()
      .insertVoiceNote({
        src: savedClip.url,
        duration: savedClip.duration,
        transcript: transcriptRef.current.trim(),
        label: "Voice note",
      })
      .run();
    setOpen(false);
  };

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (recording ? stopRecording() : void startRecording())}
        disabled={uploading}
        className={`min-w-7 px-1.5 py-1 rounded text-sm transition-colors cursor-pointer disabled:opacity-50 ${
          recording
            ? "bg-red-500/15 text-red-600 dark:text-red-400"
            : "text-foreground/80 hover:bg-border/50"
        }`}
        title={recording ? "Stop recording" : "Record voice note (max 10 min)"}
      >
        {recording ? "■" : "🎤"}
      </button>
      {recording ? (
        <span className="text-xs tabular-nums text-muted-soft">
          {formatTime(elapsed)} / 10:00
        </span>
      ) : uploading ? (
        <span className="text-xs text-muted-soft">Saving…</span>
      ) : null}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="min-w-7 px-1.5 py-1 rounded text-xs text-foreground/80 hover:bg-border/50 transition-colors cursor-pointer"
        title="Recording options"
        aria-expanded={open}
      >
        ▾
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-64 rounded-md border border-border bg-background/95 backdrop-blur-sm p-3 shadow-sm">
          {savedClip ? (
            <figure className="blessing-voice-note mb-3">
              <div className="blessing-voice-note-head">
                <span className="blessing-voice-note-icon" aria-hidden>
                  🎙
                </span>
                <span className="blessing-voice-note-label">Voice note</span>
                <span className="blessing-voice-note-duration">
                  {formatTime(savedClip.duration * 1000)}
                </span>
              </div>
              <audio
                controls
                preload="metadata"
                src={savedClip.url}
                className="blessing-voice-audio"
              />
            </figure>
          ) : null}

          <label className="block text-xs text-muted mb-2" htmlFor="voice-transcript">
            Transcription
          </label>
          <textarea
            id="voice-transcript"
            value={transcript}
            onChange={(e) => syncTranscript(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder={
              recording
                ? "Edit anytime — speech fills in below as you talk…"
                : "Type or edit your transcription here…"
            }
            rows={4}
            className="w-full resize-y min-h-[5rem] max-h-40 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/40"
          />
          {recording && interim ? (
            <p className="mt-1.5 text-xs text-muted-soft italic">
              Listening: {interim}
            </p>
          ) : null}

          {error ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertRecording}
              disabled={!savedClip || uploading}
              className="text-xs text-foreground hover:opacity-70 disabled:opacity-40"
            >
              Insert recording
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertTranscript}
              disabled={!transcript.trim()}
              className="text-xs text-muted hover:text-foreground disabled:opacity-40"
            >
              Insert text only
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                syncTranscript("");
                interimRef.current = "";
                setInterim("");
              }}
              className="text-xs text-muted hover:text-foreground"
            >
              Clear text
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VoiceNoteView({ node, updateAttributes, selected }: NodeViewProps) {
  const src = String(node.attrs.src || "");
  const duration = Math.max(0, Number(node.attrs.duration || 0));
  const label = String(node.attrs.label || "Voice note");
  const [transcript, setTranscript] = useState(String(node.attrs.transcript || ""));

  useEffect(() => {
    setTranscript(String(node.attrs.transcript || ""));
  }, [node.attrs.transcript]);

  const saveTranscript = (value: string) => {
    setTranscript(value);
    updateAttributes({ transcript: value });
  };

  return (
    <NodeViewWrapper
      as="figure"
      data-blessing-voice="true"
      data-duration={String(duration)}
      data-label={label}
      className={`blessing-voice-note ${selected ? "ProseMirror-selectednode" : ""}`}
    >
      <div className="blessing-voice-note-head">
        <span className="blessing-voice-note-icon" aria-hidden>
          🎙
        </span>
        <span className="blessing-voice-note-label">{label}</span>
        <span className="blessing-voice-note-duration">
          {formatTime(duration * 1000)}
        </span>
      </div>
      {src ? (
        <audio
          controls
          preload="metadata"
          src={src}
          className="blessing-voice-audio"
        />
      ) : null}
      <label className="block mt-2 text-xs text-muted" htmlFor={`vn-${node.attrs.src}`}>
        Transcript
      </label>
      <textarea
        id={`vn-${node.attrs.src}`}
        value={transcript}
        onChange={(e) => saveTranscript(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Edit transcription…"
        rows={3}
        className="w-full resize-y min-h-[3rem] rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/40"
      />
    </NodeViewWrapper>
  );
}

export const VoiceRecorder = memo(VoiceRecorderInner);
export const VoiceNoteNodeView = memo(VoiceNoteView);
