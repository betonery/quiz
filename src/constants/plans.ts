export const PLANS = {
  STARTER: "starter",
  PRO: "pro",
} as const;

export type PlanId = (typeof PLANS)[keyof typeof PLANS];

export const PLAN_LABELS: Record<PlanId, string> = {
  [PLANS.STARTER]: "Starter",
  [PLANS.PRO]: "Pro",
};
