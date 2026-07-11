"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef } from "react";
import { Small } from "@/lib/tiptap/small";
import { TypographyDashes } from "@/lib/tiptap/typography-dashes";
import { FormatBubbleMenu } from "@/components/editor/format-bubble-menu";
import { EmojiBar } from "@/components/editor/emoji-bar";

const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
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
];

type Props = {
  initialContent: string;
  postId?: string;
  onUpdate: (html: string) => void;
  font: "merriweather" | "typewriter";
};

export function BlessingEditor({
  initialContent,
  postId,
  onUpdate,
  font,
}: Props) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const extensions = useMemo(() => EDITOR_EXTENSIONS, []);

  const editor = useEditor(
    {
      extensions,
      content: initialContent,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      autofocus: "end",
      editorProps: {
        attributes: {
          class: `ProseMirror blessing-editor ${font === "typewriter" ? "font-typewriter" : "font-serif"}`,
          spellcheck: "true",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onUpdateRef.current(ed.getHTML());
      },
    },
    [extensions, postId]
  );

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.classList.toggle("font-typewriter", font === "typewriter");
    dom.classList.toggle("font-serif", font === "merriweather");
  }, [editor, font]);

  if (!editor) {
    return (
      <div className="ProseMirror blessing-editor min-h-[60vh] animate-pulse rounded-sm bg-border/20" />
    );
  }

  return (
    <div className="relative blessing-editor-shell">
      <FormatBubbleMenu editor={editor} />
      <EmojiBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
