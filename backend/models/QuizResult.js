import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  score: {
    type: Number,
    required: true, // percentage 0 - 100
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  correctAnswers: {
    type: Number,
    required: true,
  },
  wrongAnswers: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0,
  },
  weakTopics: [{
    type: String,
  }],
  userAnswers: [
    {
      questionIndex: Number,
      questionText: String,
      selectedAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      explanation: String,
      topic: String,
    },
  ],
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);
export default QuizResult;
