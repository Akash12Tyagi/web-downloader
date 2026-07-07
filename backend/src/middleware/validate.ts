import { z } from 'zod';

export const analyzeSchema = z.object({
  url: z.string().trim().min(1, 'A URL is required.').max(2048, 'URL is too long.'),
});

export const downloadSchema = z.object({
  url: z.string().trim().min(1, 'A URL is required.').max(2048),
  platform: z.enum(['youtube', 'instagram']),
  kind: z.enum(['video', 'audio', 'image']),
  formatId: z.string().min(1).max(64),
  audioFormat: z.enum(['mp3', 'm4a']).optional(),
  audioBitrateKbps: z.number().int().positive().max(320).optional(),
  carouselIndex: z.number().int().min(0).optional(),
  mediaUrl: z.string().url().max(2048).optional(),
  title: z.string().max(200).optional(),
});

export const jobIdParamSchema = z.object({
  id: z.string().min(1).max(64),
});
