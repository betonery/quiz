"use client";

import { Check, X } from "lucide-react";

import { Reveal, SectionHeader } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingComparison() {
  const landingContent = useLandingContent();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.comparison.subtitle}
          title={landingContent.comparison.title}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-border bg-muted/30 p-8">
              <h3 className="text-xl font-bold text-foreground">
                {landingContent.comparison.landing.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {landingContent.comparison.landing.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <X className="mt-0.5 size-5 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border-2 border-brand-secondary/50 bg-brand-secondary/5 p-8 shadow-lg">
              <h3 className="text-xl font-bold text-brand-secondary">
                {landingContent.comparison.product.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {landingContent.comparison.product.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-foreground"
                  >
                    <Check className="mt-0.5 size-5 shrink-0 text-brand-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
