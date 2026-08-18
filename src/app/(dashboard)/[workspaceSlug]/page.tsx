import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

type WorkspacePageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params;
  redirect(
    `${ROUTES.dashboard}?workspace=${encodeURIComponent(workspaceSlug)}`,
  );
}
