import type { PlanLimits } from "@/domains/billing/types/plan.types";

/**
 * O status sozinho não basta: quem vira assinatura vencida em `canceled` é o
 * cron diário, que ainda dá 2 dias de carência. Uma assinatura de 7 dias
 * entregaria ~9 se a data de fim fosse ignorada aqui.
 *
 * `current_period_end` nulo significa sem prazo definido (concessão manual sem
 * data) e continua valendo.
 */
export function isSubscriptionActive(
  subscription:
    | { status: string; current_period_end?: string | null }
    | null
    | undefined,
  now: Date = new Date(),
): boolean {
  if (subscription?.status !== "active") return false;

  const periodEnd = subscription.current_period_end;
  if (periodEnd === null || periodEnd === undefined) return true;

  const endsAt = new Date(periodEnd).getTime();
  if (!Number.isFinite(endsAt)) return true;

  return endsAt > now.getTime();
}

export function shouldBlockPublicQuizAccess(
  subscription:
    | { status: string; current_period_end?: string | null }
    | null
    | undefined,
): boolean {
  return !isSubscriptionActive(subscription);
}

export function isUnlimited(value: number): boolean {
  return value < 0;
}

export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Ilimitado" : String(value);
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) {
    return true;
  }

  return current < limit;
}

export function evaluateCreateQuizAccess(params: {
  hasActiveSubscription: boolean;
  limits: PlanLimits;
  quizCount: number;
}):
  | { allowed: true }
  | {
      allowed: false;
      reason: "no_subscription" | "limit_reached";
      message: string;
    } {
  if (!params.hasActiveSubscription) {
    return {
      allowed: false,
      reason: "no_subscription",
      message:
        "Assinatura necessária para criar funis. Escolha um plano para continuar.",
    };
  }

  if (!isWithinLimit(params.quizCount, params.limits.max_quizzes)) {
    return {
      allowed: false,
      reason: "limit_reached",
      message: "Limite de funis atingido. Faça upgrade para o plano Pro.",
    };
  }

  return { allowed: true };
}

export function evaluateInviteMemberAccess(params: {
  hasActiveSubscription: boolean;
  limits: PlanLimits;
  memberCount: number;
}): { allowed: true } | { allowed: false; message: string } {
  if (!params.hasActiveSubscription) {
    return {
      allowed: false,
      message: "Assinatura necessária para convidar membros.",
    };
  }

  if (!isWithinLimit(params.memberCount, params.limits.max_team_members)) {
    return {
      allowed: false,
      message: "Limite de membros atingido. Faça upgrade para o plano Pro.",
    };
  }

  return { allowed: true };
}

export function evaluateCustomDomainAccess(params: {
  hasActiveSubscription: boolean;
  limits: PlanLimits;
  customDomainCount: number;
}): { allowed: true } | { allowed: false; message: string } {
  if (!params.hasActiveSubscription) {
    return {
      allowed: false,
      message: "Assinatura necessária para adicionar domínio personalizado.",
    };
  }

  if (
    !isWithinLimit(params.customDomainCount, params.limits.max_custom_domains)
  ) {
    return {
      allowed: false,
      message:
        "Limite de domínios personalizados atingido. Faça upgrade para o plano Pro.",
    };
  }

  return { allowed: true };
}
