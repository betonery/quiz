import type { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

type AppShellProps = {
  children: ReactNode;
  workspaceSlug: string;
};

export function AppShell({ children, workspaceSlug }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar workspaceSlug={workspaceSlug} />
      <div className="flex flex-1 flex-col">
        <Header workspaceSlug={workspaceSlug} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
