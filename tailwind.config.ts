import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        "ufo-bg": "#ececec",
        "ufo-surface": "#ffffff",
        "ufo-text": "#1f1f1f",
        "ufo-text-muted": "#a4a4a4",
        "ufo-text-subtle": "#8f8f8f",
        "ufo-text-secondary": "#6f6f6f",
        "ufo-text-neutral": "#8c8c8c",
        "ufo-text-dim": "#9a9a9a",
        "ufo-border": "#ffa8a8",
        "ufo-border-light": "#dddddd",
        "ufo-brand": "#ffaba6",
        "ufo-brand-soft": "#fecbc8",
        "ufo-brand-pale": "#fff1ed",
        "ufo-credit": "#49eaff",
        "ufo-kakao": "#fee500",
        "ufo-naver": "#03a94d",
        "ufo-error": "#d04949",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
