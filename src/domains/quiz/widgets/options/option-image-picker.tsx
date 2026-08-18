"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadQuizAssetAction } from "@/domains/quiz/actions/upload-quiz-asset.action";
import {
  MAX_QUIZ_ASSET_FILE_SIZE,
  MAX_QUIZ_ASSET_FILE_SIZE_LABEL,
} from "@/domains/quiz/constants/quiz-asset.constants";
import {
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { EmojiPickerGrid } from "@/domains/quiz/components/builder/emoji-picker-grid";
import type {
  OptionImageType,
  OptionItem,
} from "@/domains/quiz/types/builder.types";
import { OptionImagePreview } from "@/domains/quiz/widgets/options/option-image-preview";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";

type OptionImagePickerProps = {
  option: OptionItem;
  onChange: (patch: Partial<OptionItem>) => void;
  className?: string;
  compact?: boolean;
};

export function OptionImagePicker({
  option,
  onChange,
  className,
  compact = false,
}: OptionImagePickerProps) {
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const setFeedback = useBuilderStore((s) => s.setFeedback);
  const [open, setOpen] = useState(false);
  const [isUploading, startUpload] = useTransition();

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg transition-opacity hover:opacity-80"
        aria-label="Alterar imagem da opção"
      >
        <OptionImagePreview option={option} compact={compact} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg">
          <PropertyField label="Tipo">
            <PropertySelect
              value={option.imageType}
              onChange={(value) =>
                onChange({
                  imageType: value as OptionImageType,
                })
              }
            >
              <option value="emoji">Emoji</option>
              <option value="url">URL</option>
              <option value="file">Arquivo</option>
              <option value="none">Nenhum</option>
            </PropertySelect>
          </PropertyField>

          {option.imageType === "emoji" && (
            <EmojiPickerGrid
              className="mt-2"
              value={option.emoji}
              onSelect={(emoji) => {
                onChange({ emoji, imageType: "emoji" });
                setOpen(false);
              }}
            />
          )}

          {option.imageType === "url" && (
            <Input
              value={option.url ?? ""}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://..."
              className="mt-2 bg-background shadow-sm"
            />
          )}

          {option.imageType === "file" && (
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              disabled={isUploading}
              className="mt-2 bg-background shadow-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > MAX_QUIZ_ASSET_FILE_SIZE) {
                  setFeedback(
                    `Arquivo muito grande (máx. ${MAX_QUIZ_ASSET_FILE_SIZE_LABEL})`,
                  );
                  e.target.value = "";
                  return;
                }

                const formData = new FormData();
                formData.append("file", file);
                startUpload(async () => {
                  const result = await uploadQuizAssetAction(
                    workspaceSlug,
                    quizId,
                    formData,
                    "options",
                  );
                  if (result.success && result.filePath) {
                    onChange({
                      filePath: result.filePath,
                      imageType: "file",
                    });
                    setFeedback("Imagem enviada");
                    setOpen(false);
                  } else if (!result.success) {
                    setFeedback(result.error);
                  }
                });
              }}
            />
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
