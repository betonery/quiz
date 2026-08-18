"use client";

import {
  Activity,
  ArrowLeft,
  Building2,
  CreditCard,
  LayoutDashboard,
  Layers,
  Plug,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Rotas com detalhe (`/admin/users/[id]`) também marcam o item ativo. */
  matchPrefix?: boolean;
};

const NAV_ITEMS: AdminNavItem[] = [
  { title: "Visão geral", href: ROUTES.admin.root, icon: LayoutDashboard },
  {
    title: "Usuários",
    href: ROUTES.admin.users,
    icon: Users,
    matchPrefix: true,
  },
  {
    title: "Workspaces",
    href: ROUTES.admin.workspaces,
    icon: Building2,
    matchPrefix: true,
  },
  { title: "Funis", href: ROUTES.admin.quizzes, icon: Layers },
  { title: "Planos", href: ROUTES.admin.plans, icon: Layers },
  { title: "Assinaturas", href: ROUTES.admin.subscriptions, icon: CreditCard },
  { title: "Pagamentos", href: ROUTES.admin.payments, icon: Receipt },
  {
    title: "Integrações",
    href: ROUTES.admin.integrations,
    icon: Plug,
    matchPrefix: true,
  },
  { title: "Auditoria", href: ROUTES.admin.audit, icon: Activity },
  { title: "Configurações", href: ROUTES.admin.settings, icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800/80 bg-[#080d16] lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800/80 px-5">
        <ShieldCheck className="size-5 text-amber-400" />
        <span className="text-sm font-semibold tracking-tight text-slate-100">
          Administração
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchPrefix
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname === item.href;

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-slate-800/80 font-medium text-slate-50"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isActive ? "text-amber-400" : "text-slate-500",
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/40 hover:text-slate-200"
        >
          <ArrowLeft className="size-4 shrink-0 text-slate-500" />
          Voltar ao app
        </Link>
      </div>
    </aside>
  );
}

/** Navegação horizontal usada abaixo de `lg`, onde a sidebar some. */
export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-800/80 bg-[#080d16] px-4 py-2 lg:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.matchPrefix
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
              isActive
                ? "bg-slate-800 font-medium text-slate-50"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
