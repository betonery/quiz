"use client";

import { useEffect, useState } from "react";
import { clampLevelPercentage } from "@/domains/quiz/utils/level-widget.utils";

type UseAnimatedPercentageOptions = {
  animate?: boolean;
  durationMs?: number;
};

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function useAnimatedPercentage(
  target: number,
  { animate = true, durationMs = 1200 }: UseAnimatedPercentageOptions = {},
) {
  const clampedTarget = clampLevelPercentage(target);
  const [value, setValue] = useState(animate ? 0 : clampedTarget);

  useEffect(() => {
    if (!animate) {
      setValue(clampedTarget);
      return;
    }

    setValue(0);
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(clampedTarget * easeOutCubic(progress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setValue(clampedTarget);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [animate, clampedTarget, durationMs]);

  return { value };
}
