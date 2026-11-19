import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

import { healthRouter } from './routes/health';
import { scansRouter } from './routes/scans';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';

const app = express();

// ─── Security & utility middleware ───────────────────────────────────────────
app.use(
  helmet({
    // Allow images and preview iframe from our uploads dir to load in the frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: false,
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static file serving (screenshots) ───────────────────────────────────────
// Screenshots stored at UPLOADS_DIR/screenshots/<scanId>.png
// Frontend accesses them via /uploads/screenshots/<scanId>.png
app.use('/uploads', express.static(path.resolve(env.UPLOADS_DIR)));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/health', healthRouter);        // GET /health
app.use('/api/auth', authRouter);        // POST /api/auth/register, /login, GET /api/auth/me
app.use('/api/scans', scansRouter);      // POST /api/scans, GET /api/scans/:id, etc.
app.use('/api/projects', projectsRouter); // GET /api/projects

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  console.info(`🚀 A11y Engine backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  console.info(`   Screenshots served at /uploads/screenshots/`);
});

// Graceful shutdown
const shutdown = () => {
  console.info('Shutting down gracefully...');
  server.close(() => {
    console.info('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10_000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app };
