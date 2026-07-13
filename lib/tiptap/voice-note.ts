import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VoiceNoteNodeView } from "@/components/editor/voice-recorder";
import { isSafeUploadPath, sanitizePlainText } from "@/lib/sanitize";

export type VoiceNoteAttrs = {
  src: string;
  duration?: number;
  transcript?: string;
  label?: string;
};

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const VoiceNote = Node.create({
  name: "voiceNote",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addNodeView() {
    return ReactNodeViewRenderer(VoiceNoteNodeView);
  },

  addAttributes() {
    return {
      src: { default: null },
      duration: { default: 0 },
      transcript: { default: "" },
      label: { default: "Voice note" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-blessing-voice="true"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const audio = element.querySelector("audio");
          const transcript = element.querySelector(
            ".blessing-voice-transcript-text"
          );
          return {
            src: audio?.getAttribute("src") || null,
            duration: Number(element.getAttribute("data-duration") || 0),
            transcript: transcript?.textContent?.trim() || "",
            label: element.getAttribute("data-label") || "Voice note",
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const raw = node.attrs as VoiceNoteAttrs;
    const src = isSafeUploadPath(String(raw.src || "")) ? raw.src : "";
    const duration = Math.max(0, Number(raw.duration || 0));
    const transcript = sanitizePlainText(String(raw.transcript || ""), 20_000);
    const label = sanitizePlainText(String(raw.label || "Voice note"), 80);
    const durationLabel = formatDuration(duration);
    const children: (string | [string, Record<string, string>, ...unknown[]])[] =
      [
        [
          "div",
          { class: "blessing-voice-note-head" },
          ["span", { class: "blessing-voice-note-icon", "aria-hidden": "true" }, "🎙"],
          [
            "span",
            { class: "blessing-voice-note-label" },
            label || "Voice note",
          ],
          [
            "span",
            { class: "blessing-voice-note-duration" },
            durationLabel,
          ],
        ],
        [
          "audio",
          {
            controls: "true",
            preload: "metadata",
            src: src || "",
            class: "blessing-voice-audio",
          },
        ],
      ];

    if (transcript?.trim()) {
      children.push([
        "details",
        { class: "blessing-voice-transcript" },
        ["summary", {}, "Transcript"],
        [
          "p",
          { class: "blessing-voice-transcript-text" },
          transcript.trim(),
        ],
      ]);
    }

    return [
      "figure",
      mergeAttributes({
        "data-blessing-voice": "true",
        "data-duration": String(duration || 0),
        "data-label": label || "Voice note",
        class: "blessing-voice-note",
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      insertVoiceNote:
        (attrs: VoiceNoteAttrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    voiceNote: {
      insertVoiceNote: (attrs: VoiceNoteAttrs) => ReturnType;
    };
  }
}
