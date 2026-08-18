/** Caminho até um valor no payload, no formato de path do Postgres. */
export type PayloadPath = string[];

export type IntegrationKind = "purchase" | "refund";

export type IntegrationEventStatus =
  | "captured"
  | "processed"
  | "ignored"
  | "failed";

export type EventFilterConfig = {
  path: PayloadPath;
  acceptedValues: string[];
};

export type AmountConfig = {
  path: PayloadPath;
  /** `cents` = 9900; `currency` = "99,00". */
  unit: "cents" | "currency";
};

export type PlanConfig =
  | { mode: "fixed"; planId: string }
  | { mode: "reference"; path: PayloadPath }
  /** Varre um array do payload — order bump põe o produto principal fora do índice 0. */
  | { mode: "reference_any"; arrayPath: PayloadPath; key: string };

export type AccessConfig =
  | { mode: "fixed"; days: number }
  | { mode: "path"; path: PayloadPath };

export type PurchaseFieldMapping = {
  version: 1;
  eventFilter?: EventFilterConfig;
  email: PayloadPath;
  fullName?: PayloadPath;
  externalPaymentId: PayloadPath;
  amount?: AmountConfig;
  paymentMethod?: PayloadPath;
  plan: PlanConfig;
  access: AccessConfig;
};

export type RefundFieldMapping = {
  version: 1;
  eventFilter?: EventFilterConfig;
  email?: PayloadPath;
  externalPaymentId?: PayloadPath;
};

export type FieldMapping = PurchaseFieldMapping | RefundFieldMapping;

export type AdminIntegrationRow = {
  id: string;
  name: string;
  kind: IntegrationKind;
  providerSlug: string;
  enabled: boolean;
  fieldMapping: Record<string, unknown>;
  /** Nunca sai do servidor — só indica se há senha configurada. */
  hasDefaultPassword: boolean;
  createdAt: string;
  updatedAt: string;
  eventCount: number;
  failedCount: number;
  lastEventAt: string | null;
};

export type AdminIntegrationEventRow = {
  id: string;
  integrationId: string;
  eventKey: string | null;
  payload: Record<string, unknown>;
  status: IntegrationEventStatus;
  outcome: string | null;
  errorMessage: string | null;
  resolved: Record<string, unknown> | null;
  workspaceId: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type AdminIntegrationDetail = {
  integration: AdminIntegrationRow;
  /** `null` quando NEXT_PUBLIC_SUPABASE_URL não está configurada. */
  webhookUrl: string | null;
  events: AdminIntegrationEventRow[];
};

/** Estado de onboarding derivado — não é coluna, para não sair de sincronia. */
export type IntegrationStatus =
  | "awaiting_sample"
  | "needs_mapping"
  | "ready"
  | "active";

/** Retorno de `integration_apply_mapping`. */
export type MappingPreview = {
  mapped: boolean;
  email?: string | null;
  fullName?: string | null;
  externalPaymentId?: string | null;
  paymentMethod?: string | null;
  amountCents?: number | null;
  planId?: string | null;
  planRefs?: string[];
  days?: number | null;
  eventValue?: string | null;
  eventAccepted?: boolean;
  errors: string[];
};

/** Um caminho detectado no payload de exemplo, para popular os selects. */
export type DetectedPath = {
  path: PayloadPath;
  label: string;
  preview: string;
  isArray: boolean;
};
