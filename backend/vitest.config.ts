import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10_000,
    hookTimeout: 10_000,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // Load env from backend/.env
    env: {
      DATABASE_URL: 'postgresql://a11y_user:a11y_pass@localhost:5432/a11y_db?schema=public',
      GEMINI_API_KEY: 'test-key',
      JWT_SECRET: 'test-jwt-secret-at-least-16-chars',
    },
  },
});
