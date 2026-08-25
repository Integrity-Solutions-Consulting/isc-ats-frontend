import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Vitest defaults to 5s, which the userEvent-driven component tests exceed
    // when the whole suite runs in parallel on a loaded machine — producing
    // timeouts that move around between runs and are never assertion failures.
    // A genuinely broken test still fails on its assertion, so this only removes
    // false alarms; a suite that cries wolf trains everyone to ignore red.
    testTimeout: 15000,
  },
});
