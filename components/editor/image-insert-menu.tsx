"use client";

import { memo, useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Editor } from "@tiptap/react";
import {
  listImagesAction,
  uploadImageAction,
} from "@/lib/actions/images";
import type { GalleryImage } from "@/lib/types";

type Tab = "device" | "camera" | "gallery";

function ImageInsertMenuInner({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("device");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setCameraReady(true);
        }
      } catch {
        setError("Camera access was blocked or unavailable.");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!open) return;
    startTransition(() => {
      void listImagesAction()
        .then(setImages)
        .catch(() => setImages([]));
    });
  }, [open]);

  useEffect(() => {
    if (!open || tab !== "camera") {
      stopCamera();
      return;
    }
    void startCamera();
    return () => stopCamera();
  }, [open, tab, startCamera, stopCamera]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) stopCamera();
  }, [open, stopCamera]);

  const insertUrl = (url: string, alt = "") => {
    editor
      .chain()
      .focus()
      .setImage({ src: url, alt: alt || "image" })
      .run();
    setOpen(false);
  };

  const uploadFile = (file: File | null | undefined) => {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(() => {
      void uploadImageAction(formData)
        .then((result) => {
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setImages((prev) => [result.image, ...prev]);
          insertUrl(result.image.url, result.image.name);
        })
        .catch(() => {
          setError("Upload failed. Try a smaller image or restart the dev server.");
        });
    });
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture photo.");
          return;
        }
        uploadFile(
          new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
        );
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="min-w-7 px-1.5 py-1 rounded text-sm text-foreground/80 hover:bg-border/50 transition-colors cursor-pointer"
        title="Insert image"
        aria-expanded={open}
      >
        🖼
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-52 rounded-md border border-border bg-background/95 backdrop-blur-sm p-2.5 shadow-sm">
          <div className="flex gap-1 mb-2.5 text-xs">
            {(
              [
                ["device", "Device"],
                ["camera", "Camera"],
                ["gallery", "Gallery"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTab(id)}
                className={`px-1.5 py-1 rounded transition-colors ${
                  tab === id
                    ? "bg-border/70 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "device" ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  uploadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={pending}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="w-full text-sm py-2 border border-border rounded hover:bg-border/30 disabled:opacity-50"
              >
                {pending ? "Uploading…" : "Choose from device"}
              </button>
            </div>
          ) : null}

          {tab === "camera" ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full aspect-[4/3] rounded border border-border/60 bg-border/20 object-cover"
              />
              <button
                type="button"
                disabled={pending || !cameraReady}
                onMouseDown={(e) => e.preventDefault()}
                onClick={capturePhoto}
                className="w-full text-sm py-2 border border-border rounded hover:bg-border/30 disabled:opacity-50"
              >
                {pending ? "Uploading…" : "Take photo"}
              </button>
              <input
                ref={cameraFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  uploadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={pending}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => cameraFileRef.current?.click()}
                className="w-full text-xs py-1.5 text-muted hover:text-foreground"
              >
                Open native camera instead
              </button>
            </div>
          ) : null}

          {tab === "gallery" ? (
            <div className="max-h-44 overflow-y-auto">
              {pending && images.length === 0 ? (
                <p className="text-sm text-muted-soft">Loading…</p>
              ) : images.length === 0 ? (
                <p className="text-sm text-muted-soft">
                  No images yet. Upload one from Device or Camera.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertUrl(img.url, img.name)}
                      className="aspect-square overflow-hidden rounded border border-border/60 hover:opacity-80"
                      title={img.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {error ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const ImageInsertMenu = memo(ImageInsertMenuInner);
