import User from '../models/User.js';

export const ACHIEVEMENTS_LIST = [
  {
    slug: 'first_note',
    title: 'First Note 📚',
    description: 'Uploaded your first set of study notes',
    icon: '📚',
    points: 20,
  },
  {
    slug: 'streak_3',
    title: '3-Day Fire 🔥',
    description: 'Maintained a 3-day learning streak',
    icon: '🔥',
    points: 30,
  },
  {
    slug: 'streak_7',
    title: '7-Day Streak Master ⚡',
    description: 'Duolingo-level dedication! Kept a 7-day streak',
    icon: '⚡',
    points: 50,
  },
  {
    slug: 'flashcard_master',
    title: 'Flashcard Master 🧠',
    description: 'Reviewed 20+ flashcards',
    icon: '🧠',
    points: 40,
  },
  {
    slug: 'quiz_champion',
    title: 'Quiz Champion 🎯',
    description: 'Scored 100% on a study quiz',
    icon: '🎯',
    points: 50,
  },
  {
    slug: 'helpful_mentor',
    title: 'Helpful Mentor 👨‍🏫',
    description: 'Received a helpful vote from a peer student',
    icon: '👨‍🏫',
    points: 35,
  },
  {
    slug: 'study_expert',
    title: 'Study Expert ⭐',
    description: 'Accumulated over 300 total knowledge points',
    icon: '⭐',
    points: 60,
  },
];

/**
 * Updates user streak based on last active date
 */
export const updateDailyStreak = async (user) => {
  const now = new Date();
  const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

  if (!lastActive) {
    user.dailyStreak = 1;
    user.longestStreak = Math.max(user.longestStreak || 1, 1);
    user.lastActiveDate = now;
    return { streakUpdated: true, currentStreak: user.dailyStreak };
  }

  // Calculate difference in calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

  let streakAward = 0;
  if (diffDays === 1) {
    // Consecutive day!
    user.dailyStreak += 1;
    if (user.dailyStreak > (user.longestStreak || 1)) {
      user.longestStreak = user.dailyStreak;
    }
    user.totalPoints += 20; // +20 points for maintaining streak
    streakAward = 20;
  } else if (diffDays > 1) {
    // Streak broken, reset to 1
    user.dailyStreak = 1;
  }
  // If diffDays === 0, same day activity, streak stays current

  user.lastActiveDate = now;
  return { streakAward, currentStreak: user.dailyStreak };
};

/**
 * Awards points and checks for achievement unlocks
 */
export const awardPointsAndCheckAchievements = async (userId, pointsAwarded, eventType, meta = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Update streak on any user activity
    await updateDailyStreak(user);

    user.totalPoints = (user.totalPoints || 0) + pointsAwarded;

    const unlockedNow = [];
    const currentSlugs = new Set((user.achievements || []).map(a => a.slug));

    // Check achievement rules
    if (eventType === 'create_note' && !currentSlugs.has('first_note')) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.slug === 'first_note');
      user.achievements.push({ ...ach, unlockedAt: new Date() });
      user.totalPoints += ach.points;
      unlockedNow.push(ach);
    }

    if (user.dailyStreak >= 3 && !currentSlugs.has('streak_3')) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.slug === 'streak_3');
      user.achievements.push({ ...ach, unlockedAt: new Date() });
      user.totalPoints += ach.points;
      unlockedNow.push(ach);
    }

    if (user.dailyStreak >= 7 && !currentSlugs.has('streak_7')) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.slug === 'streak_7');
      user.achievements.push({ ...ach, unlockedAt: new Date() });
      user.totalPoints += ach.points;
      unlockedNow.push(ach);
    }

    if (eventType === 'quiz_perfect' && !currentSlugs.has('quiz_champion')) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.slug === 'quiz_champion');
      user.achievements.push({ ...ach, unlockedAt: new Date() });
      user.totalPoints += ach.points;
      unlockedNow.push(ach);
    }

    if (eventType === 'helpful_vote' && !currentSlugs.has('helpful_mentor')) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.slug === 'helpful_mentor');
      user.achievements.push({ ...ach, unlockedAt: new Date() });
      user.totalPoints += ach.points;
      unlockedNow.push(ach);
    }

    if (user.totalPoints >= 300 && !currentSlugs.has('study_expert')) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.slug === 'study_expert');
      user.achievements.push({ ...ach, unlockedAt: new Date() });
      user.totalPoints += ach.points;
      unlockedNow.push(ach);
    }

    await user.save();
    return {
      totalPoints: user.totalPoints,
      dailyStreak: user.dailyStreak,
      longestStreak: user.longestStreak,
      unlockedAchievements: unlockedNow,
    };
  } catch (error) {
    console.error('Error in awardPointsAndCheckAchievements:', error);
    return null;
  }
};
