import * as dashboardService from './dashboard.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.id);
  res.status(200).json(stats);
});
