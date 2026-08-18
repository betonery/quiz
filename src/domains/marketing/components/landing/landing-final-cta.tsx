"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToAnchor } from "./landing-content";
import { Reveal } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingFinalCta() {
  const landingContent = useLandingContent();
  return (
    <section className="landing-tech-bg relative overflow-hidden py-20 text-white md:py-28">
      <div className="landing-tech-grid absolute inset-0 opacity-30" />
      <div className="landing-glow-blue landing-pulse-glow absolute left-1/2 top-0 size-[600px] -translate-x-1/2 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            {landingContent.finalCta.title}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            {landingContent.finalCta.description}
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <Button
            variant="brand"
            size="lg"
            className="mt-10 h-12 px-8 text-base"
            onClick={() => scrollToAnchor("#planos")}
          >
            {landingContent.finalCta.cta}
            <ArrowRight className="size-4" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
