import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
  },
  topic: {
    type: String,
    default: 'General',
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  options: [
    {
      type: String,
      trim: true,
    },
  ],
  correctAnswer: {
    type: String,
    trim: true,
  },
  questionType: {
    type: String,
    enum: ['standard', 'mcq', 'true_false', 'fill_blank'],
    default: 'standard',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: null,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  lastReviewed: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
export default Flashcard;
