import { statSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

/** The newest model file time: appended to the .glb URLs so a browser never serves an outdated cached model. */
const modelsVersion = ['parts', 'shells']
  .map((f) => {
    try {
      return Math.floor(statSync(`public/models/${f}.glb`).mtimeMs);
    } catch {
      return 0;
    }
  })
  .reduce((a, b) => Math.max(a, b), 0);

export default defineConfig({
  define: { __MODELS_V__: JSON.stringify(String(modelsVersion)) },
  test: {
    // Fault-generator suites solve hundreds of boards.
    testTimeout: 180_000,
  },
});
