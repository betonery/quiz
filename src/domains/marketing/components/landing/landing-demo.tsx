"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Reveal, SectionHeader } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingDemo() {
  const landingContent = useLandingContent();
  const shouldReduceMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(35);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setSelectedIndex((current) => {
        const next = (current + 1) % landingContent.demo.mockOptions.length;
        setProgress(35 + next * 20);
        return next;
      });
    }, 2800);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <section id="demo" className="scroll-mt-20 bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle="Demonstração"
          title={landingContent.demo.title}
          description={landingContent.demo.description}
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <ul className="space-y-4">
              {landingContent.demo.results.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-base text-foreground"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-brand-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="landing-glass-light rounded-3xl p-6 shadow-xl md:p-8">
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Progresso</span>
                  <span>{Math.min(progress, 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              <p className="text-lg font-semibold text-foreground">
                {landingContent.demo.mockQuestion}
              </p>

              <div className="mt-5 space-y-3">
                {landingContent.demo.mockOptions.map((option, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <motion.div
                      key={option}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        isSelected
                          ? "border-brand-secondary bg-brand-secondary/10 text-brand-secondary"
                          : "border-border bg-background text-foreground"
                      }`}
                      animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      {option}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
