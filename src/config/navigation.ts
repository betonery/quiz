import { ROUTES } from "@/constants/routes";

export type NavItem = {
  title: string;
  href: string;
  icon?: string;
};

export function getWorkspaceNavigation(workspaceSlug: string): NavItem[] {
  const base = ROUTES.workspace(workspaceSlug);

  return [
    { title: "Visão Geral", href: base },
    { title: "Funis", href: `${base}/quizzes` },
    { title: "Analytics", href: `${base}/analytics` },
    { title: "Integrações", href: `${base}/integrations` },
    { title: "Billing", href: `${base}/billing` },
    { title: "Configurações", href: `${base}/settings` },
  ];
}
