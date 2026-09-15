import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  getGroupMessages,
  postMessage,
  getGroupFile,
  deleteMessage,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { groupUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.post('/join', joinGroup); // join by groupCode in body
router.post('/:id/leave', leaveGroup);
router.get('/:id/messages', getGroupMessages);
router.post('/:id/message', groupUpload.single('file'), postMessage);
router.get('/:id/files/:filename', getGroupFile);
router.delete('/:id/messages/:messageId', deleteMessage);

export default router;


