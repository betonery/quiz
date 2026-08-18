"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { SectionHeader } from "./reveal";
import { useLandingContent } from "./use-landing-content";

export function LandingFaq() {
  const landingContent = useLandingContent();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-20 bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <SectionHeader
          subtitle={landingContent.faq.subtitle}
          title={landingContent.faq.title}
        />

        <div className="mt-14 space-y-3">
          {landingContent.faq.items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-foreground">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={
                        shouldReduceMotion ? false : { height: 0, opacity: 0 }
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={
                        shouldReduceMotion
                          ? undefined
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.25 }}
                    >
                      <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
