import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tools/build-faces.gen.ts'] },
});
