"use client";

import { Quote } from "lucide-react";

import { SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingTestimonials() {
  const landingContent = useLandingContent();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.testimonials.subtitle}
          title={landingContent.testimonials.title}
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2">
          {landingContent.testimonials.items.map((quote, index) => (
            <StaggerItem key={quote}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Quote className="size-8 text-brand-secondary/40" />
                <p className="mt-4 text-base leading-relaxed text-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  Cliente {landingContent.comparison.product.title} #{index + 1}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
