import { defineConfig } from "vitest/config"

// Live tests call real provider APIs. They read credentials from ../../.env and
// skip a provider whose key is absent. Run with `just live`.
export default defineConfig({
  test: {
    include: ["test/live/**/*.test.ts"],
    testTimeout: 60_000
  }
})
