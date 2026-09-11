import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // This suite ships with tests that are red on purpose (see design.md),
      // so a coverage report must still be produced when tests fail.
      reportOnFailure: true,
    },
  },
});
