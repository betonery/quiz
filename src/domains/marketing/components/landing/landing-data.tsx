"use client";

import { BarChart3 } from "lucide-react";

import { Reveal, SectionHeader } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingData() {
  const landingContent = useLandingContent();
  return (
    <section className="landing-tech-bg relative overflow-hidden py-20 text-white md:py-28">
      <div className="landing-tech-grid absolute inset-0 opacity-30" />
      <div className="landing-glow-indigo landing-pulse-glow absolute -left-20 top-1/2 size-80 -translate-y-1/2 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.data.subtitle}
          title={landingContent.data.title}
          description={landingContent.data.description}
          dark
        />

        <Reveal className="mt-14">
          <div className="landing-glass mx-auto max-w-2xl rounded-3xl p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                <BarChart3 className="size-6 text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Insights em tempo real</p>
                <p className="text-lg font-semibold">Perfil do lead</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Objetivo", value: 82 },
                { label: "Orçamento", value: 64 },
                { label: "Urgência", value: 91 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
