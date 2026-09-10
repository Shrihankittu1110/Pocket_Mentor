import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
  },
  subject: {
    type: String,
    default: 'General',
    trim: true,
  },
  topic: {
    type: String,
    default: 'General',
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    enum: ['text', 'pdf', 'docx', 'manual'],
    default: 'manual',
  },
  summary: {
    type: String,
    default: '',
  },
  quickRevision: {
    topic: { type: String, default: '' },
    overview: { type: String, default: '' },
    keyPoints: [{ type: String }],
    examples: [{ type: String }],
    durationSeconds: { type: Number, default: 60 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Note = mongoose.model('Note', noteSchema);
export default Note;
