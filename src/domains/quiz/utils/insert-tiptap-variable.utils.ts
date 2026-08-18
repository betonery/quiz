import type { Editor } from "@tiptap/react";

export type SavedEditorSelection = {
  from: number;
  to: number;
};

export function saveEditorSelection(editor: Editor): SavedEditorSelection {
  const { from, to } = editor.state.selection;
  return { from, to };
}

export function insertVariableChipAtSelection(
  editor: Editor,
  key: string,
  selection?: SavedEditorSelection | null,
) {
  const trimmedKey = key.trim();
  if (!trimmedKey) return;

  const targetSelection = selection ?? {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  };

  editor
    .chain()
    .focus()
    .setTextSelection(targetSelection)
    .insertContent({
      type: "variableChip",
      attrs: { key: trimmedKey },
    })
    .run();
}
