import express from 'express';
import {
  generateFlashcardsFromNote,
  getFlashcards,
  updateFlashcardDifficulty,
  createFlashcard,
  deleteFlashcard,
} from '../controllers/flashcardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateFlashcardsFromNote);
router.get('/', getFlashcards);
router.post('/', createFlashcard);
router.put('/:id', updateFlashcardDifficulty);
router.delete('/:id', deleteFlashcard);

export default router;
