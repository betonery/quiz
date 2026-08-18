export type MetaPixelIntegration = {
  enabled: boolean;
  pixelId: string;
};

export type UtmifyIntegration = {
  enabled: boolean;
  utmScriptEnabled: boolean;
  pixelId?: string;
};

export type QuizIntegrationsSettings = {
  metaPixel?: MetaPixelIntegration;
  utmify?: UtmifyIntegration;
};

export type QuizSettings = {
  integrations: QuizIntegrationsSettings;
  testIntegrationsInPreview?: boolean;
};

export type QuizCustomDomainStatus =
  | "pending"
  | "verified"
  | "failed"
  | "removed";

export type QuizCustomDomain = {
  id: string;
  quiz_id: string;
  workspace_id: string;
  hostname: string;
  status: QuizCustomDomainStatus;
  vercel_domain_id: string | null;
  verification_records: unknown[];
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomDomainMapping = {
  quizId: string;
  slug: string;
  hostname: string;
};
