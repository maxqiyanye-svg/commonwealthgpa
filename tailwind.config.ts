import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface-1)",
        plane: "var(--plane)",
        ink: "var(--text-primary)",
        "ink-secondary": "var(--text-secondary)",
        "ink-muted": "var(--text-muted)",
        line: "var(--gridline)",
        baseline: "var(--baseline)",
        cat: {
          english: "var(--cat-english)",
          history: "var(--cat-history)",
          humanities: "var(--cat-humanities)",
          language: "var(--cat-language)",
          science: "var(--cat-science)",
          math: "var(--cat-math)",
          specialty: "var(--cat-specialty)",
          arts: "var(--cat-arts)",
        },
        status: {
          good: "#0ca30c",
          warning: "#fab219",
          serious: "#ec835a",
          critical: "#d03b3b",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
