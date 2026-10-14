import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Fault-generator suites solve hundreds of boards.
    testTimeout: 180_000,
  },
});
