import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/constants/routes";
import {
  AdminMobileNav,
  AdminSidebar,
} from "@/domains/admin/components/layout/admin-sidebar";
import { PLATFORM_ROLE_LABELS } from "@/domains/admin/constants/admin.constants";
import type { AdminActor } from "@/domains/admin/types/admin.types";
import { AdminBadge } from "@/domains/admin/components/ui/admin-primitives";
import { initialsFrom } from "@/domains/admin/utils/admin-format.utils";

type AdminShellProps = {
  children: ReactNode;
  actor: AdminActor;
  maintenanceMode: boolean;
};

export function AdminShell({
  children,
  actor,
  maintenanceMode,
}: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0f1a] text-slate-100">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-800/80 bg-[#0a0f1a]/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {maintenanceMode ? (
              <AdminBadge tone="warning">Modo manutenção ativo</AdminBadge>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.dashboard}
              className="hidden items-center gap-1.5 rounded-xl border border-slate-700/70 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 sm:flex"
            >
              Abrir app
              <ExternalLink className="size-3.5" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/80 text-xs font-medium text-slate-300">
                {initialsFrom(actor.fullName, actor.email)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[160px] truncate text-xs font-medium text-slate-200">
                  {actor.fullName?.trim() || actor.email}
                </p>
                <p className="text-[11px] text-amber-400/90">
                  {PLATFORM_ROLE_LABELS[actor.role]}
                </p>
              </div>
            </div>
          </div>
        </header>

        <AdminMobileNav />

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
