"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Box, Link2, MoreVertical, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveBuilderAction } from "@/domains/quiz/actions/save-builder.action";
import { BuilderCanvas } from "@/domains/quiz/components/builder/builder-canvas";
import {
  PropertyCheckbox,
  PropertiesSection,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { FlowWidgetPaletteGrid } from "@/domains/quiz/components/flow/editor/flow-widget-palette-grid";
import { FlowWidgetProperties } from "@/domains/quiz/components/flow/editor/flow-widget-properties";
import { FlowEditorOverlay } from "@/domains/quiz/components/flow/editor/flow-editor-overlay";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  FLOW_EDITOR_DRAWER_CONTENT_WIDTH,
  FLOW_EDITOR_DRAWER_MARGIN,
  FLOW_EDITOR_LEFT_PANEL_WIDTH,
  FLOW_EDITOR_PHONE_AREA_PADDING,
  FLOW_EDITOR_PHONE_MAX_WIDTH,
} from "@/domains/quiz/types/flow.types";
import { cn } from "@/lib/utils";

export function FlowStepEditorDrawer() {
  const router = useRouter();
  const flowEditorStepId = useBuilderStore((s) => s.flowEditorStepId);
  const steps = useBuilderStore((s) => s.steps);
  const widgets = useBuilderStore((s) => s.widgets);
  const selectedWidgetId = useBuilderStore((s) => s.selectedWidgetId);
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const getSnapshot = useBuilderStore((s) => s.getSnapshot);
  const markClean = useBuilderStore((s) => s.markClean);
  const setFeedback = useBuilderStore((s) => s.setFeedback);
  const closeFlowEditor = useBuilderStore((s) => s.closeFlowEditor);
  const updateStep = useBuilderStore((s) => s.updateStep);
  const deleteStep = useBuilderStore((s) => s.deleteStep);

  const [isSaving, startSaveTransition] = useTransition();

  const activeStep = steps.find((s) => s.id === flowEditorStepId);
  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  useEffect(() => {
    if (!flowEditorStepId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFlowEditor();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flowEditorStepId, closeFlowEditor]);

  function handleSave() {
    startSaveTransition(async () => {
      const result = await saveBuilderAction(
        workspaceSlug,
        quizId,
        getSnapshot(),
      );
      if (result.success) {
        markClean();
        setFeedback("Funil salvo com sucesso");
        router.refresh();
      } else {
        setFeedback(result.error);
      }
    });
  }

  if (!flowEditorStepId || !activeStep) return null;

  const shortId = activeStep.id.slice(0, 8);

  return (
    <FlowEditorOverlay onClose={closeFlowEditor}>
      <div
        className={cn(
          "flex h-full overflow-hidden",
          "rounded-l-xl border border-slate-700/70 bg-[#0c1220] shadow-2xl",
        )}
        style={{
          width: `min(${FLOW_EDITOR_DRAWER_CONTENT_WIDTH}px, calc(100vw - ${FLOW_EDITOR_DRAWER_MARGIN * 2}px))`,
        }}
      >
        <div
          className="flex min-h-0 shrink-0 flex-col border-r border-slate-700/50 bg-[#0c1220]"
          style={{ width: FLOW_EDITOR_LEFT_PANEL_WIDTH }}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-slate-700/60 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80">
              <Box className="size-4 text-slate-300" />
            </div>
            <Input
              value={activeStep.title}
              onChange={(e) =>
                updateStep(activeStep.id, { title: e.target.value })
              }
              className="h-9 min-w-0 flex-1 border-slate-700 bg-slate-900/60 font-medium text-slate-100 shadow-none"
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="hidden items-center gap-1 rounded-lg bg-slate-800/80 px-2 py-1 font-mono text-xs text-slate-400 sm:flex">
                <Link2 className="size-3" />/{shortId}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  aria-label="Opções da etapa"
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <PropertiesSection title="Configurações">
                      {(
                        [
                          ["showLogo", "Mostrar logo"],
                          ["showProgress", "Mostrar progresso"],
                          ["allowBack", "Permitir voltar"],
                        ] as const
                      ).map(([key, label]) => (
                        <PropertyCheckbox
                          key={key}
                          label={label}
                          checked={activeStep.settings[key]}
                          onChange={(checked) =>
                            updateStep(activeStep.id, {
                              settings: {
                                ...activeStep.settings,
                                [key]: checked,
                              },
                            })
                          }
                        />
                      ))}
                    </PropertiesSection>
                  </div>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={steps.length <= 1}
                    onClick={() => deleteStep(activeStep.id)}
                  >
                    Excluir etapa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden bg-[#0a0f1a]">
            {selectedWidget ? (
              <FlowWidgetProperties widget={selectedWidget} />
            ) : (
              <FlowWidgetPaletteGrid />
            )}
          </div>

          <footer className="flex shrink-0 items-center gap-2 border-t border-slate-700/60 px-4 py-3.5">
            <Button
              type="button"
              variant="brand"
              className="gap-2"
              disabled={isSaving}
              onClick={handleSave}
            >
              <Save className="size-4" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
              onClick={() => closeFlowEditor()}
            >
              <X className="size-4" />
              Fechar
            </Button>
          </footer>
        </div>

        <div
          className="flex shrink-0 items-center justify-center bg-[#060a12] p-1"
          style={{
            width: FLOW_EDITOR_PHONE_MAX_WIDTH + FLOW_EDITOR_PHONE_AREA_PADDING,
          }}
        >
          <div
            className="flex aspect-[9/19.5] h-auto max-h-full w-full items-stretch justify-center rounded-[1.5rem] border-4 border-black/90 bg-black/50 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            style={{ maxWidth: FLOW_EDITOR_PHONE_MAX_WIDTH }}
          >
            <BuilderCanvas variant="drawer" />
          </div>
        </div>
      </div>
    </FlowEditorOverlay>
  );
}
