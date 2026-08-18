"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { ChartItem } from "@/domains/quiz/types/media.types";
import {
  plainContentToRichJson,
  richContentToPlainText,
} from "@/domains/quiz/utils/text-rich-content.utils";
import { getTextEditorExtensions } from "@/domains/quiz/widgets/text/tiptap-extensions";
import { TextRichEditorToolbar } from "@/domains/quiz/widgets/text/text-rich-editor-toolbar";
import { cn } from "@/lib/utils";

type ChartLegendRichEditorProps = {
  item: Pick<ChartItem, "legend" | "legendContentMode" | "legendRichContent">;
  onChange: (patch: Partial<ChartItem>) => void;
};

function getInitialRichContent(
  item: ChartLegendRichEditorProps["item"],
): string {
  if (item.legendContentMode === "rich" && item.legendRichContent) {
    return item.legendRichContent;
  }
  return plainContentToRichJson(item.legend);
}

export function ChartLegendRichEditor({
  item,
  onChange,
}: ChartLegendRichEditorProps) {
  const bootstrappedRef = useRef(false);
  const itemRef = useRef(item);
  itemRef.current = item;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getTextEditorExtensions(),
    content: JSON.parse(getInitialRichContent(item)),
    editorProps: {
      attributes: {
        class: "min-h-[80px] w-full px-3 py-2 outline-none max-w-none text-sm",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const legendRichContent = JSON.stringify(currentEditor.getJSON());
      const legend = richContentToPlainText(legendRichContent);

      onChange({
        legendContentMode: "rich",
        legendRichContent,
        legend,
      });
    },
  });

  useEffect(() => {
    if (!editor || bootstrappedRef.current) return;

    if (item.legendContentMode !== "rich") {
      const legendRichContent = plainContentToRichJson(item.legend);
      editor.commands.setContent(JSON.parse(legendRichContent));
      bootstrappedRef.current = true;
      onChange({
        legendContentMode: "rich",
        legendRichContent,
        legend: item.legend,
      });
      return;
    }

    bootstrappedRef.current = true;
  }, [editor, item, onChange]);

  return (
    <div className="space-y-2">
      <TextRichEditorToolbar editor={editor} />
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-white shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring/30",
          "[&_.text-widget-variable-chip]:mx-0.5 [&_.text-widget-variable-chip]:inline-block [&_.text-widget-variable-chip]:rounded-md [&_.text-widget-variable-chip]:bg-slate-200 [&_.text-widget-variable-chip]:px-1.5 [&_.text-widget-variable-chip]:py-0.5 [&_.text-widget-variable-chip]:text-xs [&_.text-widget-variable-chip]:font-bold [&_.text-widget-variable-chip]:text-violet-700",
          "[&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-slate-700",
          "[&_.ProseMirror_p]:m-0",
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
