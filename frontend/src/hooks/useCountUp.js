import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function useCountUp({ amount = 0.45, duration = 1400, end, start = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount });
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!isInView) return undefined;

    if (prefersReducedMotion) {
      setValue(end);
      return undefined;
    }

    let frameId;
    const startedAt = performance.now();

    const tick = (time) => {
      const progress = Math.min((time - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setValue(start + (end - start) * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [duration, end, isInView, prefersReducedMotion, start]);

  return { ref, value };
}
