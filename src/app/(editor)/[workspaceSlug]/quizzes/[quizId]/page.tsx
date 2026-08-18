import { notFound } from "next/navigation";
import { QuizBuilder } from "@/domains/quiz/components/builder/quiz-builder";
import {
  bootstrapFirstStep,
  loadQuizBuilder,
} from "@/domains/quiz/services/quiz-builder.service";
import { loadDesignSettings } from "@/domains/quiz/services/quiz-design.service";
import { loadFlowLayout } from "@/domains/quiz/services/quiz-flow.service";
import { loadQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import { loadQuizSettings } from "@/domains/quiz/services/quiz-settings.service";
import { getQuizCustomDomain } from "@/domains/quiz/services/quiz-custom-domain.service";
import { getQuizStatistics } from "@/domains/quiz/services/quiz-statistics.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

type EditorPageProps = {
  params: Promise<{ workspaceSlug: string; quizId: string }>;
};

export const metadata = {
  title: "Editor de Funil",
};

export default async function QuizEditorPage({ params }: EditorPageProps) {
  const { workspaceSlug, quizId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) notFound();

  const quiz = await getQuizById(workspace.id, quizId);
  if (!quiz) notFound();

  let { steps, widgets } = await loadQuizBuilder(quizId);

  if (steps.length === 0) {
    const firstStep = await bootstrapFirstStep(quizId, workspace.id);
    steps = [firstStep];
    widgets = [];
  }

  const design = await loadDesignSettings(quizId);
  const flowLayout = await loadFlowLayout(quizId);
  const variables = await loadQuizVariables(quizId);
  const settings = await loadQuizSettings(quizId);
  const customDomain = await getQuizCustomDomain(quizId);
  const statistics = await getQuizStatistics(quizId, 90);

  return (
    <QuizBuilder
      quiz={quiz}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
      initialSteps={steps}
      initialWidgets={widgets}
      initialDesign={design}
      initialFlowLayout={flowLayout}
      initialVariables={variables}
      initialSettings={settings}
      initialCustomDomain={customDomain}
      initialStatistics={statistics}
    />
  );
}
