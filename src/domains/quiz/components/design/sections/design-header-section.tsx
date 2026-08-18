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
  PropertiesSection,
  PropertyField,
  PropertySelect,
  propertyFieldDarkClass,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { EmojiPickerGrid } from "@/domains/quiz/components/builder/emoji-picker-grid";
import { QuizHeaderLogo } from "@/domains/quiz/components/design/quiz-header-logo";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { LogoType } from "@/domains/quiz/types/design.types";
import { cn } from "@/lib/utils";

export function DesignHeaderSection() {
  const design = useBuilderStore((s) => s.design);
  const updateDesign = useBuilderStore((s) => s.updateDesign);
  const setFeedback = useBuilderStore((s) => s.setFeedback);
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, startUpload] = useTransition();

  return (
    <PropertiesSection title="Header" variant="dark">
      <PropertyField label="Tipo de Logo" variant="dark">
        <PropertySelect
          variant="dark"
          value={design.header.logoType}
          onChange={(value) =>
            updateDesign({
              header: { logoType: value as LogoType },
            })
          }
        >
          <option value="file">Arquivo</option>
          <option value="url">URL</option>
          <option value="emoji">Emoji</option>
        </PropertySelect>
      </PropertyField>

      {design.header.logoType === "emoji" && (
        <>
          <PropertyField label="Emoji" variant="dark">
            <div className="flex min-h-10 items-center rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-2xl shadow-none">
              {design.header.emoji || "😀"}
            </div>
          </PropertyField>
          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800/80 hover:text-white"
            onClick={() => setShowEmojiPicker((v) => !v)}
          >
            {showEmojiPicker ? "Fechar seletor" : "Escolher Emoji"}
          </Button>
          {showEmojiPicker && (
            <EmojiPickerGrid
              variant="dark"
              value={design.header.emoji}
              onSelect={(emoji) => {
                updateDesign({ header: { ...design.header, emoji } });
                setShowEmojiPicker(false);
              }}
            />
          )}
        </>
      )}

      {design.header.logoType === "url" && (
        <PropertyField label="URL da imagem" variant="dark">
          <Input
            value={design.header.url ?? ""}
            onChange={(e) =>
              updateDesign({
                header: { ...design.header, url: e.target.value },
              })
            }
            placeholder="https://..."
            className={propertyFieldDarkClass}
          />
        </PropertyField>
      )}

      {design.header.logoType === "file" && (
        <PropertyField label="Arquivo" variant="dark">
          {design.header.filePath ? (
            <p className="text-xs text-slate-400">
              Logo atual carregado. Envie outro arquivo para substituir.
            </p>
          ) : null}
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            disabled={isUploading}
            className={cn(propertyFieldDarkClass, "py-1.5")}
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
                );
                if (result.success && result.filePath) {
                  updateDesign({
                    header: {
                      logoType: "file",
                      filePath: result.filePath,
                    },
                  });
                  setFeedback("Logo enviado com sucesso", "success");
                } else if (!result.success) {
                  setFeedback(result.error, "error");
                }
              });
            }}
          />
          <p className="text-xs text-slate-500">
            JPEG, PNG, WebP, GIF ou SVG — máx. {MAX_QUIZ_ASSET_FILE_SIZE_LABEL}
          </p>
        </PropertyField>
      )}

      <div className="flex justify-center rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-6">
        <QuizHeaderLogo header={design.header} />
      </div>
    </PropertiesSection>
  );
}
