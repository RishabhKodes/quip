import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const entry = process.env.ENTRY || "content";
const isPopup = entry === "popup";

const entries: Record<string, { input: string; format: "iife" | "es" }> = {
  background: {
    input: resolve(__dirname, "src/background/background.ts"),
    format: "iife",
  },
  content: {
    input: resolve(__dirname, "src/content/content.ts"),
    format: "iife",
  },
};

const current = entries[entry] || entries.content;

export default defineConfig({
  root: isPopup ? resolve(__dirname, "src/popup") : undefined,
  publicDir: false,
  plugins: entry === "content" || isPopup ? [react()] : [],
  build: isPopup
    ? {
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: false,
        sourcemap: process.env.NODE_ENV !== "production",
        minify: process.env.NODE_ENV === "production",
        rollupOptions: {
          input: resolve(__dirname, "src/popup/popup.html"),
        },
      }
    : {
        outDir: "dist",
        emptyOutDir: entry === "content",
        sourcemap: process.env.NODE_ENV !== "production",
        minify: process.env.NODE_ENV === "production",
        lib: {
          entry: current.input,
          name: entry,
          formats: [current.format],
          fileName: () => `${entry}.js`,
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
        },
      },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "../../packages/shared/src"),
    },
  },
  define: {
    __QUIP_DEFAULT_API_URL__: JSON.stringify(
      process.env.QUIP_DEFAULT_API_URL || "http://localhost:3000",
    ),
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
  },
});
