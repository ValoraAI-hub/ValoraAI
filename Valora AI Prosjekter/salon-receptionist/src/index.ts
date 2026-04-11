/**
 * Entry point for the Salon Receptionist API server.
 *
 * Responsibilities:
 * - Bootstrap Express app with global middleware (helmet, cors, rate limiting, JSON parsing)
 * - Mount all route modules under /api/v1
 * - Start HTTP server and listen on configured port
 * - Handle graceful shutdown (SIGTERM / SIGINT)
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { router } from './routes';

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors()); // TODO: tighten origins per-tenant when moving to production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ── Error handler (must be last) ───────────────────────────────────────────────
app.use(errorMiddleware);

// ── Start server ───────────────────────────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info(`Salon Receptionist API listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

const shutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app };
