"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Reveal, SectionHeader, Stagger, StaggerItem } from "./reveal";
import { useLandingContent } from "./use-landing-content";

function AnimatedMetric({ label, value }: { label: string; value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-700 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <p className="text-3xl font-bold text-brand-secondary md:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function LandingPerformance() {
  const landingContent = useLandingContent();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.performance.subtitle}
          title={landingContent.performance.title}
          description={landingContent.performance.description}
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {landingContent.performance.metrics.map((metric) => (
            <StaggerItem key={metric.label}>
              <AnimatedMetric label={metric.label} value={metric.value} />
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-10">
          <ul className="flex flex-wrap justify-center gap-4">
            {landingContent.performance.benefits.map((benefit) => (
              <li
                key={benefit}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium"
              >
                <CheckCircle2 className="size-4 text-brand-secondary" />
                {benefit}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
