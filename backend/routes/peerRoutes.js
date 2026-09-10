import express from 'express';
import {
  getQuestions,
  createQuestion,
  answerQuestion,
  voteAnswer,
  markBestAnswer,
} from '../controllers/peerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.post('/questions/:id/answers', answerQuestion);
router.post('/questions/:postId/answers/:answerId/vote', voteAnswer);
router.post('/questions/:postId/answers/:answerId/best', markBestAnswer);

export default router;
