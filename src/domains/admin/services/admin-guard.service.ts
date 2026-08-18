import "server-only";

import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import type { PlatformRole } from "@/domains/admin/constants/admin.constants";
import type {
  AdminActionResult,
  AdminActor,
} from "@/domains/admin/types/admin.types";
import {
  canAccessAdminPanel,
  canWriteAdminPanel,
  parsePlatformRole,
} from "@/domains/admin/utils/admin-access.utils";
import { createClient } from "@/services/supabase/server";

/**
 * O painel lê e escreve com service role, que ignora RLS por definição.
 * Toda a autorização, portanto, acontece aqui — nenhum service ou action do
 * domínio `admin` deve tocar o banco sem antes passar por uma destas funções.
 */
export async function getAdminActor(): Promise<AdminActor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, platform_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const role: PlatformRole = parsePlatformRole(profile.platform_role);
  if (!canAccessAdminPanel(role)) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role,
    canWrite: canWriteAdminPanel(role),
  };
}

/** Para Server Components: sem sessão vai para o login, sem papel vira 404. */
export async function requireAdminAccess(): Promise<AdminActor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const actor = await getAdminActor();
  if (!actor) {
    // 404 em vez de 403: não confirma a existência do painel para quem não é staff.
    notFound();
  }

  return actor;
}

/** Para Server Components de páginas que só fazem sentido para quem escreve. */
export async function requireAdminWriteAccess(): Promise<AdminActor> {
  const actor = await requireAdminAccess();
  if (!actor.canWrite) {
    notFound();
  }
  return actor;
}

/** Para Server Actions de leitura: devolve resultado em vez de lançar. */
export async function resolveAdminActor(): Promise<
  { ok: true; actor: AdminActor } | { ok: false; result: AdminActionResult }
> {
  const actor = await getAdminActor();

  if (!actor) {
    return {
      ok: false,
      result: {
        success: false,
        error: "Acesso restrito ao painel administrativo.",
      },
    };
  }

  return { ok: true, actor };
}

/** Para Server Actions de escrita: `support` é barrado aqui. */
export async function resolveAdminWriter(): Promise<
  { ok: true; actor: AdminActor } | { ok: false; result: AdminActionResult }
> {
  const resolved = await resolveAdminActor();
  if (!resolved.ok) return resolved;

  if (!resolved.actor.canWrite) {
    return {
      ok: false,
      result: {
        success: false,
        error: "Seu perfil de suporte tem acesso somente leitura.",
      },
    };
  }

  return resolved;
}
