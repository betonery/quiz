import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

type QuizzesPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function QuizzesPage({ params }: QuizzesPageProps) {
  const { workspaceSlug } = await params;
  redirect(
    `${ROUTES.dashboard}?workspace=${encodeURIComponent(workspaceSlug)}`,
  );
}
