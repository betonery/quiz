"use client";

import { Logo } from "@/components/shared/logo";
import { ROUTES } from "@/constants/routes";
import { useLandingContent } from "./use-landing-content";

export function LandingFooter() {
  const landingContent = useLandingContent();
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo
            href={ROUTES.home}
            className="text-foreground [&_span:last-child]:text-foreground"
          />
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {landingContent.footer.description}
          </p>
          <p className="text-sm font-semibold text-brand-secondary">
            {landingContent.footer.tagline}
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            {landingContent.comparison.product.title}. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
