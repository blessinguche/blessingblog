"use client";

import { memo } from "react";
import { BubbleMenu, type Editor } from "@tiptap/react";
import { FormatControls } from "@/components/editor/format-controls";

function FormatBubbleMenuInner({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 80,
        animation: "shift-away-subtle",
        moveTransition: "transform 0.12s ease-out",
      }}
      className="rounded-md border border-border bg-background/95 backdrop-blur-sm px-1 py-1 shadow-sm"
    >
      <FormatControls editor={editor} />
    </BubbleMenu>
  );
}

export const FormatBubbleMenu = memo(FormatBubbleMenuInner);
