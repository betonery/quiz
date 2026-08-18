"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/services/supabase/server";

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.login);
}
