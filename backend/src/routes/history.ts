import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { clearHistory, getHistory, removeHistoryEntry } from '../services/history.service';
import { jobIdParamSchema } from '../middleware/validate';

export const historyRouter = Router();

historyRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ history: getHistory() });
  }),
);

historyRouter.delete(
  '/',
  asyncHandler(async (_req, res) => {
    clearHistory();
    res.json({ cleared: true });
  }),
);

historyRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = jobIdParamSchema.parse(req.params);
    removeHistoryEntry(id);
    res.json({ removed: true });
  }),
);
