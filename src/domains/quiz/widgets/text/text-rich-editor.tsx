"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { TextWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  plainContentToRichJson,
  richContentToPlainText,
} from "@/domains/quiz/utils/text-rich-content.utils";
import { getTextEditorExtensions } from "@/domains/quiz/widgets/text/tiptap-extensions";
import { TextRichEditorToolbar } from "@/domains/quiz/widgets/text/text-rich-editor-toolbar";
import { cn } from "@/lib/utils";

type TextRichEditorProps = {
  config: TextWidgetConfig;
  onChange: (config: TextWidgetConfig) => void;
};

const weightMap = {
  normal: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

const alignMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function getInitialRichContent(config: TextWidgetConfig): string {
  if (config.contentMode === "rich" && config.richContent) {
    return config.richContent;
  }
  return plainContentToRichJson(config.content);
}

export function TextRichEditor({ config, onChange }: TextRichEditorProps) {
  const bootstrappedRef = useRef(false);
  const configRef = useRef(config);
  configRef.current = config;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getTextEditorExtensions(),
    content: JSON.parse(getInitialRichContent(config)),
    editorProps: {
      attributes: {
        class: "min-h-[120px] w-full px-3 py-2 outline-none max-w-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const richContent = JSON.stringify(currentEditor.getJSON());
      const content = richContentToPlainText(richContent);

      onChange({
        ...configRef.current,
        contentMode: "rich",
        richContent,
        content,
      });
    },
  });

  useEffect(() => {
    if (!editor || bootstrappedRef.current) return;

    if (config.contentMode !== "rich") {
      const richContent = plainContentToRichJson(config.content);
      editor.commands.setContent(JSON.parse(richContent));
      bootstrappedRef.current = true;
      onChange({
        ...config,
        contentMode: "rich",
        richContent,
        content: config.content,
      });
      return;
    }

    bootstrappedRef.current = true;
  }, [config, editor, onChange]);

  return (
    <div className="space-y-2">
      <TextRichEditorToolbar editor={editor} />
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-white shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring/30",
          "[&_.text-widget-variable-chip]:mx-0.5 [&_.text-widget-variable-chip]:inline-block [&_.text-widget-variable-chip]:rounded-md [&_.text-widget-variable-chip]:bg-slate-200 [&_.text-widget-variable-chip]:px-1.5 [&_.text-widget-variable-chip]:py-0.5 [&_.text-widget-variable-chip]:text-xs [&_.text-widget-variable-chip]:font-bold [&_.text-widget-variable-chip]:text-violet-700",
          "[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-inherit",
          "[&_.ProseMirror_p]:m-0",
          "[&_.ProseMirror]:caret-[currentColor]",
          alignMap[config.align],
          weightMap[config.fontWeight],
        )}
        style={{
          color: config.color,
          fontSize: `${config.fontSizePx}px`,
          letterSpacing:
            config.letterSpacingPx === 0
              ? undefined
              : `${config.letterSpacingPx}px`,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
