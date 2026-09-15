import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import StudyGroup from '../models/StudyGroup.js';
import Message from '../models/Message.js';
import { awardPointsAndCheckAchievements } from '../services/gamificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Helper to determine file category
 */
export const getFileTypeCategory = (filename, mimetype) => {
  const ext = path.extname(filename || '').toLowerCase();
  const mime = (mimetype || '').toLowerCase();

  if (ext === '.pdf' || mime.includes('pdf')) return 'pdf';
  if (
    ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return 'image';
  }
  if (
    ['.doc', '.docx'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml')
  ) {
    return 'doc';
  }
  if (
    ['.ppt', '.pptx'].includes(ext) ||
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return 'ppt';
  }
  if (['.txt', '.md'].includes(ext) || mime.startsWith('text/')) {
    return 'text';
  }
  return 'file';
};

/**
 * Helper to check if a user is an authorized member or admin of a study group
 */
export const isUserGroupMember = (group, userId) => {
  if (!group || !userId) return false;
  const uidStr = userId.toString();
  if (group.admin && (group.admin._id || group.admin).toString() === uidStr) {
    return true;
  }
  if (Array.isArray(group.members)) {
    return group.members.some(m => (m._id || m).toString() === uidStr);
  }
  return false;
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, subject } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await StudyGroup.create({
      name: name.trim(),
      description: (description || '').trim(),
      subject: (subject || 'General Study').trim(),
      admin: req.user._id,
      members: [req.user._id],
    });

    // Award +25 XP points for creating a study group
    await awardPointsAndCheckAchievements(req.user._id, 25, 'group_join');

    const populated = await StudyGroup.findById(group._id)
      .populate('admin', 'name email profileImage')
      .populate('members', 'name email profileImage');

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create group' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user._id;

    // Strictly only show groups the current user created (admin) or joined (member)
    let query = {
      $or: [
        { admin: userId },
        { members: userId },
      ],
    };

    if (search && search.trim()) {
      const term = search.trim();
      query = {
        $and: [
          {
            $or: [
              { admin: userId },
              { members: userId },
            ],
          },
          {
            $or: [
              { name: { $regex: term, $options: 'i' } },
              { subject: { $regex: term, $options: 'i' } },
              { description: { $regex: term, $options: 'i' } },
              { groupCode: term.toUpperCase() },
            ],
          },
        ],
      };
    }

    const groups = await StudyGroup.find(query)
      .populate('admin', 'name email profileImage')
      .populate('members', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch groups' });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate('admin', 'name email profileImage')
      .populate('members', 'name email profileImage');

    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!isUserGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this study group' });
    }

    return res.json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch group' });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { groupCode } = req.body;
    const targetId = req.params.id;

    if (!groupCode || !groupCode.trim()) {
      return res.status(400).json({ message: 'Valid 6-character group code is required to join a private study group' });
    }

    const cleanCode = groupCode.trim().toUpperCase();
    let group = null;

    if (targetId) {
      group = await StudyGroup.findById(targetId);
      if (!group) {
        return res.status(404).json({ message: 'Study group not found' });
      }
      if (group.groupCode !== cleanCode) {
        return res.status(400).json({ message: 'Invalid group code for this study group' });
      }
    } else {
      group = await StudyGroup.findOne({ groupCode: cleanCode });
    }

    if (!group) {
      return res.status(404).json({ message: 'Study group with that code not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this study group' });
    }

    group.members.push(req.user._id);
    await group.save();

    // Award +15 XP for joining study group
    const gamification = await awardPointsAndCheckAchievements(req.user._id, 15, 'group_join');

    const updated = await StudyGroup.findById(group._id)
      .populate('admin', 'name email profileImage')
      .populate('members', 'name email profileImage');

    return res.json({ group: updated, gamification });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to join group' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const userIdStr = req.user._id.toString();
    const isMember = group.members.some(m => m.toString() === userIdStr);

    if (!isMember && group.admin.toString() !== userIdStr) {
      return res.status(403).json({ message: 'You are not a member of this study group' });
    }

    group.members = group.members.filter(m => m.toString() !== userIdStr);
    await group.save();

    return res.json({ message: 'Left group successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to leave group' });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!isUserGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this study group' });
    }

    const messages = await Message.find({ group: req.params.id })
      .populate('sender', 'name email profileImage')
      .populate('sharedNote', 'title topic subject')
      .sort({ createdAt: 1 })
      .limit(100);

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch messages' });
  }
};

export const postMessage = async (req, res) => {
  try {
    const { message, sharedNoteId } = req.body;
    const hasMessage = message && message.trim().length > 0;
    const hasFile = !!req.file;

    if (!hasMessage && !hasFile) {
      return res.status(400).json({ message: 'Please provide a message or attach a file.' });
    }

    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!isUserGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You cannot post messages to a study group you have not joined' });
    }

    let attachmentData = null;

    if (req.file) {
      const fileType = getFileTypeCategory(req.file.originalname, req.file.mimetype);
      attachmentData = {
        url: `/api/groups/${group._id}/files/${req.file.filename}`,
        name: req.file.originalname,
        type: fileType,
        size: req.file.size,
        mimetype: req.file.mimetype,
        fileKey: req.file.filename,
      };
    }

    const newMessage = await Message.create({
      group: req.params.id,
      sender: req.user._id,
      message: (message || '').trim(),
      attachment: attachmentData,
      sharedNote: sharedNoteId || null,
    });

    const populated = await Message.findById(newMessage._id)
      .populate('sender', 'name email profileImage')
      .populate('sharedNote', 'title topic subject');

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to send message' });
  }
};

/**
 * Securely stream/download an attachment belonging to a study group.
 * Strictly verifies that the authenticated user is an authorized member or admin of the group.
 */
export const getGroupFile = async (req, res) => {
  try {
    const { id, filename } = req.params;

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!isUserGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this study group' });
    }

    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Attachment file not found' });
    }

    const isDownload = req.query.download === 'true' || req.query.download === '1';
    const downloadName = req.query.name ? path.basename(req.query.name) : safeFilename;

    if (isDownload) {
      return res.download(filePath, downloadName);
    }

    // Set correct Content-Type for in-browser preview / safe streaming
    const ext = path.extname(safeFilename).toLowerCase();
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    if (mimeMap[ext]) {
      res.setHeader('Content-Type', mimeMap[ext]);
    }

    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve attachment file' });
  }
};

/**
 * Delete a study group message.
 * Only the message sender or the study group admin can delete a message.
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!isUserGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this study group' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.group.toString() !== group._id.toString()) {
      return res.status(400).json({ message: 'Message does not belong to this study group' });
    }

    const isSender = message.sender.toString() === req.user._id.toString();
    const isAdmin = group.admin.toString() === req.user._id.toString();

    if (!isSender && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this message' });
    }

    // Clean up attachment file from disk if present
    if (message.attachment?.fileKey) {
      const filePath = path.join(uploadsDir, message.attachment.fileKey);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('Failed to delete attachment file from disk:', unlinkErr.message);
        }
      }
    }

    await Message.findByIdAndDelete(messageId);

    return res.json({ message: 'Message deleted successfully', messageId });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete message' });
  }
};


