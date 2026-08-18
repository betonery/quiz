"use client";

import { Reveal, SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingPlatform() {
  const landingContent = useLandingContent();
  return (
    <section id="recursos" className="scroll-mt-20 bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.platform.subtitle}
          title={landingContent.platform.title}
          description={landingContent.platform.description}
        />

        <Stagger className="mt-14 flex flex-wrap justify-center gap-3">
          {landingContent.platform.features.map((feature) => (
            <StaggerItem key={feature}>
              <span className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-brand-secondary/50 hover:bg-brand-secondary/5">
                {feature}
              </span>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <p className="text-sm font-medium text-brand-secondary">
            Tudo em uma única plataforma.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
