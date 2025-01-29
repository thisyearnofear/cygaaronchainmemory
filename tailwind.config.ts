import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        mound: "url('/images/mound.png')",
        "mound-hover": "url('/images/mound_hover.png')",
      },
    },
  },
  plugins: [],
} satisfies Config;
