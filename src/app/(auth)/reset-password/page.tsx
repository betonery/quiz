import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { ResetPasswordPageContent } from "@/domains/auth/components/reset-password-page-content";
import { createClient } from "@/services/supabase/server";

export const metadata = {
  title: "Redefinir Senha",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return <ResetPasswordPageContent />;
}
