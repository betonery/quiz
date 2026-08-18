import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import {
  AdminBadge,
  AdminEmpty,
  AdminTableWrapper,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/domains/admin/components/ui/admin-primitives";
import { PLATFORM_ROLE_LABELS } from "@/domains/admin/constants/admin.constants";
import type { AdminUserRow } from "@/domains/admin/types/admin.types";
import {
  formatRelativeTime,
  formatShortDate,
} from "@/domains/admin/utils/admin-format.utils";

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  if (users.length === 0) {
    return (
      <AdminEmpty
        title="Nenhum usuário encontrado"
        description="Ajuste a busca ou os filtros para ver outros resultados."
      />
    );
  }

  return (
    <AdminTableWrapper>
      <thead>
        <tr>
          <AdminTh>Usuário</AdminTh>
          <AdminTh>Papel</AdminTh>
          <AdminTh>Situação</AdminTh>
          <AdminTh className="text-right">Workspaces</AdminTh>
          <AdminTh className="text-right">Funis</AdminTh>
          <AdminTh>Cadastro</AdminTh>
          <AdminTh />
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <AdminTr key={user.id}>
            <AdminTd>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-200">
                  {user.fullName?.trim() || "—"}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </AdminTd>

            <AdminTd>
              <AdminBadge
                tone={
                  user.platformRole === "admin"
                    ? "accent"
                    : user.platformRole === "support"
                      ? "info"
                      : "neutral"
                }
              >
                {PLATFORM_ROLE_LABELS[user.platformRole]}
              </AdminBadge>
            </AdminTd>

            <AdminTd>
              {user.suspendedAt ? (
                <AdminBadge tone="danger">Suspenso</AdminBadge>
              ) : (
                <AdminBadge tone="success">Ativo</AdminBadge>
              )}
            </AdminTd>

            <AdminTd className="text-right tabular-nums">
              {user.workspaceCount}
            </AdminTd>
            <AdminTd className="text-right tabular-nums">
              {user.quizCount}
            </AdminTd>

            <AdminTd>
              <span title={formatShortDate(user.createdAt)}>
                {formatRelativeTime(user.createdAt)}
              </span>
            </AdminTd>

            <AdminTd className="text-right">
              <Link
                href={ROUTES.admin.user(user.id)}
                className="rounded-lg border border-slate-700/70 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                Gerenciar
              </Link>
            </AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTableWrapper>
  );
}
