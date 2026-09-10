import Note from '../models/Note.js';
import Flashcard from '../models/Flashcard.js';
import QuizResult from '../models/QuizResult.js';
import User from '../models/User.js';
import { ACHIEVEMENTS_LIST } from '../services/gamificationService.js';

export const getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notesCount, flashcardsCount, quizResults, user] = await Promise.all([
      Note.countDocuments({ user: userId }),
      Flashcard.countDocuments({ user: userId }),
      QuizResult.find({ user: userId }),
      User.findById(userId),
    ]);

    const quizzesCompleted = quizResults.length;
    const avgScore = quizzesCompleted > 0
      ? Math.round(quizResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizzesCompleted)
      : 0;

    // Calculate today's activities
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayNotes, todayQuizzes] = await Promise.all([
      Note.countDocuments({ user: userId, createdAt: { $gte: startOfToday } }),
      QuizResult.countDocuments({ user: userId, completedAt: { $gte: startOfToday } }),
    ]);

    // Daily target = 5 activities (notes, quizzes, flashcards)
    const todayCompletedActivities = todayNotes + todayQuizzes;
    const dailyGoalTarget = 5;

    return res.json({
      dailyStreak: user.dailyStreak || 0,
      longestStreak: user.longestStreak || 0,
      totalPoints: user.totalPoints || 0,
      notesCount,
      flashcardsCount,
      quizzesCompleted,
      averageScore: avgScore,
      achievements: user.achievements || [],
      allAvailableAchievements: ACHIEVEMENTS_LIST,
      todayProgress: {
        completed: Math.min(todayCompletedActivities, dailyGoalTarget),
        target: dailyGoalTarget,
        percentage: Math.min(Math.round((todayCompletedActivities / dailyGoalTarget) * 100), 100),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch progress' });
  }
};

export const getStreakInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('dailyStreak longestStreak lastActiveDate totalPoints');
    return res.json({
      currentStreak: user.dailyStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActiveDate: user.lastActiveDate,
      totalPoints: user.totalPoints || 0,
      streakActiveToday: (user.dailyStreak || 0) > 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch streak info' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const [quizResults, notes, flashcards] = await Promise.all([
      QuizResult.find({ user: userId }).sort({ completedAt: -1 }),
      Note.find({ user: userId }).select('createdAt'),
      Flashcard.find({ user: userId }).select('createdAt lastReviewed'),
    ]);

    // Aggregate topic performance
    const topicStats = {};
    const weakTopicsSet = new Set();
    const strongTopicsSet = new Set();

    quizResults.forEach(qr => {
      (qr.weakTopics || []).forEach(wt => weakTopicsSet.add(wt));

      (qr.userAnswers || []).forEach(ans => {
        const topic = ans.topic || 'General';
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, total: 0 };
        }
        topicStats[topic].total += 1;
        if (ans.isCorrect) topicStats[topic].correct += 1;
      });
    });

    Object.keys(topicStats).forEach(topic => {
      const acc = topicStats[topic].correct / topicStats[topic].total;
      if (acc >= 0.75) {
        strongTopicsSet.add(topic);
      } else {
        weakTopicsSet.add(topic);
      }
    });

    // Aggregate real activity over the last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const quizCount = quizResults.filter(q => q.completedAt >= startOfDay && q.completedAt <= endOfDay).length;
      const noteCount = notes.filter(n => n.createdAt >= startOfDay && n.createdAt <= endOfDay).length;
      const cardCount = flashcards.filter(f => (f.lastReviewed && f.lastReviewed >= startOfDay && f.lastReviewed <= endOfDay) || (f.createdAt >= startOfDay && f.createdAt <= endOfDay)).length;

      const totalActivitiesOnDay = quizCount + noteCount + cardCount;

      weeklyData.push({
        day: dayName,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        activities: totalActivitiesOnDay, // Starts strictly from 0 and increments with actual student actions!
      });
    }

    // Realistic study minutes: ~8 mins per note, ~5 mins per quiz, ~2 mins per flashcard
    const totalStudyMinutes = (notes.length * 8) + (quizResults.length * 5) + Math.min(flashcards.length * 2, 60);

    const averageAccuracy = quizResults.length > 0 
      ? Math.round(quizResults.reduce((sum, q) => sum + (q.score || 0), 0) / quizResults.length)
      : 0;

    return res.json({
      weeklyProgress: weeklyData,
      weakTopics: Array.from(weakTopicsSet).slice(0, 6),
      strongTopics: Array.from(strongTopicsSet).slice(0, 6),
      totalStudyMinutes,
      totalQuizzes: quizResults.length,
      averageAccuracy,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch analytics' });
  }
};
