export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled";

export type PlanLimits = {
  max_quizzes: number;
  max_team_members: number;
  max_custom_domains: number;
};

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  limits: PlanLimits;
  price_cents: number | null;
  checkout_url: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "paid" | "failed" | "refunded";

export type WorkspacePayment = {
  id: string;
  workspace_id: string;
  plan_id: string;
  external_payment_id: string;
  provider: string;
  amount_cents: number;
  payment_method: string;
  period_start: string;
  period_end: string;
  status: PaymentStatus;
  created_at: string;
};

export type WorkspaceSubscription = {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceSubscriptionWithPlan = WorkspaceSubscription & {
  plan: Plan;
};

export type CreateQuizAccessResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "no_subscription" | "limit_reached";
      message: string;
    };
