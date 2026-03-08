import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        "ufo-bg": "#ececec",
        "ufo-surface": "#ffffff",
        "ufo-text": "#1f1f1f",
        "ufo-border": "#d9d9d9",
        "ufo-border-light": "#dddddd",
        "ufo-brand": "#ffaba6",
        "ufo-brand-soft": "#ffb5b3",
        "ufo-brand-pale": "#ffa8a8",
        "ufo-cyan": "#59cbe5",
        "ufo-text-muted": "#a4a4a4",
        "ufo-text-subtle": "#8f8f8f",
        "ufo-text-secondary": "#6f6f6f",
        "ufo-text-neutral": "#8c8c8c",
        "ufo-text-dim": "#9a9a9a",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
