"use client";

import { Reveal, SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingIntegrations() {
  const landingContent = useLandingContent();
  return (
    <section className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.integrations.subtitle}
          title={landingContent.integrations.title}
          description={landingContent.integrations.description}
        />

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {landingContent.integrations.items.map((item) => (
            <StaggerItem key={item}>
              <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-background px-4 py-6 text-center text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-brand-secondary/40 hover:shadow-md">
                {item}
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <p className="text-base font-medium text-brand-secondary">
            {landingContent.integrations.footer}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
