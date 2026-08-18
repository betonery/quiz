"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Braces,
  Eraser,
  Highlighter,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPickerCore } from "@/domains/quiz/components/builder/color-picker-core";
import { VariableKeyCombobox } from "@/domains/quiz/components/variables/variable-key-combobox";
import {
  insertVariableChipAtSelection,
  saveEditorSelection,
  type SavedEditorSelection,
} from "@/domains/quiz/utils/insert-tiptap-variable.utils";
import { cn } from "@/lib/utils";

type TextRichEditorToolbarProps = {
  editor: Editor | null;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-8 shrink-0 text-foreground",
        active && "bg-muted text-primary",
      )}
    >
      {children}
    </Button>
  );
}

export function TextRichEditorToolbar({ editor }: TextRichEditorToolbarProps) {
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const savedSelectionRef = useRef<SavedEditorSelection | null>(null);

  if (!editor) return null;

  function openVariablePicker() {
    if (!editor) return;
    savedSelectionRef.current = saveEditorSelection(editor);
    setShowVariablePicker((current) => !current);
  }

  function insertVariable(key: string) {
    if (!editor || !key.trim()) return;
    insertVariableChipAtSelection(editor, key, savedSelectionRef.current);
    savedSelectionRef.current = null;
    setShowVariablePicker(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <ToolbarButton
          label="Negrito"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Itálico"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Sublinhado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Tachado"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <ColorPickerCore
          label="Cor do texto"
          layout="compact"
          value={editor.getAttributes("textStyle").color ?? "#0f172a"}
          onChange={(color) => editor.chain().focus().setColor(color).run()}
        />

        <ColorPickerCore
          label="Cor de destaque"
          layout="compact"
          value={editor.getAttributes("highlight").color ?? "#fef08a"}
          onChange={(color) =>
            editor.chain().focus().toggleHighlight({ color }).run()
          }
          overlay={
            <Highlighter className="pointer-events-none absolute inset-0 m-auto size-3.5 text-muted-foreground" />
          }
        />

        <ToolbarButton
          label="Limpar formatação"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
        >
          <Eraser className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Inserir variável"
          active={showVariablePicker}
          onClick={openVariablePicker}
        >
          <Braces className="size-4" />
        </ToolbarButton>
      </div>

      {showVariablePicker ? (
        <div className="rounded-lg border border-border bg-background p-2 shadow-sm">
          <VariableKeyCombobox
            intent="reference"
            onSelect={insertVariable}
            placeholder="Selecionar variável..."
          />
        </div>
      ) : null}
    </div>
  );
}
