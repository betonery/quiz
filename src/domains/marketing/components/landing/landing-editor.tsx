"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GripVertical, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToAnchor } from "./landing-content";
import { Reveal, SectionHeader } from "./reveal";
import { useLandingContent } from "./use-landing-content";

const mockWidgets = [
  { label: "Título", width: "w-3/4" },
  { label: "Pergunta", width: "w-full" },
  { label: "Opção A", width: "w-5/6" },
  { label: "Opção B", width: "w-5/6" },
  { label: "Botão CTA", width: "w-1/2" },
];

export function LandingEditor() {
  const landingContent = useLandingContent();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.editor.subtitle}
          title={landingContent.editor.title}
          description={landingContent.editor.description}
        />

        <Reveal className="mt-14">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-amber-400" />
              <div className="size-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                Editor Visual — {landingContent.comparison.product.title}
              </span>
            </div>

            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <aside className="hidden border-r border-border bg-muted/30 p-4 md:block">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Componentes
                </p>
                <div className="space-y-2">
                  {["Texto", "Imagem", "Botão", "Pergunta", "Formulário"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <GripVertical className="size-4 text-muted-foreground" />
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </aside>

              <div className="relative min-h-[320px] p-6 md:p-8">
                <div className="mx-auto max-w-md space-y-4">
                  {mockWidgets.map((widget, index) => (
                    <motion.div
                      key={widget.label}
                      className={`flex items-center gap-3 rounded-xl border border-dashed border-brand-secondary/40 bg-brand-secondary/5 px-4 py-3 ${widget.width}`}
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : { y: [0, -4, 0], opacity: [0.85, 1, 0.85] }
                      }
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.4,
                        ease: "easeInOut",
                      }}
                    >
                      <GripVertical className="size-4 text-brand-secondary" />
                      <span className="text-sm font-medium">
                        {widget.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {!shouldReduceMotion ? (
                  <motion.div
                    className="pointer-events-none absolute bottom-10 right-10 flex items-center gap-2 rounded-full bg-brand-secondary px-3 py-1.5 text-xs font-medium text-white shadow-lg"
                    animate={{ x: [0, 8, 0], y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <MousePointer2 className="size-3.5" />
                    Drag & Drop
                  </motion.div>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-10 flex justify-center">
          <Button
            variant="brand"
            size="lg"
            onClick={() => scrollToAnchor("#planos")}
          >
            {landingContent.editor.cta}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
