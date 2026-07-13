"use client";

import { useRef, useState, useTransition } from "react";
import {
  deleteImageAction,
  uploadImageAction,
} from "@/lib/actions/images";
import type { GalleryImage } from "@/lib/types";

export function ImageGallery({
  images: initialImages,
  canManage,
}: {
  images: GalleryImage[];
  canManage: boolean;
}) {
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = (file: File | null | undefined) => {
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
        })
        .catch(() => {
          setError("Upload failed. Try a smaller image or restart the dev server.");
        });
    });
  };

  return (
    <div>
      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {canManage ? (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="text-sm border border-border px-3 py-1.5 rounded hover:bg-border/30 disabled:opacity-50"
          >
            {pending ? "Uploading…" : "Add image"}
          </button>
        </div>
      ) : null}

      {images.length === 0 ? (
        <p className="text-muted">No images yet.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {images.map((img) => (
            <li key={img.id} className="group relative">
              <figure className="overflow-hidden rounded-sm bg-border/20 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
              </figure>
              <figcaption className="mt-1.5 text-xs text-muted truncate">
                {img.name}
              </figcaption>
              {canManage ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError(null);
                    const formData = new FormData(e.currentTarget);
                    startTransition(() => {
                      void deleteImageAction(formData)
                        .then((result) => {
                          if (!result.ok) {
                            setError(result.error);
                            return;
                          }
                          setImages((prev) =>
                            prev.filter((i) => i.id !== img.id)
                          );
                        })
                        .catch(() => {
                          setError("Could not delete image.");
                        });
                    });
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <input type="hidden" name="id" value={img.id} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="text-xs bg-background/90 border border-border px-2 py-1 rounded hover:text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
