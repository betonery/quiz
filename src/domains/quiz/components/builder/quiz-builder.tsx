"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { publishQuizAction } from "@/domains/quiz/actions/publish-quiz.action";
import { saveBuilderAction } from "@/domains/quiz/actions/save-builder.action";
import { BuilderToast } from "@/domains/quiz/components/builder/builder-toast";
import { BuilderTopBar } from "@/domains/quiz/components/builder/builder-top-bar";
import { DesignPanel } from "@/domains/quiz/components/design/design-panel";
import { DesignPreviewPanel } from "@/domains/quiz/components/design/design-preview-panel";
import { SettingsPanel } from "@/domains/quiz/components/settings/settings-panel";
import { StatisticsPanel } from "@/domains/quiz/components/statistics/statistics-panel";
import { FlowPanel } from "@/domains/quiz/components/flow/flow-panel";
import { FlowStepEditorDrawer } from "@/domains/quiz/components/flow/editor/flow-step-editor-drawer";
import { FlowFunctionEditorDrawer } from "@/domains/quiz/components/flow/editor/flow-function-editor-drawer";
import { getDefaultWidgetConfig } from "@/domains/quiz/registry/widget-registry";
import { hasUnpublishedChanges as checkUnpublishedChanges } from "@/domains/quiz/utils/publish-status";
import { getQuizPublicUrl } from "@/domains/quiz/utils/quiz-public-url.utils";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { ImageWidgetRenderer } from "@/domains/quiz/widgets/image/image-widget-renderer";
import { CarouselWidgetRenderer } from "@/domains/quiz/widgets/carousel/carousel-widget-renderer";
import { AudioWidgetRenderer } from "@/domains/quiz/widgets/audio/audio-widget-renderer";
import { RedirectWidgetRenderer } from "@/domains/quiz/widgets/redirect/redirect-widget-renderer";
import { LoadingWidgetRenderer } from "@/domains/quiz/widgets/loading/loading-widget-renderer";
import { LevelWidgetRenderer } from "@/domains/quiz/widgets/level/level-widget-renderer";
import { FaqWidgetRenderer } from "@/domains/quiz/widgets/faq/faq-widget-renderer";
import { SpacerWidgetRenderer } from "@/domains/quiz/widgets/spacer/spacer-widget-renderer";
import { BenefitsWidgetRenderer } from "@/domains/quiz/widgets/benefits/benefits-widget-renderer";
import { TrustBadgeWidgetRenderer } from "@/domains/quiz/widgets/trust-badge/trust-badge-widget-renderer";
import { WhatsappWidgetRenderer } from "@/domains/quiz/widgets/whatsapp/whatsapp-widget-renderer";
import { PricingWidgetRenderer } from "@/domains/quiz/widgets/pricing/pricing-widget-renderer";
import { CountdownWidgetRenderer } from "@/domains/quiz/widgets/countdown/countdown-widget-renderer";
import { ResultBlockWidgetRenderer } from "@/domains/quiz/widgets/result-block/result-block-widget-renderer";
import { BeforeAfterWidgetRenderer } from "@/domains/quiz/widgets/before-after/before-after-widget-renderer";
import { ComparisonTableWidgetRenderer } from "@/domains/quiz/widgets/comparison-table/comparison-table-widget-renderer";
import { LogoBarWidgetRenderer } from "@/domains/quiz/widgets/logo-bar/logo-bar-widget-renderer";
import { AlertWidgetRenderer } from "@/domains/quiz/widgets/alert/alert-widget-renderer";
import { RatingWidgetRenderer } from "@/domains/quiz/widgets/rating/rating-widget-renderer";
import { EmbedWidgetRenderer } from "@/domains/quiz/widgets/embed/embed-widget-renderer";
import { ScriptWidgetRenderer } from "@/domains/quiz/widgets/script/script-widget-renderer";
import { ChartsWidgetRenderer } from "@/domains/quiz/widgets/charts/charts-widget-renderer";
import { TestimonialsWidgetRenderer } from "@/domains/quiz/widgets/testimonials/testimonials-widget-renderer";
import { VideoWidgetRenderer } from "@/domains/quiz/widgets/video/video-widget-renderer";
import type {
  AudioWidgetConfig,
  ButtonWidgetConfig,
  CarouselWidgetConfig,
  ImageWidgetConfig,
  InputWidgetConfig,
  OptionsWidgetConfig,
  LevelWidgetConfig,
  LoadingWidgetConfig,
  RedirectWidgetConfig,
  TestimonialsWidgetConfig,
  ChartsWidgetConfig,
  FaqWidgetConfig,
  SpacerWidgetConfig,
  BenefitsWidgetConfig,
  TrustBadgeWidgetConfig,
  WhatsappWidgetConfig,
  PricingWidgetConfig,
  CountdownWidgetConfig,
  ResultBlockWidgetConfig,
  BeforeAfterWidgetConfig,
  ComparisonTableWidgetConfig,
  LogoBarWidgetConfig,
  AlertWidgetConfig,
  RatingWidgetConfig,
  EmbedWidgetConfig,
  ScriptWidgetConfig,
  QuizStep,
  QuizWidget,
  TextWidgetConfig,
  VideoWidgetConfig,
  WidgetType,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { QuizSettings } from "@/domains/quiz/types/quiz-settings.types";
import type { QuizCustomDomain } from "@/domains/quiz/types/quiz-settings.types";
import { defaultQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";
import type { FlowLayout } from "@/domains/quiz/types/flow.types";
import type { QuizVariable } from "@/domains/quiz/types/builder.types";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import type { QuizStatistics } from "@/domains/quiz/types/statistics.types";
import { ButtonWidgetRenderer } from "@/domains/quiz/widgets/button/button-widget-renderer";
import { InputWidgetRenderer } from "@/domains/quiz/widgets/input/input-widget-renderer";
import { OptionsWidgetRenderer } from "@/domains/quiz/widgets/options/options-widget-renderer";
import { TextWidgetRenderer } from "@/domains/quiz/widgets/text/text-widget-renderer";

type QuizBuilderProps = {
  quiz: Quiz;
  workspaceSlug: string;
  workspaceId: string;
  initialSteps: QuizStep[];
  initialWidgets: QuizWidget[];
  initialDesign: QuizDesignSettings;
  initialFlowLayout: FlowLayout;
  initialVariables: QuizVariable[];
  initialSettings?: QuizSettings;
  initialCustomDomain?: QuizCustomDomain | null;
  initialStatistics: QuizStatistics;
};

export function QuizBuilder({
  quiz,
  workspaceSlug,
  workspaceId,
  initialSteps,
  initialWidgets,
  initialDesign,
  initialFlowLayout,
  initialVariables,
  initialSettings = defaultQuizSettings,
  initialCustomDomain = null,
  initialStatistics,
}: QuizBuilderProps) {
  const router = useRouter();
  const init = useBuilderStore((s) => s.init);
  const getSnapshot = useBuilderStore((s) => s.getSnapshot);
  const addWidget = useBuilderStore((s) => s.addWidget);
  const reorderWidgets = useBuilderStore((s) => s.reorderWidgets);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const markClean = useBuilderStore((s) => s.markClean);
  const setFeedback = useBuilderStore((s) => s.setFeedback);
  const activeStepId = useBuilderStore((s) => s.activeStepId);
  const activeTab = useBuilderStore((s) => s.activeTab);
  const setActiveTab = useBuilderStore((s) => s.setActiveTab);
  const design = useBuilderStore((s) => s.design);
  const customDomain = useBuilderStore((s) => s.customDomain);

  const [isSaving, startSaveTransition] = useTransition();
  const [isPublishing, startPublishTransition] = useTransition();
  const [activeDragType, setActiveDragType] = useState<WidgetType | null>(null);
  const [quizMeta, setQuizMeta] = useState(quiz);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const showUnpublishedBadge = !isDirty && checkUnpublishedChanges(quizMeta);

  useEffect(() => {
    const { quizId: currentQuizId, isDirty } = useBuilderStore.getState();
    if (currentQuizId === quiz.id && isDirty) {
      return;
    }

    init({
      quizId: quiz.id,
      workspaceSlug,
      workspaceId,
      steps: initialSteps,
      widgets: initialWidgets,
      design: initialDesign,
      flowLayout: initialFlowLayout,
      variables: initialVariables,
      settings: initialSettings,
      quizSlug: quiz.slug,
      customDomain: initialCustomDomain,
    });
  }, [
    quiz.id,
    quiz.slug,
    workspaceSlug,
    workspaceId,
    initialSteps,
    initialWidgets,
    initialDesign,
    initialFlowLayout,
    initialVariables,
    initialSettings,
    initialCustomDomain,
    init,
  ]);

  function handleSave() {
    startSaveTransition(async () => {
      const result = await saveBuilderAction(
        workspaceSlug,
        quiz.id,
        getSnapshot(),
      );
      if (result.success) {
        markClean();
        setQuizMeta((prev) => ({
          ...prev,
          updated_at: new Date().toISOString(),
        }));
        setFeedback("Funil salvo com sucesso", "success");
        router.refresh();
      } else {
        setFeedback(result.error, "error");
      }
    });
  }

  function handlePublish() {
    startPublishTransition(async () => {
      const snapshot = getSnapshot();
      const result = await publishQuizAction(workspaceSlug, quiz.id, snapshot);
      if (result.success) {
        markClean();
        const now = new Date().toISOString();
        setQuizMeta((prev) => ({
          ...prev,
          status: "published",
          published_at: now,
          updated_at: now,
        }));
        const verifiedDomain =
          customDomain?.status === "verified" ? customDomain.hostname : null;
        const publicUrl = getQuizPublicUrl({
          slug: quizMeta.slug,
          appOrigin: window.location.origin,
          customDomain: verifiedDomain,
        });
        setFeedback(`Funil publicado! Link: ${publicUrl}`, "success");
        router.refresh();
      } else {
        setFeedback(result.error, "error");
      }
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith("palette::")) {
      setActiveDragType(id.replace("palette::", "") as WidgetType);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragType(null);
    const { active, over } = event;
    if (!over || !activeStepId) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("palette::")) {
      const type = activeId.replace("palette::", "") as WidgetType;
      if (overId.startsWith("drop::")) {
        const parts = overId.split("::");
        const stepId = parts[1];
        const index = Number(parts[2]);
        if (stepId === activeStepId) {
          addWidget(stepId, type, index);
        }
      }
      return;
    }

    if (activeId.startsWith("widget::")) {
      const widgetId = activeId.replace("widget::", "");
      const widgets = useBuilderStore
        .getState()
        .widgets.filter((w) => w.stepId === activeStepId)
        .sort((a, b) => a.position - b.position);
      const oldIndex = widgets.findIndex((w) => w.id === widgetId);
      if (oldIndex === -1) return;

      if (overId.startsWith("drop::")) {
        const index = Number(overId.split("::")[2]);
        const newOrder = arrayMove(
          widgets.map((w) => w.id),
          oldIndex,
          index > oldIndex ? index - 1 : index,
        );
        reorderWidgets(activeStepId, newOrder);
        return;
      }

      if (overId.startsWith("widget::")) {
        const overWidgetId = overId.replace("widget::", "");
        const newIndex = widgets.findIndex((w) => w.id === overWidgetId);
        if (newIndex !== -1 && newIndex !== oldIndex) {
          const newOrder = arrayMove(
            widgets.map((w) => w.id),
            oldIndex,
            newIndex,
          );
          reorderWidgets(activeStepId, newOrder);
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col bg-background">
        <BuilderTopBar
          workspaceSlug={workspaceSlug}
          quizTitle={quizMeta.title}
          quizSlug={quizMeta.slug}
          activeTab={activeTab}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isDirty={isDirty}
          hasUnpublishedChanges={showUnpublishedBadge}
          onSave={handleSave}
          onPublish={handlePublish}
          onTabChange={setActiveTab}
          onStubTab={(label) => setFeedback(`${label} — em breve`)}
        />

        <BuilderToast />

        <div className="relative flex min-h-0 flex-1">
          {activeTab === "flow" ? <FlowPanel /> : null}
          {activeTab === "design" ? (
            <>
              <DesignPreviewPanel />
              <DesignPanel />
            </>
          ) : null}
          {activeTab === "settings" ? <SettingsPanel /> : null}
          {activeTab === "statistics" ? (
            <StatisticsPanel
              initialStatistics={initialStatistics}
              quizStatus={quizMeta.status}
              publishedAt={quizMeta.published_at}
            />
          ) : null}
          {activeTab === "flow" ? <FlowStepEditorDrawer /> : null}
          {activeTab === "flow" ? <FlowFunctionEditorDrawer /> : null}
        </div>
      </div>

      <DragOverlay>
        {activeDragType === "text" && (
          <div className="rounded-lg border border-primary bg-white p-3 shadow-lg">
            <TextWidgetRenderer
              config={getDefaultWidgetConfig("text") as TextWidgetConfig}
            />
          </div>
        )}
        {activeDragType === "button" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <ButtonWidgetRenderer
              config={getDefaultWidgetConfig("button") as ButtonWidgetConfig}
            />
          </div>
        )}
        {activeDragType === "input" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <InputWidgetRenderer
              config={getDefaultWidgetConfig("input") as InputWidgetConfig}
              design={design}
              readOnly
            />
          </div>
        )}
        {activeDragType === "options" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <OptionsWidgetRenderer
              config={getDefaultWidgetConfig("options") as OptionsWidgetConfig}
              design={design}
              readOnly
            />
          </div>
        )}
        {activeDragType === "image" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <ImageWidgetRenderer
              config={getDefaultWidgetConfig("image") as ImageWidgetConfig}
            />
          </div>
        )}
        {activeDragType === "carousel" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <CarouselWidgetRenderer
              config={
                getDefaultWidgetConfig("carousel") as CarouselWidgetConfig
              }
              design={design}
            />
          </div>
        )}
        {activeDragType === "audio" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <AudioWidgetRenderer
              config={getDefaultWidgetConfig("audio") as AudioWidgetConfig}
              design={design}
            />
          </div>
        )}
        {activeDragType === "video" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <VideoWidgetRenderer
              config={getDefaultWidgetConfig("video") as VideoWidgetConfig}
            />
          </div>
        )}
        {activeDragType === "level" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <LevelWidgetRenderer
              config={getDefaultWidgetConfig("level") as LevelWidgetConfig}
              design={design}
              animate={false}
            />
          </div>
        )}
        {activeDragType === "loading" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <LoadingWidgetRenderer
              config={getDefaultWidgetConfig("loading") as LoadingWidgetConfig}
              design={design}
              animate={false}
            />
          </div>
        )}
        {activeDragType === "redirect" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <RedirectWidgetRenderer
              config={
                getDefaultWidgetConfig("redirect") as RedirectWidgetConfig
              }
              mode="edit"
            />
          </div>
        )}
        {activeDragType === "script" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <ScriptWidgetRenderer
              config={getDefaultWidgetConfig("script") as ScriptWidgetConfig}
              mode="edit"
            />
          </div>
        )}
        {activeDragType === "testimonials" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <TestimonialsWidgetRenderer
              config={
                getDefaultWidgetConfig(
                  "testimonials",
                ) as TestimonialsWidgetConfig
              }
              design={design}
            />
          </div>
        )}
        {activeDragType === "charts" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <ChartsWidgetRenderer
              config={getDefaultWidgetConfig("charts") as ChartsWidgetConfig}
              design={design}
              animate={false}
            />
          </div>
        )}
        {activeDragType === "faq" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <FaqWidgetRenderer
              config={getDefaultWidgetConfig("faq") as FaqWidgetConfig}
              design={design}
            />
          </div>
        )}
        {activeDragType === "spacer" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <SpacerWidgetRenderer
              config={getDefaultWidgetConfig("spacer") as SpacerWidgetConfig}
              mode="edit"
            />
          </div>
        )}
        {activeDragType === "benefits" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <BenefitsWidgetRenderer
              config={
                getDefaultWidgetConfig("benefits") as BenefitsWidgetConfig
              }
              design={design}
              highlightVariables
            />
          </div>
        )}
        {activeDragType === "trust-badge" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <TrustBadgeWidgetRenderer
              config={
                getDefaultWidgetConfig("trust-badge") as TrustBadgeWidgetConfig
              }
              design={design}
              highlightVariables
            />
          </div>
        )}
        {activeDragType === "whatsapp" && (
          <div className="w-64 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <WhatsappWidgetRenderer
              config={
                getDefaultWidgetConfig("whatsapp") as WhatsappWidgetConfig
              }
              design={design}
              highlightVariables
            />
          </div>
        )}
        {activeDragType === "pricing" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <PricingWidgetRenderer
              config={getDefaultWidgetConfig("pricing") as PricingWidgetConfig}
              design={design}
              highlightVariables
            />
          </div>
        )}
        {activeDragType === "countdown" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <CountdownWidgetRenderer
              config={
                getDefaultWidgetConfig("countdown") as CountdownWidgetConfig
              }
              design={design}
              widgetId="preview"
              mode="edit"
            />
          </div>
        )}
        {activeDragType === "result-block" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <ResultBlockWidgetRenderer
              config={
                getDefaultWidgetConfig(
                  "result-block",
                ) as ResultBlockWidgetConfig
              }
              design={design}
              highlightVariables
            />
          </div>
        )}
        {activeDragType === "before-after" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <BeforeAfterWidgetRenderer
              config={
                getDefaultWidgetConfig(
                  "before-after",
                ) as BeforeAfterWidgetConfig
              }
              design={design}
              mode="edit"
            />
          </div>
        )}
        {activeDragType === "comparison-table" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <ComparisonTableWidgetRenderer
              config={
                getDefaultWidgetConfig(
                  "comparison-table",
                ) as ComparisonTableWidgetConfig
              }
              design={design}
            />
          </div>
        )}
        {activeDragType === "logo-bar" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <LogoBarWidgetRenderer
              config={getDefaultWidgetConfig("logo-bar") as LogoBarWidgetConfig}
              design={design}
            />
          </div>
        )}
        {activeDragType === "alert" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <AlertWidgetRenderer
              config={getDefaultWidgetConfig("alert") as AlertWidgetConfig}
              design={design}
              highlightVariables
            />
          </div>
        )}
        {activeDragType === "rating" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <RatingWidgetRenderer
              config={getDefaultWidgetConfig("rating") as RatingWidgetConfig}
              design={design}
            />
          </div>
        )}
        {activeDragType === "embed" && (
          <div className="w-72 rounded-lg border border-primary bg-white p-3 shadow-lg">
            <EmbedWidgetRenderer
              config={getDefaultWidgetConfig("embed") as EmbedWidgetConfig}
              mode="edit"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
