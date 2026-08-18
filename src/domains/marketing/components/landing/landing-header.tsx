"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { scrollToAnchor } from "./landing-content";
import { useLandingContent } from "./use-landing-content";

type LandingHeaderProps = {
  isAuthenticated: boolean;
};

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  const landingContent = useLandingContent();
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo
          href={ROUTES.home}
          className="text-foreground [&_span:last-child]:text-foreground"
        />

        <nav className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={() => scrollToAnchor("#recursos")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {landingContent.nav.resources}
          </button>
          <button
            type="button"
            onClick={() => scrollToAnchor("#planos")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {landingContent.nav.pricing}
          </button>
          <button
            type="button"
            onClick={() => scrollToAnchor("#faq")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {landingContent.nav.faq}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button
              nativeButton={false}
              variant="brand"
              size="sm"
              render={<Link href={ROUTES.dashboard} />}
            >
              {landingContent.nav.dashboard}
            </Button>
          ) : (
            <>
              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                render={<Link href={ROUTES.login} />}
              >
                {landingContent.nav.login}
              </Button>
              <Button
                nativeButton={false}
                variant="brand"
                size="sm"
                render={<Link href={ROUTES.register} />}
              >
                {landingContent.nav.register}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
