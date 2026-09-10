import express from 'express';
import { getProgress, getStreakInfo, getAnalytics } from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getProgress);
router.get('/streak', getStreakInfo);
router.get('/analytics', getAnalytics);

export default router;
