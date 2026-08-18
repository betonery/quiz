"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToAnchor } from "./landing-content";
import { Reveal } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingHero() {
  const landingContent = useLandingContent();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="landing-tech-bg relative overflow-hidden text-white">
      <div className="landing-tech-grid absolute inset-0 opacity-40" />
      <div className="landing-glow-blue landing-pulse-glow absolute -top-32 -left-32 size-[480px] rounded-full blur-3xl" />
      <div className="landing-glow-indigo landing-pulse-glow absolute -right-32 top-1/3 size-[520px] rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
              {landingContent.hero.badge}
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              {landingContent.hero.headline}
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">
              {landingContent.hero.subheadline}
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              {landingContent.hero.description}
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                variant="brand"
                size="lg"
                className="h-11 px-6 text-base"
                onClick={() => scrollToAnchor("#planos")}
              >
                {landingContent.hero.primaryCta}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"
                onClick={() => scrollToAnchor("#demo")}
              >
                <Play className="size-4" />
                {landingContent.hero.secondaryCta}
              </Button>
            </div>
          </Reveal>
        </div>

        {!shouldReduceMotion ? (
          <motion.div
            className="landing-float pointer-events-none absolute right-10 top-20 hidden size-24 rounded-2xl border border-white/10 bg-white/5 lg:block"
            animate={{ rotate: [0, 6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </div>
    </section>
  );
}
