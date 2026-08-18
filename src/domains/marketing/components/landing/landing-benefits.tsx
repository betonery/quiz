"use client";

import { CheckCircle2 } from "lucide-react";

import { SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingBenefits() {
  const landingContent = useLandingContent();
  return (
    <section className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.benefits.subtitle}
          title={landingContent.benefits.title}
        />

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landingContent.benefits.items.map((item) => (
            <StaggerItem key={item}>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-5 shadow-sm">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-secondary" />
                <span className="text-sm font-medium text-foreground">
                  {item}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
