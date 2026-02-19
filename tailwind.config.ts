import type { Config } from "tailwindcss";

const config: Config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
            },
        },
    },
};

export default config;