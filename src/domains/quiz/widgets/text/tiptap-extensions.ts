import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { VariableChipExtension } from "@/domains/quiz/widgets/text/tiptap-variable-extension";

export function getTextEditorExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    VariableChipExtension,
  ];
}
