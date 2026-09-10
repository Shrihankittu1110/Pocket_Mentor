import StudyGroup from '../models/StudyGroup.js';
import Message from '../models/Message.js';
import { awardPointsAndCheckAchievements } from '../services/gamificationService.js';

export const createGroup = async (req, res) => {
  try {
    const { name, description, subject } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await StudyGroup.create({
      name,
      description: description || '',
      subject: subject || 'General Study',
      admin: req.user._id,
      members: [req.user._id],
    });

    // Award +25 XP points for creating a study group
    await awardPointsAndCheckAchievements(req.user._id, 25, 'group_join');

    const populated = await StudyGroup.findById(group._id).populate('admin', 'name email profileImage');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create group' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { groupCode: search.toUpperCase() },
      ];
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

    return res.json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch group' });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { groupCode } = req.body;
    let group;

    if (groupCode) {
      group = await StudyGroup.findOne({ groupCode: groupCode.toUpperCase() });
    } else {
      group = await StudyGroup.findById(req.params.id);
    }

    if (!group) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this study group' });
    }

    group.members.push(req.user._id);
    await group.save();

    // Award +15 XP for joining community group
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

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();

    return res.json({ message: 'Left group successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to leave group' });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
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

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message text cannot be empty' });
    }

    const newMessage = await Message.create({
      group: req.params.id,
      sender: req.user._id,
      message: message.trim(),
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
