import rateLimit from 'express-rate-limit';
import { config } from '../config';

const handler = (message: string) => (_req: unknown, res: import('express').Response) => {
  res.status(429).json({ error: message, code: 'RATE_LIMITED' });
};

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many requests. Please slow down and try again shortly.'),
});

export const analyzeLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.analyzeMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many analyze requests. Please wait a moment before trying again.'),
});

export const downloadLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.downloadMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many download requests. Please wait a moment before trying again.'),
});
