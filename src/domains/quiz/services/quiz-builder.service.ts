import { createClient } from "@/services/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  QuizStep,
  QuizWidget,
  StepSettings,
  WidgetType,
} from "@/domains/quiz/types/builder.types";
import {
  defaultStepSettings,
  stepSettingsSchema,
} from "@/domains/quiz/types/builder.types";
import { parseWidgetConfig } from "@/domains/quiz/utils/widget-config.utils";

function parseStepSettings(raw: unknown): StepSettings {
  const parsed = stepSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : defaultStepSettings;
}

function mapStep(row: {
  id: string;
  quiz_id: string;
  workspace_id: string;
  title: string;
  position: number;
  settings: unknown;
}): QuizStep {
  return {
    id: row.id,
    quizId: row.quiz_id,
    workspaceId: row.workspace_id,
    title: row.title,
    position: row.position,
    settings: parseStepSettings(row.settings),
  };
}

function mapWidget(row: {
  id: string;
  step_id: string;
  workspace_id: string;
  type: string;
  position: number;
  config: unknown;
}): QuizWidget {
  const type = row.type as WidgetType;
  return {
    id: row.id,
    stepId: row.step_id,
    workspaceId: row.workspace_id,
    type,
    position: row.position,
    config: parseWidgetConfig(type, row.config),
  };
}

function normalizeSteps(steps: QuizStep[]): QuizStep[] {
  return [...steps]
    .sort((a, b) => a.position - b.position)
    .map((step, index) => ({ ...step, position: index }));
}

function normalizeWidgets(widgets: QuizWidget[]): QuizWidget[] {
  const stepIds = [...new Set(widgets.map((w) => w.stepId))];
  const normalized: QuizWidget[] = [];

  for (const stepId of stepIds) {
    const stepWidgets = widgets
      .filter((w) => w.stepId === stepId)
      .sort((a, b) => a.position - b.position)
      .map((widget, index) => ({ ...widget, position: index }));
    normalized.push(...stepWidgets);
  }

  return normalized;
}

async function bumpPositionsToAvoidUniqueConflicts(
  supabase: SupabaseClient<Database>,
  table: "quiz_steps" | "quiz_widgets",
  ids: string[],
): Promise<void> {
  for (let index = 0; index < ids.length; index++) {
    const { error } = await supabase
      .from(table)
      .update({ position: 100_000 + index })
      .eq("id", ids[index]);

    if (error) throw new Error(error.message);
  }
}

export async function loadQuizBuilder(quizId: string): Promise<{
  steps: QuizStep[];
  widgets: QuizWidget[];
}> {
  const supabase = await createClient();

  const { data: stepsData, error: stepsError } = await supabase
    .from("quiz_steps")
    .select("*")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (stepsError) throw new Error(stepsError.message);

  const steps = (stepsData ?? []).map(mapStep);

  if (steps.length === 0) {
    return { steps: [], widgets: [] };
  }

  const stepIds = steps.map((s) => s.id);

  const { data: widgetsData, error: widgetsError } = await supabase
    .from("quiz_widgets")
    .select("*")
    .in("step_id", stepIds)
    .order("position", { ascending: true });

  if (widgetsError) throw new Error(widgetsError.message);

  return {
    steps,
    widgets: (widgetsData ?? []).map(mapWidget),
  };
}

export async function bootstrapFirstStep(
  quizId: string,
  workspaceId: string,
): Promise<QuizStep> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_steps")
    .insert({
      quiz_id: quizId,
      workspace_id: workspaceId,
      title: "Etapa 1",
      position: 0,
      settings: defaultStepSettings,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Não foi possível criar a primeira etapa",
    );
  }

  return mapStep(data);
}

export async function saveQuizBuilder(
  quizId: string,
  workspaceId: string,
  steps: QuizStep[],
  widgets: QuizWidget[],
): Promise<void> {
  const supabase = await createClient();
  const normalizedSteps = normalizeSteps(steps);
  const normalizedWidgets = normalizeWidgets(widgets);

  const { data: existingSteps } = await supabase
    .from("quiz_steps")
    .select("id")
    .eq("quiz_id", quizId);

  const existingStepIds = new Set((existingSteps ?? []).map((s) => s.id));
  const snapshotStepIds = new Set(normalizedSteps.map((s) => s.id));

  const stepsToDelete = [...existingStepIds].filter(
    (id) => !snapshotStepIds.has(id),
  );

  if (stepsToDelete.length > 0) {
    await supabase.from("quiz_steps").delete().in("id", stepsToDelete);
  }

  const existingStepsToBump = normalizedSteps
    .filter((step) => existingStepIds.has(step.id))
    .map((step) => step.id);

  await bumpPositionsToAvoidUniqueConflicts(
    supabase,
    "quiz_steps",
    existingStepsToBump,
  );

  for (const step of normalizedSteps) {
    const { error } = await supabase.from("quiz_steps").upsert({
      id: step.id,
      quiz_id: quizId,
      workspace_id: workspaceId,
      title: step.title,
      position: step.position,
      settings: step.settings,
    });
    if (error) throw new Error(error.message);
  }

  const stepIds = normalizedSteps.map((s) => s.id);
  const { data: existingWidgets } = await supabase
    .from("quiz_widgets")
    .select("id, step_id")
    .in(
      "step_id",
      stepIds.length > 0 ? stepIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const existingWidgetIds = new Set((existingWidgets ?? []).map((w) => w.id));
  const snapshotWidgetIds = new Set(normalizedWidgets.map((w) => w.id));
  const widgetsToDelete = (existingWidgets ?? [])
    .filter((w) => !snapshotWidgetIds.has(w.id))
    .map((w) => w.id);

  if (widgetsToDelete.length > 0) {
    await supabase.from("quiz_widgets").delete().in("id", widgetsToDelete);
  }

  const existingWidgetsToBump = normalizedWidgets
    .filter((widget) => existingWidgetIds.has(widget.id))
    .map((widget) => widget.id);

  await bumpPositionsToAvoidUniqueConflicts(
    supabase,
    "quiz_widgets",
    existingWidgetsToBump,
  );

  for (const widget of normalizedWidgets) {
    const { error } = await supabase.from("quiz_widgets").upsert({
      id: widget.id,
      step_id: widget.stepId,
      workspace_id: workspaceId,
      type: widget.type,
      position: widget.position,
      config: widget.config,
    });
    if (error) throw new Error(error.message);
  }
}
