/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#031525",
        navy: "#071A2D",
        gold: "#C9A227",
        "gold-dark": "#A98216",
        cream: "#F8F3E7",
        ink: "#111827",
        warm: "#6B7280",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 24px 80px rgba(7, 26, 45, 0.14)",
        soft: "0 18px 45px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};
