export const features = {
  aiQuizGeneration: false,
  metaAdsIntegration: false,
  googleAdsIntegration: false,
  googleAnalyticsIntegration: false,
  webhooks: false,
  billing: true,
  realtimeAnalytics: false,
} as const;

export type FeatureFlag = keyof typeof features;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return features[flag];
}
