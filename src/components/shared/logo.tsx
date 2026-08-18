"use client";

import Link from "next/link";
import { monogramFromName } from "@/config/branding.defaults";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useBranding } from "@/providers/branding-provider";

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className, href = ROUTES.dashboard }: LogoProps) {
  const branding = useBranding();
  const monogram = monogramFromName(branding.productName);

  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      {branding.logoUrl ? (
        // URL externa configurável pelo admin — evita remotePatterns do next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={branding.productName}
          className="h-9 w-auto max-w-[160px] object-contain transition-transform group-hover:scale-105"
        />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-transform group-hover:scale-105">
          <span className="text-sm font-black tracking-tighter text-white">
            {monogram}
          </span>
        </span>
      )}
      <span className="text-lg font-bold tracking-tight text-inherit">
        {branding.productName}
      </span>
    </Link>
  );
}
