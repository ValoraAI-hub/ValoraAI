/**
 * Centralised logger (Winston).
 *
 * Usage: import { logger } from '@/config/logger'
 *
 * In production, logs are emitted as JSON for ingestion into
 * a log aggregator (e.g., Logtail, Datadog, Grafana Loki).
 * In development, pretty-printed console output is used.
 */

import winston from 'winston';

const { combine, timestamp, json, colorize, simple } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev
    ? combine(colorize(), simple())
    : combine(timestamp(), json()),
  transports: [new winston.transports.Console()],
});
