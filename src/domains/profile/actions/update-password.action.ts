"use server";

import { revalidatePath } from "next/cache";
import type { AuthActionResult } from "@/domains/auth/types/auth.types";
import { translateAuthError } from "@/domains/auth/utils/auth-errors";
import { updatePasswordSchema } from "@/domains/profile/schemas/update-password.schema";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/services/supabase/server";

export async function updatePasswordAction(
  data: unknown,
): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse(data);

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

  if (!user?.email) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Senha atual incorreta" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return { success: false, error: translateAuthError(error.message) };
  }

  revalidatePath(ROUTES.dashboardProfile);

  return { success: true };
}
