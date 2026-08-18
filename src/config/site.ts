import { BRANDING_DEFAULTS } from "@/config/branding.defaults";

export const siteConfig = {
  name: BRANDING_DEFAULTS.productName,
  description: BRANDING_DEFAULTS.productDescription,
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
