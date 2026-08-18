"use client";

import { Brain, Target, TrendingUp, Zap } from "lucide-react";

import { Reveal, SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

const iconMap = {
  target: Target,
  "trending-up": TrendingUp,
  zap: Zap,
  brain: Brain,
} as const;

export function LandingWhy() {
  const landingContent = useLandingContent();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.why.title}
          title={landingContent.why.subtitle}
          description={landingContent.why.description}
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {landingContent.why.cards.map((card) => {
            const Icon = iconMap[card.icon as keyof typeof iconMap];
            return (
              <StaggerItem key={card.title}>
                <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-secondary/40 hover:shadow-lg">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary transition-colors group-hover:bg-brand-secondary group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <p className="mx-auto max-w-3xl text-base text-muted-foreground">
            {landingContent.why.footer}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
