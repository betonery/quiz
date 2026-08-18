"use server";

import { revalidatePath } from "next/cache";
import type { AuthActionResult } from "@/domains/auth/types/auth.types";
import { updateProfileSchema } from "@/domains/profile/schemas/update-profile.schema";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/services/supabase/server";

export async function updateProfileAction(
  data: unknown,
): Promise<AuthActionResult> {
  const parsed = updateProfileSchema.safeParse(data);

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
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Não foi possível atualizar o perfil." };
  }

  revalidatePath(ROUTES.dashboardProfile);
  revalidatePath(ROUTES.dashboard);

  return { success: true };
}
