import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { analyzeRouter } from './routes/analyze';
import { downloadRouter, progressRouter } from './routes/download';
import { historyRouter } from './routes/history';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(generalLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/analyze', analyzeRouter);
  app.use('/api/download', downloadRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/history', historyRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
