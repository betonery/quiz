import type { ButtonAnimation } from "@/domains/quiz/types/builder.types";

export const BUTTON_ANIMATION_LABELS: Record<ButtonAnimation, string> = {
  none: "Nenhuma",
  pulse: "Pulsar",
  shake: "Vibrar",
  bounce: "Saltar",
  glow: "Brilhar",
  wiggle: "Balançar",
};

export function getButtonAnimationClass(
  animation: ButtonAnimation,
): string | undefined {
  if (animation === "none") return undefined;
  return `btn-animate-${animation}`;
}
