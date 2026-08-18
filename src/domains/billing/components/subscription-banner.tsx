"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { ROUTES } from "@/constants/routes";

type SubscriptionBannerProps = {
  workspaceSlug: string;
  message: string;
};

export function SubscriptionBanner({
  workspaceSlug,
  message,
}: SubscriptionBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p className="text-sm text-amber-100">{message}</p>
      </div>
      <Link
        href={ROUTES.billing(workspaceSlug)}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/20"
      >
        Escolher plano
      </Link>
    </div>
  );
}
