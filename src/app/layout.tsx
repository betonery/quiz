import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import {
  BRANDING_DEFAULTS,
  type PlatformBranding,
} from "@/config/branding.defaults";
import { getCachedPlatformBranding } from "@/domains/admin/services/admin-settings.service";
import { Providers } from "./providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export async function generateMetadata(): Promise<Metadata> {
  let branding: PlatformBranding = BRANDING_DEFAULTS;

  try {
    branding = await getCachedPlatformBranding();
  } catch {
    // Ambiente sem service role.
  }

  return {
    title: {
      default: branding.productName,
      template: `%s | ${branding.productName}`,
    },
    description: branding.productDescription,
    icons: branding.faviconUrl
      ? { icon: branding.faviconUrl, apple: branding.faviconUrl }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let branding: PlatformBranding = BRANDING_DEFAULTS;

  try {
    branding = await getCachedPlatformBranding();
  } catch {
    // Build / ambiente sem service role: usa defaults neutros.
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers branding={branding}>{children}</Providers>
      </body>
    </html>
  );
}
