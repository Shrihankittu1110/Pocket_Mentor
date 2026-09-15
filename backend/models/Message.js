import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    default: '',
    trim: true,
  },
  attachment: {
    url: { type: String, default: null },
    name: { type: String, default: null },
    type: { type: String, default: null },
    size: { type: Number, default: 0 },
    mimetype: { type: String, default: null },
    fileKey: { type: String, default: null },
  },
  sharedNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
