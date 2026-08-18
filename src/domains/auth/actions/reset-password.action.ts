"use server";

import { resetPasswordSchema } from "@/domains/auth/schemas/reset-password.schema";
import type { AuthActionResult } from "@/domains/auth/types/auth.types";
import { translateAuthError } from "@/domains/auth/utils/auth-errors";
import { createClient } from "@/services/supabase/server";

export async function resetPasswordAction(
  data: unknown,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(data);

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sessão expirada. Solicite um novo link de recuperação.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: translateAuthError(error.message) };
  }

  await supabase.auth.signOut();

  return { success: true };
}
