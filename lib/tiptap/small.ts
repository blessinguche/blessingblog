import { Mark, mergeAttributes } from "@tiptap/core";

export const Small = Mark.create({
  name: "small",

  parseHTML() {
    return [{ tag: "small" }, { style: "font-size", getAttrs: (value) => (typeof value === "string" && parseFloat(value) < 1 ? {} : false) }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["small", mergeAttributes(HTMLAttributes, { class: "text-small" }), 0];
  },

  addCommands() {
    return {
      toggleSmall:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    small: {
      toggleSmall: () => ReturnType;
    };
  }
}
