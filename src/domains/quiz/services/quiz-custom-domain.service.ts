import type {
  CustomDomainMapping,
  QuizCustomDomain,
  QuizCustomDomainStatus,
} from "@/domains/quiz/types/quiz-settings.types";
import { createClient } from "@/services/supabase/server";
import type { Json } from "@/types/database.types";

function mapCustomDomain(row: {
  id: string;
  quiz_id: string;
  workspace_id: string;
  hostname: string;
  status: string;
  vercel_domain_id: string | null;
  verification_records: Json;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}): QuizCustomDomain {
  return {
    ...row,
    status: row.status as QuizCustomDomainStatus,
    verification_records: Array.isArray(row.verification_records)
      ? row.verification_records
      : [],
  };
}

export async function getQuizCustomDomain(
  quizId: string,
): Promise<QuizCustomDomain | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_custom_domains")
    .select("*")
    .eq("quiz_id", quizId)
    .neq("status", "removed")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCustomDomain(data);
}

export async function getVerifiedCustomDomainHostname(
  quizId: string,
): Promise<string | null> {
  const domain = await getQuizCustomDomain(quizId);
  if (!domain || domain.status !== "verified") {
    return null;
  }
  return domain.hostname;
}

export async function upsertQuizCustomDomain(params: {
  quizId: string;
  workspaceId: string;
  hostname: string;
  status?: QuizCustomDomainStatus;
  vercelDomainId?: string | null;
  verificationRecords?: unknown[];
}): Promise<QuizCustomDomain> {
  const supabase = await createClient();

  const existing = await getQuizCustomDomain(params.quizId);

  if (existing) {
    const { data, error } = await supabase
      .from("quiz_custom_domains")
      .update({
        hostname: params.hostname,
        status: params.status ?? existing.status,
        vercel_domain_id: params.vercelDomainId ?? existing.vercel_domain_id,
        verification_records: (params.verificationRecords ??
          existing.verification_records) as Json,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Não foi possível atualizar o domínio");
    }

    return mapCustomDomain(data);
  }

  const { data, error } = await supabase
    .from("quiz_custom_domains")
    .insert({
      quiz_id: params.quizId,
      workspace_id: params.workspaceId,
      hostname: params.hostname,
      status: params.status ?? "pending",
      vercel_domain_id: params.vercelDomainId ?? null,
      verification_records: (params.verificationRecords ?? []) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("Este domínio já está vinculado a outro funil");
    }
    throw new Error(error?.message ?? "Não foi possível adicionar o domínio");
  }

  return mapCustomDomain(data);
}

export async function updateQuizCustomDomainStatus(
  domainId: string,
  patch: {
    status: QuizCustomDomainStatus;
    verificationRecords?: unknown[];
    vercelDomainId?: string | null;
  },
): Promise<QuizCustomDomain> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_custom_domains")
    .update({
      status: patch.status,
      verification_records: patch.verificationRecords as Json | undefined,
      vercel_domain_id: patch.vercelDomainId,
    })
    .eq("id", domainId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível atualizar o domínio");
  }

  return mapCustomDomain(data);
}

export async function removeQuizCustomDomain(domainId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quiz_custom_domains")
    .update({ status: "removed" })
    .eq("id", domainId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function resolveCustomDomainMapping(
  hostname: string,
): Promise<CustomDomainMapping | null> {
  const supabase = await createClient();

  const normalized = hostname.toLowerCase().split(":")[0];

  const { data: domainRow, error: domainError } = await supabase
    .from("quiz_custom_domains")
    .select("quiz_id, hostname")
    .eq("hostname", normalized)
    .eq("status", "verified")
    .maybeSingle();

  if (domainError || !domainRow) {
    return null;
  }

  const { data: quizRow, error: quizError } = await supabase
    .from("quizzes")
    .select("slug")
    .eq("id", domainRow.quiz_id)
    .maybeSingle();

  if (quizError || !quizRow?.slug) {
    return null;
  }

  return {
    quizId: domainRow.quiz_id,
    slug: quizRow.slug,
    hostname: domainRow.hostname,
  };
}
