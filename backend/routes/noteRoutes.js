import express from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  generateNoteSummary,
  generateNoteQuickRevision,
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

router.post('/:id/summary', generateNoteSummary);
router.post('/:id/quick-revision', generateNoteQuickRevision);

export default router;
