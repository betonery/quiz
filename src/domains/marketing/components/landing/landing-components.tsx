"use client";

import { SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingComponents() {
  const landingContent = useLandingContent();
  return (
    <section className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.components.subtitle}
          title={landingContent.components.title}
        />

        <Stagger className="mt-14 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {landingContent.components.items.map((item) => (
            <StaggerItem key={item}>
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-secondary/40 hover:shadow-md">
                {item}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
