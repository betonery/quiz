import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { AdminQuizActions } from "@/domains/admin/components/quizzes/admin-quiz-actions";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchInput,
} from "@/domains/admin/components/ui/admin-filters";
import { AdminPagination } from "@/domains/admin/components/ui/admin-pagination";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminReadOnlyNotice,
  AdminTableWrapper,
  AdminTd,
  AdminTh,
  AdminTr,
  statusTone,
} from "@/domains/admin/components/ui/admin-primitives";
import { QUIZ_STATUS_LABELS } from "@/domains/admin/constants/admin.constants";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listQuizzes } from "@/domains/admin/services/admin-quizzes.service";
import {
  formatCompactNumber,
  formatRate,
  formatRelativeTime,
  safeRate,
} from "@/domains/admin/utils/admin-format.utils";
import { parseListParams } from "@/domains/admin/utils/admin-query.utils";

export const metadata = { title: "Funis | Admin" };

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
};

export default async function AdminQuizzesPage({ searchParams }: PageProps) {
  const actor = await requireAdminAccess();
  const params = await searchParams;

  const result = await listQuizzes({
    ...parseListParams(params),
    status: params.status,
  });

  return (
    <>
      <AdminPageHeader
        title="Funis"
        description={`${result.total} funil(is) criados na plataforma.`}
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <AdminFilterBar>
        <AdminSearchInput placeholder="Buscar por título ou slug..." />
        <AdminFilterSelect
          paramKey="status"
          label="Status"
          allLabel="Todos os status"
          options={Object.entries(QUIZ_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </AdminFilterBar>

      <AdminCard>
        {result.items.length === 0 ? (
          <AdminEmpty
            title="Nenhum funil encontrado"
            description="Ajuste a busca ou os filtros."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Funil</AdminTh>
                <AdminTh>Workspace</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="text-right">Visitas</AdminTh>
                <AdminTh className="text-right">Conversão</AdminTh>
                <AdminTh>Atualizado</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {result.items.map((quiz) => (
                <AdminTr key={quiz.id}>
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-200">
                          {quiz.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          /q/{quiz.slug}
                        </p>
                      </div>
                      {quiz.status === "published" ? (
                        <a
                          href={ROUTES.publicQuiz(quiz.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir ${quiz.title}`}
                          className="text-slate-500 transition-colors hover:text-cyan-300"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </AdminTd>

                  <AdminTd>
                    {quiz.workspaceName ? (
                      <Link
                        href={ROUTES.admin.workspace(quiz.workspaceId)}
                        className="truncate text-sm text-slate-300 hover:text-cyan-300"
                      >
                        {quiz.workspaceName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </AdminTd>

                  <AdminTd>
                    <AdminBadge tone={statusTone(quiz.status)}>
                      {QUIZ_STATUS_LABELS[quiz.status] ?? quiz.status}
                    </AdminBadge>
                  </AdminTd>

                  <AdminTd className="text-right tabular-nums">
                    {formatCompactNumber(quiz.views)}
                  </AdminTd>

                  <AdminTd className="text-right tabular-nums">
                    {formatRate(safeRate(quiz.completions, quiz.starts))}
                  </AdminTd>

                  <AdminTd className="text-xs">
                    {formatRelativeTime(quiz.updatedAt)}
                  </AdminTd>

                  <AdminTd>
                    <AdminQuizActions quiz={quiz} canWrite={actor.canWrite} />
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTableWrapper>
        )}

        <AdminPagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
        />
      </AdminCard>
    </>
  );
}
