import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getWorkspaceBySlug } from "@/domains/workspace/services/workspace.service";

type HeaderProps = {
  workspaceSlug: string;
};

export async function Header({ workspaceSlug }: HeaderProps) {
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <span className="text-label text-muted-foreground">
        Workspace:{" "}
        <strong className="text-foreground">
          {workspace?.name ?? workspaceSlug}
        </strong>
      </span>
      <ThemeToggle />
    </header>
  );
}
