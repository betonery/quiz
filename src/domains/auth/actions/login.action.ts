"use server";

import { createClient } from "@/services/supabase/server";
import { loginSchema } from "@/domains/auth/schemas/login.schema";
import type { AuthActionResult } from "@/domains/auth/types/auth.types";
import { translateAuthError } from "@/domains/auth/utils/auth-errors";

export async function loginAction(data: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(data);

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
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: translateAuthError(error.message) };
  }

  return { success: true };
}
