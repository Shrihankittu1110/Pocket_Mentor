import Note from '../models/Note.js';
import { extractTextFromFile } from '../services/textExtractionService.js';
import { generateSummary, generateQuickRevision } from '../services/aiService.js';
import { awardPointsAndCheckAchievements } from '../services/gamificationService.js';

export const createNote = async (req, res) => {
  try {
    const { title, subject, topic, pasteContent } = req.body;
    let content = pasteContent ? pasteContent.trim() : '';
    let fileUrl = null;
    let fileType = 'manual';

    // If a file was uploaded via Multer
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      fileType = ext === 'pdf' ? 'pdf' : (ext.startsWith('doc') ? 'docx' : 'text');
      
      const extracted = await extractTextFromFile(req.file.path, req.file.originalname);
      content = (content ? content + '\n\n' : '') + extracted;
    }

    if (!content) {
      return res.status(400).json({ message: 'Please provide note text content or upload a valid document file.' });
    }

    const note = await Note.create({
      title: title || (req.file ? req.file.originalname.replace(/\.[^/.]+$/, '') : 'Untitled Note'),
      content,
      subject: subject || 'General',
      topic: topic || 'General',
      user: req.user._id,
      fileUrl,
      fileType,
    });

    // Award +20 points for creating a note and check achievements
    const gamification = await awardPointsAndCheckAchievements(req.user._id, 20, 'create_note');

    return res.status(201).json({
      note,
      gamification,
    });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create note' });
  }
};

export const getNotes = async (req, res) => {
  try {
    const { search, subject, topic } = req.query;
    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    if (topic && topic !== 'All') {
      query.topic = topic;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch notes' });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch note' });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content, subject, topic } = req.body;
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (title) note.title = title;
    if (content) note.content = content;
    if (subject) note.subject = subject;
    if (topic) note.topic = topic;

    await note.save();
    return res.json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update note' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete note' });
  }
};

export const generateNoteSummary = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const summary = await generateSummary(note.content, note.topic || note.title);
    note.summary = summary;
    await note.save();

    return res.json({ summary, noteId: note._id });
  } catch (error) {
    console.error('Generate summary error:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate summary' });
  }
};

export const generateNoteQuickRevision = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const quickRevision = await generateQuickRevision(note.content, note.topic || note.title);
    note.quickRevision = quickRevision;
    await note.save();

    return res.json({ quickRevision, noteId: note._id });
  } catch (error) {
    console.error('Generate quick revision error:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate quick revision' });
  }
};
