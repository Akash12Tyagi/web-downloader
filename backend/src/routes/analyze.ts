import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { analyzeLimiter } from '../middleware/rateLimiter';
import { analyzeSchema } from '../middleware/validate';
import { detectPlatform, sanitizeUrl } from '../utils/url';
import { getCached, setCached } from '../services/cache.service';
import { analyzeUrl } from '../services/ytdlp.service';

export const analyzeRouter = Router();

analyzeRouter.post(
  '/',
  analyzeLimiter,
  asyncHandler(async (req, res) => {
    const { url: rawUrl } = analyzeSchema.parse(req.body);
    const platform = detectPlatform(rawUrl);
    const url = sanitizeUrl(rawUrl);
    const cacheKey = `${platform}:${url}`;

    const cached = getCached(cacheKey);
    if (cached) {
      res.json({ ...cached, cached: true });
      return;
    }

    const result = await analyzeUrl(url, platform);
    setCached(cacheKey, result);
    res.json({ ...result, cached: false });
  }),
);
