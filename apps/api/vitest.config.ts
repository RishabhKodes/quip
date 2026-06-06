import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@quip/shared": resolve(__dirname, "../../packages/shared/src"),
    },
  },
  test: {
    globals: false,
    environment: "node",
  },
});
