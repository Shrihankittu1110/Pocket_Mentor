import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Answer content is required'],
  },
  helpfulVotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  loveVotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  isBestAnswer: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const peerPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
  },
  question: {
    type: String,
    required: [true, 'Question details are required'],
  },
  topic: {
    type: String,
    default: 'General',
    trim: true,
  },
  subject: {
    type: String,
    default: 'Computer Science',
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [answerSchema],
  tags: [{ type: String }],
  isResolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PeerPost = mongoose.model('PeerPost', peerPostSchema);
export default PeerPost;
