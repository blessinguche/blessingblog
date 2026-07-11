"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { Small } from "@/lib/tiptap/small";
import { TypographyDashes } from "@/lib/tiptap/typography-dashes";

const PASTELS = [
  { name: "yellow", color: "#fff3a3" },
  { name: "pink", color: "#ffd6e7" },
  { name: "blue", color: "#cce5ff" },
  { name: "green", color: "#d4f5d4" },
  { name: "lavender", color: "#e8d9ff" },
] as const;

const EMOJIS = [
  "🤣",
  "😍",
  "🤭",
  "😭",
  "😈",
  "💀",
  "🥱",
  "🥺",
  "💞",
  "💜",
  "⭐",
  "✨",
  "🔥",
  "💡",
  "📌",
  "💭",
  "📝",
  "💻",
  "📱",
  "🌙",
  "☀️",
  "⛅",
  "⏰",
  "☕",
  "✉️",
  "🔗",
  "🧠",
  "👀",
  "🫩",
  "🙏",
  "🎉",
  "🎧",
  "💤",
  "🌶️",
  "✅",
  "❌",
];

type Props = {
  content: string;
  onChange: (html: string) => void;
  font: "merriweather" | "typewriter";
};

export function BlessingEditor({ content, onChange, font }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // `---` should become an em dash, not a horizontal rule
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Underline,
      Superscript,
      Subscript,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "Write…" }),
      Small,
      TypographyDashes,
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `ProseMirror ${font === "typewriter" ? "font-typewriter" : "font-serif"}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.classList.toggle("font-typewriter", font === "typewriter");
    dom.classList.toggle("font-serif", font === "merriweather");
  }, [editor, font]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  return (
    <div className="relative">
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120 }}
        className="flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-background px-1 py-1 shadow-sm text-sm"
      >
        <MenuBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          className="font-bold"
        />
        <MenuBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          className="italic"
        />
        <MenuBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="U"
          className="underline"
          title="Underline"
        />
        <MenuBtn
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          label="x²"
          title="Superscript"
        />
        <MenuBtn
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          label="x₂"
          title="Subscript"
        />
        <MenuBtn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="T"
          title="Title"
        />
        <MenuBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H"
          title="Heading"
        />
        <MenuBtn
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="S"
          title="Subheading"
        />
        <MenuBtn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="“"
          title="Quote"
        />
        <MenuBtn
          active={editor.isActive("small")}
          onClick={() => editor.chain().focus().toggleSmall().run()}
          label="sm"
          title="Small text"
        />
        <MenuBtn
          active={editor.isActive("link")}
          onClick={setLink}
          label="🔗"
          title="Link"
        />
        {PASTELS.map((p) => (
          <button
            key={p.name}
            type="button"
            title={`Highlight ${p.name}`}
            onClick={() =>
              editor.chain().focus().toggleHighlight({ color: p.color }).run()
            }
            className={`h-5 w-5 rounded-sm border border-border/60 ${
              editor.isActive("highlight", { color: p.color })
                ? "ring-1 ring-foreground"
                : ""
            }`}
            style={{ background: p.color }}
          />
        ))}
      </BubbleMenu>

      <div className="mb-4 flex flex-wrap gap-1 opacity-70 hover:opacity-100 transition-opacity">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => insertEmoji(emoji)}
            className="text-lg px-1 hover:scale-110 transition-transform"
            title="Insert emoji"
          >
            {emoji}
          </button>
        ))}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function MenuBtn({
  active,
  onClick,
  label,
  className = "",
  title,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`min-w-7 px-1.5 py-1 rounded text-foreground/80 hover:bg-border/50 ${
        active ? "bg-border/70" : ""
      } ${className}`}
    >
      {label}
    </button>
  );
}
