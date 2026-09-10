import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Flame,
  Award,
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProgressPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, analRes] = await Promise.all([
          api.get('/progress'),
          api.get('/progress/analytics'),
        ]);
        setProgress(progRes.data);
        setAnalytics(analRes.data);
      } catch (err) {
        console.error('Failed to load progress analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-28">
        <div className="inline-block w-8 h-8 border-4 border-mentor-green border-t-transparent rounded-full animate-spin"></div>
        <p className="font-fun text-slate-500 font-bold mt-2">Compiling your learning analytics...</p>
      </div>
    );
  }

  // Days initialized with 0 if no analytics returned
  const weeklyData = analytics?.weeklyProgress && analytics.weeklyProgress.length === 7
    ? analytics.weeklyProgress
    : [
        { day: 'Sun', activities: 0 },
        { day: 'Mon', activities: 0 },
        { day: 'Tue', activities: 0 },
        { day: 'Wed', activities: 0 },
        { day: 'Thu', activities: 0 },
        { day: 'Fri', activities: 0 },
        { day: 'Sat', activities: 0 },
      ];

  const maxActivity = Math.max(...weeklyData.map(d => d.activities), 5);
  const userStreak = progress?.dailyStreak ?? user?.dailyStreak ?? 0;
  const userLongestStreak = progress?.longestStreak ?? user?.longestStreak ?? 0;
  const hasQuizzes = (progress?.quizzesCompleted || 0) > 0;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-mentor-green text-xs font-black uppercase mb-1 shadow-sm">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Performance & Analytics</span>
        </div>
        <h1 className="font-fun text-3xl font-black text-slate-900">
          📈 Learning Progress & Mastery
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Track your weekly study consistency, accuracy rates, and knowledge milestones
        </p>
      </div>

      {/* Streak Hero Card */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-duo-orange flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-xl hover:scale-[1.008] transition-all duration-200 group">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform duration-300">
            <Flame className="w-12 h-12 text-white fill-white animate-flame" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-amber-100 bg-white/20 px-3 py-0.5 rounded-full">
              Daily Habit Engine
            </span>
            <h2 className="font-fun text-3xl sm:text-4xl font-black">
              {userStreak} Day Streak
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm font-medium">
              Longest Streak: {userLongestStreak} Days • Keep learning daily!
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors duration-200">
          <p className="text-xs text-amber-100 font-bold uppercase">Total Points Earned</p>
          <p className="font-fun text-3xl font-black text-white">{progress?.totalPoints ?? user?.totalPoints ?? 0} XP</p>
          <span className="text-[11px] text-amber-200 font-medium">Earn XP with quizzes & flashcards</span>
        </div>
      </div>

      {/* 1. Weekly Activity Histogram Chart */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm hover:border-slate-300 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-fun text-xl font-bold text-slate-900">
              📅 Weekly Study Rhythm
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Activities completed per day over the last 7 days (increments with your study actions)
            </p>
          </div>
          <span className="text-xs font-extrabold text-mentor-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
            {weeklyData.reduce((acc, curr) => acc + curr.activities, 0) > 0 ? 'Active Learner' : 'Ready to Start'}
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 border-b border-slate-100">
          {weeklyData.map((d, i) => {
            const hasActivity = d.activities > 0;
            const heightPct = hasActivity
              ? Math.max(16, Math.round((d.activities / maxActivity) * 100))
              : 6; // Low subtle baseline for 0 activities
            const isToday = i === weeklyData.length - 1;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-default">
                <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white px-2 py-0.5 rounded-md shadow-md border border-slate-200 whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                  {d.activities} {d.activities === 1 ? 'activity' : 'activities'}
                </span>
                <div
                  className={`w-full max-w-[48px] rounded-2xl transition-all duration-300 shadow-sm group-hover:scale-105 group-hover:brightness-105 ${
                    hasActivity
                      ? isToday
                        ? 'bg-gradient-to-t from-mentor-orange to-amber-400 shadow-duo-orange'
                        : 'bg-gradient-to-t from-mentor-green to-emerald-400 shadow-duo-green'
                      : 'bg-slate-200/70 group-hover:bg-slate-300'
                  }`}
                  style={{ height: `${heightPct}%`, minHeight: hasActivity ? '24px' : '8px' }}
                />
                <span className={`font-fun text-xs font-black transition-colors duration-200 ${isToday ? 'text-mentor-orange' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Core Mastery Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Avg Quiz Score */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm hover:-translate-y-1 hover:shadow-duo hover:border-blue-300 transition-all duration-200 group cursor-default">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-mentor-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Quiz Score</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {hasQuizzes ? `${progress?.averageScore ?? 0}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Cards Mastered */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm hover:-translate-y-1 hover:shadow-duo hover:border-purple-300 transition-all duration-200 group cursor-default">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-mentor-purple flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cards Mastered</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {progress?.flashcardsCount ?? 0}
            </p>
          </div>
        </div>

        {/* Notes Studied */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm hover:-translate-y-1 hover:shadow-duo hover:border-emerald-300 transition-all duration-200 group cursor-default">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-mentor-green flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes Studied</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {progress?.notesCount ?? 0}
            </p>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-2 shadow-sm hover:-translate-y-1 hover:shadow-duo hover:border-amber-300 transition-all duration-200 group cursor-default">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Time</p>
            <p className="font-fun text-2xl font-black text-slate-900 mt-1">
              {analytics?.totalStudyMinutes ?? 0} mins
            </p>
          </div>
        </div>

      </div>

      {/* 3. Strong Topics vs Weak Topics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strong Topics */}
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-6 space-y-4 shadow-sm hover:border-emerald-300 hover:shadow-duo transition-all duration-200">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-mentor-green" />
            <h3 className="font-fun text-lg font-bold">Strong Topics (Mastered)</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Topics where your quiz accuracy is consistently 75% or higher
          </p>

          <div className="flex flex-wrap gap-2">
            {analytics?.strongTopics && analytics.strongTopics.length > 0 ? (
              analytics.strongTopics.map((st, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl hover:bg-emerald-100 hover:scale-105 transition-all duration-150 cursor-default"
                >
                  ✅ {st}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium italic py-2">
                No strong topics recorded yet. Complete quizzes to showcase topics you master!
              </p>
            )}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="bg-white rounded-3xl border-2 border-red-200 p-6 space-y-4 shadow-sm hover:border-red-300 hover:shadow-duo transition-all duration-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5 text-mentor-red" />
            <h3 className="font-fun text-lg font-bold">Topics Needing Revision</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Flagged from missed quiz questions. Review these to boost your exam readiness!
          </p>

          <div className="flex flex-wrap gap-2">
            {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
              analytics.weakTopics.map((wt, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 hover:scale-105 transition-all duration-150 cursor-default"
                >
                  ❌ {wt}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium italic py-2">
                No weak topics found! Complete quizzes to identify areas to improve.
              </p>
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/flashcards"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-mentor-red hover:underline hover:translate-x-1 transition-transform duration-150"
            >
              <span>Practice Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProgressPage;
