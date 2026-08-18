"use client";

import { SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingAudience() {
  const landingContent = useLandingContent();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.audience.subtitle}
          title={landingContent.audience.title}
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {landingContent.audience.items.map((item) => (
            <StaggerItem key={item.title}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-secondary/40 hover:shadow-lg">
                <h3 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
