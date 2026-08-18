"use client";

import { SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingDifferentiators() {
  const landingContent = useLandingContent();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.differentiators.subtitle}
          title={landingContent.differentiators.title}
        />

        <Stagger className="mt-14 flex flex-wrap justify-center gap-3">
          {landingContent.differentiators.items.map((item) => (
            <StaggerItem key={item}>
              <span className="inline-flex rounded-full border border-brand-secondary/30 bg-brand-secondary/5 px-4 py-2 text-sm font-medium text-foreground">
                {item}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
