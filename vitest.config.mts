import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Next aliases this at build time. Tests run outside Next.
      "server-only": "next/dist/compiled/server-only/empty.js",
    },
  },
});
