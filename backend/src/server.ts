import fs from 'fs';
import cron from 'node-cron';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { scheduleJobCleanup } from './services/queue.service';
import { clearExpired } from './services/cache.service';

fs.mkdirSync(config.tmpDir, { recursive: true });

const app = createApp();

cron.schedule('*/5 * * * *', () => {
  scheduleJobCleanup();
  clearExpired();
});

const server = app.listen(config.port, () => {
  logger.info(`MediaHub API listening on port ${config.port}`, { env: config.nodeEnv });
});

function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
