import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '🏆',
  },
  points: {
    type: Number,
    default: 20,
  },
  criteriaType: {
    type: String,
    enum: ['streak', 'flashcard_count', 'quiz_perfect', 'quiz_count', 'note_count', 'peer_helpful', 'group_join'],
    required: true,
  },
  threshold: {
    type: Number,
    default: 1,
  },
});

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
