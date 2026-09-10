import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  postMessage,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.post('/join', joinGroup); // join by groupCode in body
router.post('/:id/leave', leaveGroup);
router.get('/:id/messages', getGroupMessages);
router.post('/:id/message', postMessage);

export default router;
