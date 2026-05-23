import { useMemo } from "react";
import { useDecorativeMotion } from "../hooks/useDecorativeMotion";

function seededRandom(seed) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function buildParticles(count, seed) {
  return Array.from({ length: count }, (_, index) => {
    const base = seed + index * 13;
    const size = 2 + seededRandom(base) * 4;
    const opacity = 0.14 + seededRandom(base + 1) * 0.28;
    const duration = 18 + seededRandom(base + 2) * 18;
    const driftX = -28 + seededRandom(base + 3) * 56;
    const driftY = -36 - seededRandom(base + 4) * 80;

    return {
      id: `${seed}-${index}`,
      left: `${seededRandom(base + 5) * 100}%`,
      top: `${seededRandom(base + 6) * 100}%`,
      size: `${size}px`,
      opacity,
      duration: `${duration}s`,
      delay: `-${seededRandom(base + 7) * duration}s`,
      driftX: `${driftX}px`,
      driftY: `${driftY}px`,
    };
  });
}

function FloatingParticles({ className = "", count = 20, seed = 1 }) {
  const allowDecorativeMotion = useDecorativeMotion();
  const particleCount = allowDecorativeMotion ? Math.min(count, 10) : 0;
  const particles = useMemo(() => buildParticles(particleCount, seed), [particleCount, seed]);

  if (particleCount === 0) {
    return null;
  }

  return (
    <div aria-hidden="true" className={`floating-particles pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="floating-particle"
          style={{
            "--particle-left": particle.left,
            "--particle-top": particle.top,
            "--particle-size": particle.size,
            "--particle-opacity": particle.opacity,
            "--particle-duration": particle.duration,
            "--particle-delay": particle.delay,
            "--particle-drift-x": particle.driftX,
            "--particle-drift-y": particle.driftY,
          }}
        />
      ))}
    </div>
  );
}

export default FloatingParticles;
