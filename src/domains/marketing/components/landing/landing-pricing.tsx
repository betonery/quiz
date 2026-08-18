"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Reveal, SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingPricing() {
  const landingContent = useLandingContent();
  return (
    <section id="planos" className="scroll-mt-20 bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.pricing.subtitle}
          title={landingContent.pricing.title}
        />

        <Stagger className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {landingContent.pricing.plans.map((plan) => (
            <StaggerItem key={plan.id}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-brand-secondary bg-background shadow-xl ring-2 ring-brand-secondary/20"
                    : "border-border bg-background"
                }`}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-secondary px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="size-3" />
                    Mais popular
                  </span>
                ) : null}

                <h3 className="text-2xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-6">
                  <p className="text-4xl font-bold text-foreground">
                    R$ {plan.price}
                    <span className="text-base font-medium text-muted-foreground">
                      /mês
                    </span>
                  </p>
                </div>

                {"highlights" in plan && plan.highlights ? (
                  <ul className="mt-6 space-y-2">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="text-sm text-foreground">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-6 flex-1" />
                )}

                <Button
                  nativeButton={false}
                  variant={plan.highlighted ? "brand" : "outline"}
                  className="mt-8 w-full"
                  render={
                    <a
                      href={plan.checkoutUrl}
                      {...(plan.checkoutUrl.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    />
                  }
                >
                  {landingContent.pricing.cta}
                </Button>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Assine o plano ideal para sua operação.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
