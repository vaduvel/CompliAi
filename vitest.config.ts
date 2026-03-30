import path from "node:path"

import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, ".claude/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
})
