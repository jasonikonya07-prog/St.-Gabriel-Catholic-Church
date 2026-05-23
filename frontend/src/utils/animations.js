export const gentleEase = [0.22, 1, 0.36, 1];

export const viewportOnce = {
  once: true,
  amount: 0.16,
  margin: "0px 0px -72px 0px",
};

export const sectionReveal = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: gentleEase },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, delay, ease: gentleEase },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.8, delay, ease: gentleEase },
  }),
};

export const slideLeft = {
  hidden: { opacity: 0, x: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay, ease: gentleEase },
  }),
};

export const slideRight = {
  hidden: { opacity: 0, x: -28 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay, ease: gentleEase },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.54, delay, ease: gentleEase },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

export const cardReveal = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: index * 0.045, ease: gentleEase },
  }),
};

export const hoverLift = {
  rest: { y: 0 },
  hover: {
    y: -8,
    transition: { duration: 0.32, ease: gentleEase },
  },
};

export const buttonGlow = {
  rest: {
    y: 0,
    boxShadow: "0 18px 45px rgba(201, 162, 39, 0.22)",
  },
  hover: {
    y: -3,
    boxShadow: "0 24px 70px rgba(201, 162, 39, 0.34)",
    transition: { duration: 0.34, ease: gentleEase },
  },
  tap: {
    y: 0,
    scale: 0.985,
  },
};

export const buttonReveal = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.58, delay, ease: gentleEase },
  }),
  hover: {
    y: -3,
    scale: 1.015,
    boxShadow: "0 18px 44px rgba(201, 162, 39, 0.26)",
    transition: { duration: 0.34, ease: gentleEase },
  },
  tap: {
    y: 0,
    scale: 0.985,
  },
};

export const cardHover = {
  rest: {
    y: 0,
    boxShadow: "0 18px 45px rgba(17, 24, 39, 0.08)",
  },
  hover: {
    y: -8,
    boxShadow: "0 20px 52px rgba(7, 26, 45, 0.12)",
    transition: { duration: 0.34, ease: gentleEase },
  },
};
