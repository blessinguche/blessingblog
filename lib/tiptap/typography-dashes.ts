import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const EN_DASH = "\u2013"; // –
const EM_DASH = "\u2014"; // —

/**
 * `--` → en dash (–), `---` → em dash (—).
 * Uses handleTextInput so conversion runs as you type.
 */
export const TypographyDashes = Extension.create({
  name: "typographyDashes",
  priority: 1000,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("typographyDashes"),
        props: {
          handleTextInput(view, from, to, text) {
            if (text !== "-") return false;

            const $from = view.state.doc.resolve(from);
            const offset = $from.parentOffset;
            const before = $from.parent.textBetween(
              Math.max(0, offset - 2),
              offset,
              undefined,
              "\ufffc"
            );

            // Third hyphen: `--` + `-` or `–` + `-` → em dash
            if (before.endsWith("--") || before.endsWith(EN_DASH)) {
              const charsBack = before.endsWith("--") ? 2 : 1;
              view.dispatch(
                view.state.tr.insertText(EM_DASH, from - charsBack, to)
              );
              return true;
            }

            // Second hyphen: `-` + `-` → en dash
            if (before.endsWith("-")) {
              view.dispatch(view.state.tr.insertText(EN_DASH, from - 1, to));
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
