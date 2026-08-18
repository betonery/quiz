"use server";

import { ROUTES } from "@/constants/routes";
import { forgotPasswordSchema } from "@/domains/auth/schemas/forgot-password.schema";
import type { AuthActionResult } from "@/domains/auth/types/auth.types";
import { translateAuthError } from "@/domains/auth/utils/auth-errors";
import { createClient } from "@/services/supabase/server";

export async function forgotPasswordAction(
  data: unknown,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: "Verifique os campos do formulário",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}${ROUTES.authCallback}?next=${encodeURIComponent(ROUTES.resetPassword)}`;

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo },
  );

  if (error) {
    return { success: false, error: translateAuthError(error.message) };
  }

  return { success: true };
}
