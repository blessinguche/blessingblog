"use client";

"use client";

import { memo, type MouseEvent } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { isSafeLinkUrl } from "@/lib/sanitize";

export const PASTELS = [
  { name: "yellow", color: "#fff3a3" },
  { name: "pink", color: "#ffd6e7" },
  { name: "blue", color: "#cce5ff" },
  { name: "green", color: "#d4f5d4" },
  { name: "lavender", color: "#e8d9ff" },
] as const;

export function useFormatState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      underline: ed.isActive("underline"),
      superscript: ed.isActive("superscript"),
      subscript: ed.isActive("subscript"),
      h1: ed.isActive("heading", { level: 1 }),
      h2: ed.isActive("heading", { level: 2 }),
      h3: ed.isActive("heading", { level: 3 }),
      quote: ed.isActive("blockquote"),
      small: ed.isActive("small"),
      link: ed.isActive("link"),
      highlights: PASTELS.map((p) => ({
        name: p.name,
        color: p.color,
        active: ed.isActive("highlight", { color: p.color }),
      })),
    }),
  });
}

export function setEditorLink(editor: Editor) {
  const previous = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Link URL", previous || "https://");
  if (url === null) return;
  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  if (!isSafeLinkUrl(url)) {
    window.alert("Only http(s) links and site paths are allowed.");
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

export function FormatControls({
  editor,
  className = "",
}: {
  editor: Editor;
  className?: string;
}) {
  const fmt = useFormatState(editor);

  return (
    <div className={`flex flex-wrap items-center gap-0.5 text-sm ${className}`}>
      <MenuBtn
        active={fmt.bold}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="B"
        className="font-bold"
        title="Bold (Ctrl+B)"
      />
      <MenuBtn
        active={fmt.italic}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="I"
        className="italic"
        title="Italic (Ctrl+I)"
      />
      <MenuBtn
        active={fmt.underline}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="U"
        className="underline"
        title="Underline (Ctrl+U)"
      />
      <MenuBtn
        active={fmt.superscript}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        label="x²"
        title="Superscript"
      />
      <MenuBtn
        active={fmt.subscript}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        label="x₂"
        title="Subscript"
      />
      <MenuBtn
        active={fmt.h1}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        label="T"
        title="Title"
      />
      <MenuBtn
        active={fmt.h2}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="H"
        title="Heading"
      />
      <MenuBtn
        active={fmt.h3}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="S"
        title="Subheading"
      />
      <MenuBtn
        active={fmt.quote}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="“"
        title="Quote"
      />
      <MenuBtn
        active={fmt.small}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleSmall().run()}
        label="sm"
        title="Small text"
      />
      <MenuBtn
        active={fmt.link}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setEditorLink(editor)}
        label="🔗"
        title="Link"
      />
      {fmt.highlights.map((p) => (
        <button
          key={p.name}
          type="button"
          title={`Highlight ${p.name}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHighlight({ color: p.color }).run()
          }
          className={`h-5 w-5 rounded-sm border border-border/60 cursor-pointer ${
            p.active ? "ring-1 ring-foreground" : ""
          }`}
          style={{ background: p.color }}
        />
      ))}
    </div>
  );
}

export function MenuBtn({
  active,
  onClick,
  onMouseDown,
  label,
  className = "",
  title,
}: {
  active?: boolean;
  onClick: () => void;
  onMouseDown?: (e: MouseEvent) => void;
  label: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className={`min-w-7 px-1.5 py-1 rounded text-foreground/80 hover:bg-border/50 transition-colors cursor-pointer ${
        active ? "bg-border/70" : ""
      } ${className}`}
    >
      {label}
    </button>
  );
}

export const FormatControlsMemo = memo(FormatControls);
