import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function useDecorativeMotion(query = "(min-width: 768px)") {
  const prefersReducedMotion = useReducedMotion();
  const [matchesQuery, setMatchesQuery] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || typeof window === "undefined") {
      setMatchesQuery(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatchesQuery(mediaQuery.matches);

    updateMatch();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMatch);
      return () => mediaQuery.removeEventListener("change", updateMatch);
    }

    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, [prefersReducedMotion, query]);

  return !prefersReducedMotion && matchesQuery;
}
