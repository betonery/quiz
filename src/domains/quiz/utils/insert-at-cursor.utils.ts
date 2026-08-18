export type TextFieldSelection = {
  start: number;
  end: number;
};

export function getTextFieldSelection(
  element: HTMLInputElement | HTMLTextAreaElement,
): TextFieldSelection {
  return {
    start: element.selectionStart ?? element.value.length,
    end: element.selectionEnd ?? element.value.length,
  };
}

export function insertSnippetAtCursor(
  currentValue: string,
  selection: TextFieldSelection,
  snippet: string,
): { nextValue: string; cursor: number; cursorOffset?: number } {
  const nextValue =
    currentValue.slice(0, selection.start) +
    snippet +
    currentValue.slice(selection.end);

  return {
    nextValue,
    cursor: selection.start + snippet.length,
  };
}

export function applyTextFieldInsertion(
  element: HTMLInputElement | HTMLTextAreaElement,
  currentValue: string,
  snippet: string,
  onValueChange: (nextValue: string) => void,
  selection?: TextFieldSelection,
  cursorOffset?: number,
) {
  const resolvedSelection = selection ?? getTextFieldSelection(element);
  const { nextValue, cursor } = insertSnippetAtCursor(
    currentValue,
    resolvedSelection,
    snippet,
  );

  onValueChange(nextValue);

  requestAnimationFrame(() => {
    element.focus();
    const nextCursor =
      cursorOffset !== undefined
        ? resolvedSelection.start + cursorOffset
        : cursor;
    element.setSelectionRange(nextCursor, nextCursor);
  });
}

export function buildVariableSnippet(key: string): string {
  return `{{${key}}}`;
}
