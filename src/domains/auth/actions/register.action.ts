"use server";

import { createClient } from "@/services/supabase/server";
import { getCachedPlatformSettings } from "@/domains/admin/services/admin-settings.service";
import { registerSchema } from "@/domains/auth/schemas/register.schema";
import type { AuthActionResult } from "@/domains/auth/types/auth.types";
import { translateAuthError } from "@/domains/auth/utils/auth-errors";

export async function registerAction(data: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(data);

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

  // Chave global do painel administrativo: fecha cadastros sem derrubar o site.
  const platformSettings = await getCachedPlatformSettings();
  if (!platformSettings.signupsEnabled) {
    return {
      success: false,
      error: platformSettings.signupsDisabledMessage,
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: authData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: translateAuthError(error.message) };
  }

  // Com confirmação de e-mail ativa, o Supabase não retorna erro para e-mails
  // já cadastrados — envia user com identities vazio (anti-enumeração).
  if (authData.user?.identities?.length === 0) {
    const message = translateAuthError("User already registered");
    return {
      success: false,
      error: message,
      fieldErrors: { email: [message] },
    };
  }

  // Com confirmação desligada o Auth costuma devolver session no signUp; se não
  // vier, tenta login imediato. Só pede "verifique o e-mail" se o Auth bloquear.
  if (!authData.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      if (/email not confirmed/i.test(signInError.message)) {
        return { success: true, requiresEmailConfirmation: true };
      }
      return {
        success: false,
        error: translateAuthError(signInError.message),
      };
    }
  }

  return { success: true };
}
