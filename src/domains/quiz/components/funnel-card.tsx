"use client";

import Link from "next/link";
import { FunnelCardMenu } from "@/domains/quiz/components/funnel-card-menu";
import { formatQuizDate } from "@/domains/quiz/utils/format-date";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import type { QuizFolder } from "@/domains/quiz/types/quiz-folder.types";
import { ROUTES } from "@/constants/routes";

type FunnelCardProps = {
  quiz: Quiz;
  workspaceSlug: string;
  folders?: QuizFolder[];
};

export function FunnelCard({
  quiz,
  workspaceSlug,
  folders = [],
}: FunnelCardProps) {
  return (
    <article className="group relative rounded-2xl border border-slate-700/60 bg-[#0b121e] p-5 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(34,211,238,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={ROUTES.quiz(workspaceSlug, quiz.id)}
          className="min-w-0 flex-1"
        >
          <h3 className="truncate text-base font-semibold text-cyan-300 transition-colors group-hover:text-cyan-200">
            {quiz.title}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            {formatQuizDate(quiz.updated_at)}
          </p>
        </Link>
        <FunnelCardMenu
          quiz={quiz}
          workspaceSlug={workspaceSlug}
          folders={folders}
        />
      </div>
    </article>
  );
}
