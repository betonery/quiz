import type { Variants } from "framer-motion";
import type { StepTransition } from "@/domains/quiz/types/design.types";

export function getStepTransitionVariants(
  transition: StepTransition,
): Variants {
  switch (transition) {
    case "fade_in":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    case "slide":
      return {
        initial: { opacity: 0, x: 48 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -48 },
      };
    case "zoom":
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.92 },
      };
    case "none":
      return {
        initial: {},
        animate: {},
        exit: {},
      };
  }
}
