import type { ReactNode } from "react";
import { AdminShell } from "@/domains/admin/components/layout/admin-shell";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { getPlatformSettings } from "@/domains/admin/services/admin-settings.service";

export const metadata = {
  title: "Painel Administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Guard único da área: sem sessão vai ao login, sem papel de staff vira 404.
  const actor = await requireAdminAccess();
  const settings = await getPlatformSettings();

  return (
    <AdminShell actor={actor} maintenanceMode={settings.maintenanceMode}>
      {children}
    </AdminShell>
  );
}
