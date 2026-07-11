"use client";

import { memo } from "react";
import type { Editor } from "@tiptap/react";

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
] as const;

function EmojiBarInner({ editor }: { editor: Editor }) {
  return (
    <div className="mb-4 flex flex-wrap gap-0.5 opacity-70 hover:opacity-100 transition-opacity">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().insertContent(emoji).run()}
          className="text-lg px-1 py-0.5 rounded hover:bg-border/40 transition-colors cursor-pointer"
          title="Insert emoji"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export const EmojiBar = memo(EmojiBarInner);
