import react from "@vitejs/plugin-react";
import fusion from "fusion/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // fusion() makes `import ... from "react"` resolve to the Fusion shim.
  plugins: [fusion(), react()],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
