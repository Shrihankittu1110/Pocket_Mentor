import express from 'express';
import {
  generateQuizFromNote,
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
} from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateQuizFromNote);
router.get('/', getQuizzes);
router.get('/results', getQuizResults);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz);

export default router;
