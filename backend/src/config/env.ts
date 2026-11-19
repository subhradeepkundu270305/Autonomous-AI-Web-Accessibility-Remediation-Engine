import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().optional(),

  // Gemini AI
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),

  // Scan settings
  SCAN_TIMEOUT_MS: z.coerce.number().default(30_000),
  GEMINI_HTML_MAX_BYTES: z.coerce.number().default(50_000),
  UPLOADS_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/**
 * Validated, typed environment variables.
 * All backend modules import from here — never read process.env directly.
 */
export const env = parsed.data;

// Backwards-compat alias (the Phase-0 scaffold exported `config`)
export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  databaseUrl: env.DATABASE_URL,
  geminiApiKey: env.GEMINI_API_KEY,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
  scan: {
    timeoutMs: env.SCAN_TIMEOUT_MS,
    geminiHtmlMaxBytes: env.GEMINI_HTML_MAX_BYTES,
    uploadsDir: env.UPLOADS_DIR,
  },
} as const;

export type Config = typeof config;
