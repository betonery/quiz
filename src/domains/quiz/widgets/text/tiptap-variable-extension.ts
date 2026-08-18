import { mergeAttributes, Node } from "@tiptap/core";

export const VARIABLE_CHIP_NODE = "variableChip";

export const VariableChipExtension = Node.create({
  name: VARIABLE_CHIP_NODE,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable"),
        renderHTML: (attributes) => ({
          "data-variable": attributes.key,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const key = node.attrs.key ?? "variavel";
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "text-widget-variable-chip",
        "data-variable": key,
      }),
      `{{${key}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.key ?? "variavel"}}}`;
  },
});
