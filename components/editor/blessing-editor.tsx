"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useMemo, useRef } from "react";
import { Small } from "@/lib/tiptap/small";
import { TypographyDashes } from "@/lib/tiptap/typography-dashes";
import { VoiceNote } from "@/lib/tiptap/voice-note";
import { FormatBubbleMenu } from "@/components/editor/format-bubble-menu";
import { FormatControls } from "@/components/editor/format-controls";
import { VoiceRecorder } from "@/components/editor/voice-recorder";
import { ImageInsertMenu } from "@/components/editor/image-insert-menu";
import { EmojiBar } from "@/components/editor/emoji-bar";

const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    horizontalRule: false,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: "noopener noreferrer" },
    validate: (href) => {
      const url = href.trim();
      if (!url) return false;
      if (/^javascript:/i.test(url) || /^data:/i.test(url)) return false;
      return /^https?:\/\//i.test(url) || url.startsWith("/");
    },
  }),
  Underline,
  Superscript,
  Subscript,
  Highlight.configure({ multicolor: true }),
  Placeholder.configure({ placeholder: "Write…" }),
  Image.configure({
    inline: false,
    allowBase64: false,
    HTMLAttributes: {
      class: "blessing-editor-image",
    },
  }),
  Small,
  TypographyDashes,
  VoiceNote,
];

type Props = {
  initialContent: string;
  postId?: string;
  onUpdate: (html: string) => void;
  font: "merriweather" | "typewriter";
  onEditorReady?: (editor: Editor | null) => void;
};

export function BlessingEditor({
  initialContent,
  postId,
  onUpdate,
  font,
  onEditorReady,
}: Props) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onReadyRef = useRef(onEditorReady);
  onReadyRef.current = onEditorReady;

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
    onReadyRef.current?.(editor);
  }, [editor]);

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
      <div className="sticky top-12 z-20 -mx-1 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 px-1 py-1.5 border-b border-border/40">
          <FormatControls editor={editor} />
          <span className="hidden sm:inline w-px h-5 bg-border/70 self-center" />
          <VoiceRecorder editor={editor} />
          <ImageInsertMenu editor={editor} />
        </div>
        <EmojiBar editor={editor} />
      </div>
      <FormatBubbleMenu editor={editor} />
      <div className="pt-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
