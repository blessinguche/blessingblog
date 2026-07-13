"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Editor } from "@tiptap/react";
import { BlessingEditor } from "@/components/editor/blessing-editor";
import { WriteToc } from "@/components/editor/write-toc";
import { ThemeToggle } from "@/components/theme-toggle";
import { PostContent } from "@/components/post-content";
import { savePostAction, deletePostAction } from "@/lib/actions/posts";
import { POST_CATEGORIES, type PostCategoryId } from "@/lib/categories";
import { wordCountFromHtml } from "@/lib/utils";
import { debounce } from "@/lib/debounce";
import type { FontPreference, Post } from "@/lib/types";
import { logoutAction } from "@/lib/actions/auth";

type Props = {
  post?: Post | null;
  drafts?: Post[];
};

export function WriteShell({ post, drafts = [] }: Props) {
  const initialContent = post?.content || "";
  const contentRef = useRef(initialContent);
  const [title, setTitle] = useState(post?.title || "");
  const [category, setCategory] = useState<PostCategoryId | null>(
    post?.category ?? null
  );
  const [previewHtml, setPreviewHtml] = useState(initialContent);
  const [words, setWords] = useState(() => wordCountFromHtml(initialContent));
  const [font, setFont] = useState<FontPreference>(
    post?.font_preference || "merriweather"
  );
  const [preview, setPreview] = useState(false);
  const [pending, startTransition] = useTransition();
  const [editor, setEditor] = useState<Editor | null>(null);

  const debouncedWordCount = useMemo(
    () =>
      debounce((html: string) => {
        setWords(wordCountFromHtml(html));
      }, 200),
    []
  );

  const handleEditorUpdate = useCallback(
    (html: string) => {
      contentRef.current = html;
      debouncedWordCount(html);
    },
    [debouncedWordCount]
  );

  const togglePreview = () => {
    if (!preview) {
      setPreviewHtml(contentRef.current);
    }
    setPreview((p) => !p);
  };

  const submit = (status: "draft" | "published") => {
    const formData = new FormData();
    if (post?.id) formData.set("id", post.id);
    formData.set("title", title || "Untitled");
    formData.set("content", contentRef.current);
    formData.set("status", status);
    formData.set("font_preference", font);
    if (category) formData.set("category", category);
    startTransition(() => {
      void savePostAction(formData);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-12 flex items-center justify-between gap-3 text-sm text-muted">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="font-bold text-foreground no-underline shrink-0"
            >
              Blessing
            </Link>
            <button
              type="button"
              onClick={() =>
                setFont((f) =>
                  f === "merriweather" ? "typewriter" : "merriweather"
                )
              }
              className={`hover:text-foreground transition-colors shrink-0 ${
                font === "typewriter"
                  ? "text-foreground font-semibold"
                  : "text-muted"
              }`}
              title={
                font === "typewriter"
                  ? "Typewriter font (IBM Plex Mono) — click for serif"
                  : "Serif font (Merriweather) — click for typewriter"
              }
            >
              TT
            </button>
            <span className="text-muted-soft tabular-nums shrink-0">
              {words} {words === 1 ? "word" : "words"}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={togglePreview}
              className="hover:text-foreground transition-colors"
              title="Preview"
            >
              {preview ? "Edit" : "Preview"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("draft")}
              className="hover:text-foreground transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("published")}
              className="text-foreground font-medium hover:opacity-70 disabled:opacity-50"
            >
              Publish
            </button>
            <form action={logoutAction}>
              <button
                type="submit"
                className="hover:text-foreground transition-colors"
              >
                Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1">
        {drafts.length > 0 && !post ? (
          <div className="mb-10">
            <p className="text-sm text-muted mb-3">Recent drafts & posts</p>
            <ul className="space-y-2 text-sm">
              {drafts.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/write/${d.id}`}
                    className="text-muted no-underline hover:text-foreground"
                  >
                    {d.title || "Untitled"}
                    <span className="text-muted-soft ml-2">{d.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <hr className="mt-8 border-border" />
          </div>
        ) : null}

        {preview ? (
          <article className="font-serif max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {title || "Untitled"}
            </h1>
            {category ? (
              <p className="text-sm text-muted mb-6">
                {POST_CATEGORIES.find((c) => c.id === category)?.emoji}{" "}
                {POST_CATEGORIES.find((c) => c.id === category)?.hash}
              </p>
            ) : (
              <div className="mb-6" />
            )}
            <PostContent html={previewHtml} />
          </article>
        ) : (
          <div className="flex gap-8 items-start">
            <div
              className={`min-w-0 flex-1 max-w-3xl ${
                font === "typewriter" ? "font-typewriter" : "font-serif"
              }`}
            >
              <input
                id="write-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent text-3xl sm:text-4xl font-bold outline-none placeholder:text-muted-soft mb-3"
              />
              <label className="block mb-5">
                <span className="sr-only">Category</span>
                <select
                  value={category ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCategory(
                      value === "" ? null : (value as PostCategoryId)
                    );
                  }}
                  className="bg-transparent text-sm text-muted outline-none border border-border/70 rounded px-2 py-1.5 cursor-pointer hover:border-border focus:border-border"
                >
                  <option value="">Select category…</option>
                  {POST_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.hash}
                    </option>
                  ))}
                </select>
              </label>
              <BlessingEditor
                key={post?.id ?? "new"}
                postId={post?.id}
                initialContent={initialContent}
                onUpdate={handleEditorUpdate}
                font={font}
                onEditorReady={(ed) => setEditor(ed)}
              />
            </div>
            <WriteToc
              editor={editor}
              title={title}
              category={category}
              onCategoryChange={setCategory}
            />
          </div>
        )}

        {post ? (
          <form
            action={deletePostAction}
            className="mt-16 pt-8 border-t border-border max-w-3xl"
          >
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="text-sm text-muted-soft hover:text-red-600 transition-colors"
            >
              Delete post
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
