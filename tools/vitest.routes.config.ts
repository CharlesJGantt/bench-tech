import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tools/build-routes.gen.ts'], testTimeout: 3_600_000 },
});
