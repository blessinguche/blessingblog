"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { POST_CATEGORIES, type PostCategoryId } from "@/lib/categories";
import { debounce } from "@/lib/debounce";

export type TocHeading = {
  id: string;
  level: number;
  text: string;
};

function slugifyHeading(text: string, index: number) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return `h-${base || "section"}-${index}`;
}

function collectHeadings(editor: Editor): TocHeading[] {
  const headings: TocHeading[] = [];
  let index = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "heading") {
      const text = node.textContent.trim();
      if (text) {
        headings.push({
          id: slugifyHeading(text, index),
          level: node.attrs.level as number,
          text,
        });
        index += 1;
      }
    }
  });
  return headings;
}

function WriteTocInner({
  editor,
  title,
  category,
  onCategoryChange,
}: {
  editor: Editor | null;
  title: string;
  category: PostCategoryId | null;
  onCategoryChange: (category: PostCategoryId | null) => void;
}) {
  const [headings, setHeadings] = useState<TocHeading[]>([]);

  const debouncedSync = useMemo(
    () =>
      debounce((ed: Editor) => {
        setHeadings(collectHeadings(ed));
      }, 200),
    []
  );

  useEffect(() => {
    if (!editor) return;
    const sync = () => debouncedSync(editor);
    setHeadings(collectHeadings(editor));
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor, debouncedSync]);

  const scrollToHeading = (heading: TocHeading) => {
    if (!editor) return;
    let index = 0;
    let pos: number | null = null;
    editor.state.doc.descendants((node, nodePos) => {
      if (node.type.name === "heading") {
        const text = node.textContent.trim();
        if (text) {
          const id = slugifyHeading(text, index);
          if (id === heading.id) {
            pos = nodePos;
            return false;
          }
          index += 1;
        }
      }
    });
    if (pos == null) return;
    editor.chain().focus().setTextSelection(pos + 1).run();
    const dom = editor.view.nodeDOM(pos);
    if (dom instanceof HTMLElement) {
      dom.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <aside className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pl-2 text-sm">
        <p className="text-xs uppercase tracking-wide text-muted-soft mb-3">
          Outline
        </p>

        <div className="mb-5 space-y-1 border-l border-border/70">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("write-title-input")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="block w-full text-left pl-3 py-0.5 text-foreground/90 hover:text-foreground truncate"
            title={title || "Untitled"}
          >
            {title || "Untitled"}
          </button>
          {headings.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => scrollToHeading(h)}
              className="block w-full text-left py-0.5 text-muted hover:text-foreground truncate"
              style={{ paddingLeft: `${0.75 + (h.level - 1) * 0.65}rem` }}
              title={h.text}
            >
              {h.text}
            </button>
          ))}
          {headings.length === 0 ? (
            <p className="pl-3 py-1 text-xs text-muted-soft">
              Add headings as you write
            </p>
          ) : null}
        </div>

        <p className="text-xs uppercase tracking-wide text-muted-soft mb-2">
          Categories
        </p>
        <ul className="space-y-1 border-l border-border/70">
          {POST_CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onCategoryChange(active ? null : c.id)}
                  className={`flex items-center gap-1.5 w-full text-left pl-3 py-0.5 transition-colors ${
                    active
                      ? "text-foreground font-medium"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <span aria-hidden>{c.emoji}</span>
                  <span>{c.hash}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export const WriteToc = memo(WriteTocInner);
