import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { QuizPlayer } from "@/domains/quiz/components/player/quiz-player";
import { QuizUnavailable } from "@/domains/quiz/components/player/quiz-unavailable";
import {
  loadPreviewQuiz,
  loadPublishedQuiz,
} from "@/domains/quiz/services/quiz-public.service";
import { stripWebhookSecretsFromFlowLayout } from "@/domains/quiz/utils/flow-public.utils";
import { createClient } from "@/services/supabase/server";

type PublicQuizPageProps = {
  params: Promise<{ quizSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export default async function PublicQuizPage({
  params,
  searchParams,
}: PublicQuizPageProps) {
  const { quizSlug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  if (isPreview) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-xl font-semibold text-foreground">
            Acesso negado
          </h1>
          <p className="text-center text-muted-foreground">
            Faça login para visualizar a prévia deste funil.
          </p>
          <Link
            href={ROUTES.home}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ir para login
          </Link>
        </div>
      );
    }

    const previewResult = await loadPreviewQuiz(quizSlug, user.id);
    if (previewResult.kind === "subscription_inactive") {
      return (
        <QuizUnavailable description="A prévia deste funil está indisponível porque o workspace não possui uma assinatura ativa." />
      );
    }
    if (previewResult.kind !== "success") {
      notFound();
    }

    const data = previewResult.data;
    return (
      <QuizPlayer
        steps={data.steps}
        widgets={data.widgets}
        design={data.design}
        flowLayout={stripWebhookSecretsFromFlowLayout(data.flowLayout)}
        quizSlug={quizSlug}
        settings={data.settings}
        trackingEnabled={data.settings.testIntegrationsInPreview === true}
        recordAnalytics={false}
      />
    );
  }

  const publishedResult = await loadPublishedQuiz(quizSlug);
  if (publishedResult.kind === "subscription_inactive") {
    return <QuizUnavailable />;
  }
  if (publishedResult.kind !== "success") {
    notFound();
  }

  const data = publishedResult.data;
  return (
    <QuizPlayer
      steps={data.steps}
      widgets={data.widgets}
      design={data.design}
      flowLayout={stripWebhookSecretsFromFlowLayout(data.flowLayout)}
      quizSlug={quizSlug}
      settings={data.settings}
      trackingEnabled
      recordAnalytics
    />
  );
}
