import { defineConfig } from "vitest/config";
import fusion from "./vite.ts";

export default defineConfig({
  plugins: [fusion()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
